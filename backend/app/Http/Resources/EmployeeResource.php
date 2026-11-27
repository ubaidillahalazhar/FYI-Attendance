<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Employee */
class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employeeNo' => $this->employee_no,
            'name' => $this->name,
            'email' => $this->email,
            'position' => $this->position,
            'department' => $this->department,
            'shiftName' => $this->shift->name,
            'shiftIn' => substr($this->shift->shift_in, 0, 5),
            'shiftOut' => substr($this->shift->shift_out, 0, 5),
            'shiftScheduleMinute' => $this->shift->schedule_minutes,
            'avatarInitials' => $this->avatar_initials,
        ];
    }
}
