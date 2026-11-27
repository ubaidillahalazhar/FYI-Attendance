<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\OvertimeRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OvertimeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = OvertimeRequest::with('employee')->orderByDesc('overtime_date');

        if ($employeeId = $request->integer('employee_id')) {
            $query->where('employee_id', $employeeId);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'overtime_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $employee = $request->user()->employee;
        $start = Carbon::createFromFormat('H:i', $validated['start_time']);
        $end = Carbon::createFromFormat('H:i', $validated['end_time']);
        $durationMinutes = (int) $start->diffInMinutes($end);
        $durationHours = round($durationMinutes / 60, 2);

        $otRequest = OvertimeRequest::create([
            'employee_id' => $employee->id,
            'overtime_date' => $validated['overtime_date'],
            'start_time' => $validated['start_time'] . ':00',
            'end_time' => $validated['end_time'] . ':00',
            'duration_minutes' => $durationMinutes,
            'reason' => $validated['reason'],
            'status' => 'Pending',
        ]);

        // Sync overtime metadata into attendance table if record exists
        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('attendance_date', $validated['overtime_date'])
            ->first();

        if ($attendance) {
            $attendance->update([
                'overtime_reason' => $validated['reason'],
                'overtime_start' => $validated['start_time'] . ':00',
                'overtime_end' => $validated['end_time'] . ':00',
                'overtime_minutes' => $durationMinutes,
                'overtime_hours' => $durationHours,
                'remark' => $attendance->minute_in > 0 ? 'Late & Overtime' : 'Overtime',
            ]);
        }

        return response()->json([
            'message' => 'Overtime request submitted successfully.',
            'data' => $otRequest,
        ], 201);
    }

    public function updateStatus(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:Pending,Approved,Rejected'],
        ]);

        $overtimeRequest->update(['status' => $validated['status']]);

        return response()->json([
            'message' => "Overtime request marked as {$validated['status']}.",
            'data' => $overtimeRequest,
        ]);
    }
}
