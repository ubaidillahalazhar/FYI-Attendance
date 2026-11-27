<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    protected $fillable = [
        'name',
        'shift_in',
        'shift_out',
        'schedule_minutes',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
