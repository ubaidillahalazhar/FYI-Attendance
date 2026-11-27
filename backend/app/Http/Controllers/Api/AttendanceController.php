<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceReportResource;
use App\Models\Attendance;
use App\Models\Employee;
use App\Services\AttendanceCalculatorService;
use App\Services\GeofenceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly GeofenceService $geofenceService,
        private readonly AttendanceCalculatorService $calculatorService
    ) {}

    /**
     * Admin Report (20 Columns) with PostgreSQL ILIKE search + month/date filters.
     */
    public function adminReport(Request $request): JsonResponse
    {
        $query = Attendance::with(['employee', 'shift'])
            ->orderByDesc('attendance_date')
            ->orderBy('employee_id');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('employee_no', 'ILIKE', "%{$search}%");
            });
        }

        if ($month = $request->string('month')->trim()->toString()) {
            // PostgreSQL-friendly YYYY-MM filter
            $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth()->toDateString();
            $end = Carbon::createFromFormat('Y-m', $month)->endOfMonth()->toDateString();
            $query->whereBetween('attendance_date', [$start, $end]);
        }

        if ($date = $request->string('date')->trim()->toString()) {
            $query->whereDate('attendance_date', $date);
        }

        $records = $query->get();

        return response()->json([
            'data' => AttendanceReportResource::collection($records),
        ]);
    }

    /**
     * 1-Month Attendance History for a single employee (Side-Drawer & Employee Modal).
     */
    public function employeeMonthlyHistory(Request $request, Employee $employee): JsonResponse
    {
        $query = $employee->attendances()
            ->with(['employee', 'shift'])
            ->orderByDesc('attendance_date');

        if ($month = $request->string('month')->trim()->toString()) {
            $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth()->toDateString();
            $end = Carbon::createFromFormat('Y-m', $month)->endOfMonth()->toDateString();
            $query->whereBetween('attendance_date', [$start, $end]);
        } else {
            $query->where('attendance_date', '>=', now()->subDays(30)->toDateString());
        }

        return response()->json([
            'data' => AttendanceReportResource::collection($query->get()),
        ]);
    }

    public function myHistory(Request $request): JsonResponse
    {
        return $this->employeeMonthlyHistory($request, $request->user()->employee);
    }

    /**
     * Clock In with Geofencing Radius Validation.
     */
    public function clockIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $geo = $this->geofenceService->validateLocation(
            (float) $validated['latitude'],
            (float) $validated['longitude']
        );

        if (!$geo['is_valid']) {
            return response()->json([
                'message' => "Outside office geofence radius ({$geo['distance_meters']}m > {$geo['allowed_radius']}m).",
                'geofence' => $geo,
            ], 422);
        }

        $employee = $request->user()->employee->load('shift');
        $today = now()->toDateString();
        $nowTime = now()->format('H:i:s');

        $existing = Attendance::where('employee_id', $employee->id)
            ->whereDate('attendance_date', $today)
            ->first();

        if ($existing && $existing->actual_in) {
            return response()->json([
                'message' => 'Employee has already clocked in today.',
            ], 409);
        }

        $metrics = $this->calculatorService->calculate(
            $employee->shift->shift_in,
            $employee->shift->shift_out,
            $nowTime,
            null,
            $employee->shift->schedule_minutes,
            0
        );

        $attendance = Attendance::updateOrCreate(
            ['employee_id' => $employee->id, 'attendance_date' => $today],
            [
                'shift_id' => $employee->shift_id,
                'actual_in' => $nowTime,
                'clock_in_lat' => $validated['latitude'],
                'clock_in_lng' => $validated['longitude'],
                'distance_in_meters' => $geo['distance_meters'],
                ...$metrics,
            ]
        );

        $attendance->load(['employee', 'shift']);

        return response()->json([
            'message' => 'Clock In recorded successfully.',
            'geofence' => $geo,
            'data' => new AttendanceReportResource($attendance),
        ], 201);
    }

    /**
     * Clock Out with Geofencing Validation and Working Minute Calculation.
     */
    public function clockOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $geo = $this->geofenceService->validateLocation(
            (float) $validated['latitude'],
            (float) $validated['longitude']
        );

        if (!$geo['is_valid']) {
            return response()->json([
                'message' => "Outside office geofence radius ({$geo['distance_meters']}m > {$geo['allowed_radius']}m).",
                'geofence' => $geo,
            ], 422);
        }

        $today = now()->toDateString();
        $attendance = Attendance::with(['employee', 'shift'])
            ->where('employee_id', $request->user()->employee_id)
            ->whereDate('attendance_date', $today)
            ->first();

        if (!$attendance || !$attendance->actual_in) {
            return response()->json([
                'message' => 'Cannot clock out before clocking in.',
            ], 422);
        }

        $nowTime = now()->format('H:i:s');

        $metrics = $this->calculatorService->calculate(
            $attendance->shift->shift_in,
            $attendance->shift->shift_out,
            $attendance->actual_in,
            $nowTime,
            $attendance->shift->schedule_minutes,
            $attendance->overtime_minutes
        );

        $attendance->update([
            'actual_out' => $nowTime,
            'clock_out_lat' => $validated['latitude'],
            'clock_out_lng' => $validated['longitude'],
            ...$metrics,
        ]);

        return response()->json([
            'message' => 'Clock Out recorded successfully.',
            'data' => new AttendanceReportResource($attendance->fresh(['employee', 'shift'])),
        ]);
    }

    /**
     * Stream Excel-compatible CSV (UTF-8 BOM) with the exact 20 columns.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $query = Attendance::with(['employee', 'shift'])
            ->orderByDesc('attendance_date');

        if ($employeeId = $request->integer('employee_id')) {
            $query->where('employee_id', $employeeId);
        }

        if ($month = $request->string('month')->trim()->toString()) {
            $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth()->toDateString();
            $end = Carbon::createFromFormat('Y-m', $month)->endOfMonth()->toDateString();
            $query->whereBetween('attendance_date', [$start, $end]);
        }

        $rows = $query->get();
        $filename = 'geoattend-report-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM for Microsoft Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, [
                'No.', 'Employee No.', 'Employee Name', 'Date', 'Position',
                'Shift Name', 'Shift In', 'Shift Out', 'Actual In', 'Actual Out',
                'Minute In', 'Minute Out', 'Actual Working Minute', 'Shift Schedule Minute',
                'Remark', 'Overtime Reason', 'Overtime Start', 'Overtime End',
                'Overtime Minute(s)', 'Overtime Hour(s)',
            ]);

            foreach ($rows as $index => $row) {
                fputcsv($handle, [
                    $index + 1,
                    $row->employee->employee_no,
                    $row->employee->name,
                    $row->attendance_date->format('Y-m-d'),
                    $row->employee->position,
                    $row->shift->name,
                    substr($row->shift->shift_in, 0, 5),
                    substr($row->shift->shift_out, 0, 5),
                    $row->actual_in ? substr($row->actual_in, 0, 5) : '-',
                    $row->actual_out ? substr($row->actual_out, 0, 5) : '-',
                    $row->minute_in,
                    $row->minute_out,
                    $row->actual_working_minute,
                    $row->shift_schedule_minute,
                    $row->remark,
                    $row->overtime_reason ?: '-',
                    $row->overtime_start ? substr($row->overtime_start, 0, 5) : '-',
                    $row->overtime_end ? substr($row->overtime_end, 0, 5) : '-',
                    $row->overtime_minutes,
                    number_format((float) $row->overtime_hours, 2),
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
