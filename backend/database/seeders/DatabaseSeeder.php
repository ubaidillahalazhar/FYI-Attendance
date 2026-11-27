<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Shift;
use App\Services\AttendanceCalculatorService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $regular = Shift::firstOrCreate(
            ['name' => 'Regular Office'],
            ['shift_in' => '08:00:00', 'shift_out' => '17:00:00', 'schedule_minutes' => 540]
        );
        $morning = Shift::firstOrCreate(
            ['name' => 'Morning Shift A'],
            ['shift_in' => '07:00:00', 'shift_out' => '16:00:00', 'schedule_minutes' => 540]
        );
        $mid = Shift::firstOrCreate(
            ['name' => 'Mid Shift B'],
            ['shift_in' => '09:00:00', 'shift_out' => '18:00:00', 'schedule_minutes' => 540]
        );

        $employeesData = [
            ['EMP-2024-001', 'Budi Santoso', 'budi.santoso@company.co.id', 'Senior Frontend Engineer', 'Engineering', $regular->id, 'BS'],
            ['EMP-2024-002', 'Siti Rahmawati', 'siti.rahmawati@company.co.id', 'UI/UX Designer', 'Product Design', $regular->id, 'SR'],
            ['EMP-2024-003', 'Andi Pratama', 'andi.pratama@company.co.id', 'Backend Developer', 'Engineering', $morning->id, 'AP'],
            ['EMP-2024-004', 'Dewi Lestari', 'dewi.lestari@company.co.id', 'HR Operations Specialist', 'Human Resources', $regular->id, 'DL'],
            ['EMP-2024-005', 'Reza Mahendra', 'reza.mahendra@company.co.id', 'Production Supervisor', 'Operations', $morning->id, 'RM'],
            ['EMP-2024-006', 'Nadia Kusuma', 'nadia.kusuma@company.co.id', 'QA Automation Engineer', 'Engineering', $mid->id, 'NK'],
        ];

        $employees = [];
        foreach ($employeesData as [$no, $name, $email, $pos, $dept, $shiftId, $initials]) {
            $employees[] = Employee::firstOrCreate(
                ['employee_no' => $no],
                [
                    'name' => $name,
                    'email' => $email,
                    'position' => $pos,
                    'department' => $dept,
                    'shift_id' => $shiftId,
                    'avatar_initials' => $initials,
                ]
            );
        }

        $calculator = new AttendanceCalculatorService();
        $otReasons = [
            'Production hotfix deployment',
            'Monthly payroll reconciliation',
            'Client demo preparation',
            'Database migration monitoring',
        ];

        for ($dayOffset = 1; $dayOffset <= 28; $dayOffset++) {
            $date = Carbon::today()->subDays($dayOffset);
            if ($date->isWeekend()) {
                continue;
            }

            foreach ($employees as $idx => $employee) {
                $employee->loadMissing('shift');
                $seed = ($dayOffset * 13 + $idx * 7) % 10;

                $shiftIn = Carbon::parse($employee->shift->shift_in);
                $shiftOut = Carbon::parse($employee->shift->shift_out);

                $inOffset = in_array($seed, [2, 7], true) ? (12 + $seed * 2) : -($seed + 2);
                $actualIn = $shiftIn->copy()->addMinutes($inOffset)->format('H:i:s');

                $hasOt = in_array($seed, [1, 6], true);
                $otMinutes = $hasOt ? ($seed === 1 ? 120 : 90) : 0;
                $actualOut = $shiftOut->copy()->addMinutes($hasOt ? $otMinutes : 5)->format('H:i:s');

                $metrics = $calculator->calculate(
                    $employee->shift->shift_in,
                    $employee->shift->shift_out,
                    $actualIn,
                    $actualOut,
                    $employee->shift->schedule_minutes,
                    $otMinutes
                );

                Attendance::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'attendance_date' => $date->toDateString(),
                    ],
                    [
                        'shift_id' => $employee->shift_id,
                        'actual_in' => $actualIn,
                        'actual_out' => $actualOut,
                        'clock_in_lat' => config('geofence.office_lat'),
                        'clock_in_lng' => config('geofence.office_lng'),
                        'clock_out_lat' => config('geofence.office_lat'),
                        'clock_out_lng' => config('geofence.office_lng'),
                        'distance_in_meters' => 25,
                        'overtime_reason' => $hasOt ? $otReasons[($dayOffset + $idx) % count($otReasons)] : null,
                        'overtime_start' => $hasOt ? $employee->shift->shift_out : null,
                        'overtime_end' => $hasOt ? $actualOut : null,
                        'overtime_minutes' => $otMinutes,
                        'overtime_hours' => round($otMinutes / 60, 2),
                        ...$metrics,
                    ]
                );
            }
        }
    }
}
