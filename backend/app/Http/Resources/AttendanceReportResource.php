<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employeeId' => $this->employee_id,
            'employeeNo' => $this->employee->employee_no,
            'employeeName' => $this->employee->name,
            'position' => $this->employee->position,
            'department' => $this->employee->department,
            'date' => optional($this->attendance_date)->format('Y-m-d'),
            'shiftName' => $this->shift->name,
            'shiftIn' => substr($this->shift->shift_in, 0, 5),
            'shiftOut' => substr($this->shift->shift_out, 0, 5),
            'actualIn' => $this->actual_in ? substr($this->actual_in, 0, 5) : '',
            'actualOut' => $this->actual_out ? substr($this->actual_out, 0, 5) : '',
            'minuteIn' => (int) $this->minute_in,
            'minuteOut' => (int) $this->minute_out,
            'actualWorkingMinute' => (int) $this->actual_working_minute,
            'shiftScheduleMinute' => (int) $this->shift_schedule_minute,
            'remark' => $this->remark,
            'overtimeReason' => $this->overtime_reason ?: '-',
            'overtimeStart' => $this->overtime_start ? substr($this->overtime_start, 0, 5) : '-',
            'overtimeEnd' => $this->overtime_end ? substr($this->overtime_end, 0, 5) : '-',
            'overtimeMinutes' => (int) $this->overtime_minutes,
            'overtimeHours' => (float) $this->overtime_hours,
        ];
    }
}
