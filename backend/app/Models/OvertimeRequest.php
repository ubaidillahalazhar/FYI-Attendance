<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OvertimeRequest extends Model
{
    protected $fillable = [
        'employee_id',
        'overtime_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'reason',
        'status',
    ];

    protected $casts = [
        'overtime_date' => 'date:Y-m-d',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
