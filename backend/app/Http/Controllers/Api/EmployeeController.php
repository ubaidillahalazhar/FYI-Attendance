<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;

class EmployeeController extends Controller
{
    public function index(): JsonResponse
    {
        $employees = Employee::with('shift')->orderBy('employee_no')->get();

        return response()->json([
            'data' => $employees->map(fn (Employee $emp) => [
                'id' => $emp->id,
                'employeeNo' => $emp->employee_no,
                'name' => $emp->name,
                'email' => $emp->email,
                'position' => $emp->position,
                'department' => $emp->department,
                'shiftName' => $emp->shift->name,
                'shiftIn' => substr($emp->shift->shift_in, 0, 5),
                'shiftOut' => substr($emp->shift->shift_out, 0, 5),
                'shiftScheduleMinute' => $emp->shift->schedule_minutes,
                'avatarInitials' => $emp->avatar_initials,
            ]),
        ]);
    }
}
