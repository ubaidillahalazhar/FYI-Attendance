<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccessTest extends TestCase
{
    use RefreshDatabase;

    private const GEO = ['latitude' => -6.3017, 'longitude' => 107.1705];

    private Shift $shift;

    private function peserta(string $no = 'EMP-1', bool $active = true): User
    {
        $this->shift ??= Shift::create(['name' => 'Pagi', 'shift_in' => '08:00', 'shift_out' => '17:00', 'schedule_minutes' => 540]);
        $emp = Employee::create([
            'employee_no' => $no, 'name' => "Emp $no", 'email' => "$no@x.id",
            'position' => 'Staff', 'department' => 'IT', 'shift_id' => $this->shift->id,
            'avatar_initials' => 'EM', 'is_active' => $active,
        ]);

        return User::factory()->create(['email' => "$no@x.id", 'role' => 'peserta', 'employee_id' => $emp->id]);
    }

    private function hr(): User
    {
        return User::factory()->create(['email' => 'hr@x.id', 'role' => 'hr', 'employee_id' => null]);
    }

    public function test_guest_gets_401_on_clock_in(): void
    {
        $this->postJson('/api/attendance/clock-in', self::GEO)->assertUnauthorized();
    }

    public function test_peserta_clock_in_uses_own_employee(): void
    {
        $budi = $this->peserta('EMP-1');
        $other = $this->peserta('EMP-2');
        Sanctum::actingAs($budi);
        $this->postJson('/api/attendance/clock-in', self::GEO + ['employee_id' => $other->employee_id])->assertCreated();
        $this->assertDatabaseHas('attendances', ['employee_id' => $budi->employee_id]);
        $this->assertDatabaseMissing('attendances', ['employee_id' => $other->employee_id]);
    }

    public function test_peserta_clock_out_after_clock_in(): void
    {
        $budi = $this->peserta('EMP-1');
        Sanctum::actingAs($budi);
        $this->postJson('/api/attendance/clock-in', self::GEO)->assertCreated();
        $this->postJson('/api/attendance/clock-out', self::GEO)->assertOk();
        $row = Attendance::where('employee_id', $budi->employee_id)->first();
        $this->assertNotNull($row->actual_out);
    }

    public function test_hr_cannot_clock_in(): void
    {
        Sanctum::actingAs($this->hr());
        $this->postJson('/api/attendance/clock-in', self::GEO)->assertForbidden();
    }

    public function test_deactivated_peserta_token_is_forbidden(): void
    {
        $u = $this->peserta('EMP-1', false);
        Sanctum::actingAs($u);
        $this->postJson('/api/attendance/clock-in', self::GEO)->assertForbidden();
    }

    public function test_peserta_cannot_open_admin_report(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->getJson('/api/admin/attendance-report')->assertForbidden();
        $this->getJson('/api/employees')->assertForbidden();
    }

    public function test_hr_can_open_admin_report(): void
    {
        Sanctum::actingAs($this->hr());
        $this->getJson('/api/admin/attendance-report')->assertOk();
    }

    public function test_peserta_overtime_saved_under_own_employee(): void
    {
        $budi = $this->peserta('EMP-1');
        $other = $this->peserta('EMP-2');
        Sanctum::actingAs($budi);
        $this->postJson('/api/overtime-requests', [
            'employee_id' => $other->employee_id, 'overtime_date' => now()->toDateString(),
            'start_time' => '17:00', 'end_time' => '19:00', 'reason' => 'Deadline',
        ])->assertCreated();
        $this->assertDatabaseHas('overtime_requests', ['employee_id' => $budi->employee_id]);
        $this->assertDatabaseMissing('overtime_requests', ['employee_id' => $other->employee_id]);
    }

    public function test_me_attendance_returns_only_own_rows(): void
    {
        $budi = $this->peserta('EMP-1');
        $other = $this->peserta('EMP-2');
        foreach ([$budi, $other] as $u) {
            Attendance::create(['employee_id' => $u->employee_id, 'shift_id' => $this->shift->id, 'attendance_date' => now()->toDateString(), 'actual_in' => '08:00:00']);
        }
        Sanctum::actingAs($budi);
        $this->getJson('/api/me/attendance')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.employeeNo', 'EMP-1');
    }
}
