<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmployeeManagementTest extends TestCase
{
    use RefreshDatabase;

    private Shift $shift;

    private function peserta(string $no = 'EMP-1', bool $active = true): User
    {
        $this->shift ??= Shift::create(['name' => 'Pagi', 'shift_in' => '08:00', 'shift_out' => '17:00', 'schedule_minutes' => 540]);
        $emp = Employee::create([
            'employee_no' => $no, 'name' => "Emp $no", 'email' => "$no@x.id",
            'position' => 'Staff', 'department' => 'IT', 'shift_id' => $this->shift->id,
            'avatar_initials' => 'EM', 'is_active' => $active,
            'jenis' => 'pkl', 'asal' => 'SMKN 1 Bekasi',
        ]);

        return User::factory()->create(['email' => "$no@x.id", 'role' => 'peserta', 'employee_id' => $emp->id]);
    }

    private function hr(): User
    {
        return User::factory()->create(['email' => 'hr@x.id', 'role' => 'hr', 'employee_id' => null]);
    }

    public function test_employee_list_includes_inactive_and_new_fields(): void
    {
        $this->peserta('EMP-1');
        $this->peserta('EMP-2', false);
        Sanctum::actingAs($this->hr());

        $data = $this->getJson('/api/employees')->assertOk()->json('data');
        $this->assertCount(2, $data);
        $this->assertFalse($data[1]['isActive']);
        $this->assertSame('pkl', $data[1]['jenis']);
        $this->assertSame('SMKN 1 Bekasi', $data[1]['asal']);
        $this->assertSame($this->shift->id, $data[1]['shiftId']);
    }

    public function test_hr_lists_shifts(): void
    {
        Shift::create(['name' => 'Siang', 'shift_in' => '09:00', 'shift_out' => '18:00', 'schedule_minutes' => 540]);
        Shift::create(['name' => 'Pagi', 'shift_in' => '08:00', 'shift_out' => '17:00', 'schedule_minutes' => 540]);
        Sanctum::actingAs($this->hr());

        $data = $this->getJson('/api/shifts')->assertOk()->json('data');
        $this->assertCount(2, $data);
        $this->assertSame(['id', 'name', 'shiftIn', 'shiftOut'], array_keys($data[0]));
        $this->assertSame('08:00', $data[0]['shiftIn']);
    }

    public function test_peserta_cannot_list_shifts(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->getJson('/api/shifts')->assertForbidden();
    }

    private function attend(User $u): void
    {
        Attendance::create([
            'employee_id' => $u->employee_id, 'shift_id' => $this->shift->id,
            'attendance_date' => now()->toDateString(), 'actual_in' => '08:00:00', 'actual_out' => '17:00:00',
        ]);
    }

    public function test_report_rows_carry_jenis_and_asal(): void
    {
        $this->attend($this->peserta());
        Sanctum::actingAs($this->hr());

        $row = $this->getJson('/api/admin/attendance-report')->assertOk()->json('data.0');
        $this->assertSame('pkl', $row['jenis']);
        $this->assertSame('SMKN 1 Bekasi', $row['asal']);
    }

    public function test_export_has_jenis_asal_after_name(): void
    {
        $this->attend($this->peserta());
        Sanctum::actingAs($this->hr());

        $csv = $this->get('/api/admin/attendance-report/export')->streamedContent();
        $lines = explode("\n", ltrim($csv, "\xEF\xBB\xBF"));
        $this->assertStringStartsWith('No.,"Employee No.","Employee Name",Jenis,Asal,Date', $lines[0]);
        $this->assertStringContainsString(',PKL,"SMKN 1 Bekasi",', $lines[1]);
    }
}
