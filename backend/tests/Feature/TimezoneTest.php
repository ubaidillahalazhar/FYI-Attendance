<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Shift;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TimezoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_app_timezone_is_jakarta_and_clock_in_uses_it(): void
    {
        $this->assertSame('Asia/Jakarta', config('app.timezone'));

        $this->travelTo(Carbon::parse('2026-11-27 08:10:00', 'Asia/Jakarta'));
        $shift = Shift::create(['name' => 'Pagi', 'shift_in' => '08:00', 'shift_out' => '17:00', 'schedule_minutes' => 540]);
        $emp = Employee::create([
            'employee_no' => 'EMP-1', 'name' => 'Emp', 'email' => 'e@x.id', 'position' => 'S',
            'department' => 'IT', 'shift_id' => $shift->id, 'avatar_initials' => 'EM', 'is_active' => true,
        ]);
        Sanctum::actingAs(User::factory()->create(['email' => 'e@x.id', 'role' => 'peserta', 'employee_id' => $emp->id]));

        $this->postJson('/api/attendance/clock-in', ['latitude' => -6.3017, 'longitude' => 107.1705, 'accuracy' => 10])->assertCreated();

        $row = $emp->attendances()->first() ?? \App\Models\Attendance::where('employee_id', $emp->id)->first();
        $this->assertSame('2026-11-27', $row->attendance_date->toDateString());
        $this->assertSame('08:10', substr($row->actual_in, 0, 5));
    }
}
