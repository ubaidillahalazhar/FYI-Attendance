<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'employee_id',
        'shift_id',
        'attendance_date',
        'actual_in',
        'actual_out',
        'clock_in_lat',
        'clock_in_lng',
        'clock_out_lat',
        'clock_out_lng',
        'distance_in_meters',
        'minute_in',
        'minute_out',
        'actual_working_minute',
        'shift_schedule_minute',
        'remark',
        'overtime_reason',
        'overtime_start',
        'overtime_end',
        'overtime_minutes',
        'overtime_hours',
    ];

    protected $casts = [
        'attendance_date' => 'date:Y-m-d',
        'overtime_hours' => 'float',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }
}
