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
            'employee_no' => $no, 'name' => "Emp $no", 'email' => strtolower("$no@x.id"),
            'position' => 'Staff', 'department' => 'IT', 'shift_id' => $this->shift->id,
            'avatar_initials' => 'EM', 'is_active' => $active,
            'jenis' => 'pkl', 'asal' => 'SMKN 1 Bekasi',
        ]);

        return User::factory()->create(['email' => strtolower("$no@x.id"), 'role' => 'peserta', 'employee_id' => $emp->id]);
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

    public function test_peserta_cannot_reset_password(): void
    {
        $p = $this->peserta();
        Sanctum::actingAs($p);
        $this->putJson("/api/employees/{$p->employee_id}/password", ['password' => 'newpassword1'])->assertForbidden();
    }

    public function test_initials_are_multibyte_safe(): void
    {
        Sanctum::actingAs($this->hr());
        $this->postJson('/api/employees', $this->payload(['name' => 'Élise Ñoño']))
            ->assertCreated();
        $this->assertDatabaseHas('employees', ['employee_no' => 'PKL-001', 'avatar_initials' => 'ÉÑ']);
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

    private function payload(array $o = []): array
    {
        $this->shift ??= Shift::create(['name' => 'Pagi', 'shift_in' => '08:00', 'shift_out' => '17:00', 'schedule_minutes' => 540]);

        return array_merge([
            'employee_no' => 'PKL-001', 'name' => 'Rina Ayu', 'email' => 'Rina.PKL@Mail.com',
            'jenis' => 'pkl', 'asal' => '  SMKN 1 Bekasi ', 'position' => 'Intern', 'department' => 'IT',
            'shift_id' => $this->shift->id, 'password' => 'password123',
        ], $o);
    }

    private function login(string $email, string $password)
    {
        $this->app['auth']->forgetGuards();

        return $this->postJson('/api/login', ['email' => $email, 'password' => $password]);
    }

    public function test_hr_creates_peserta_with_login(): void
    {
        Sanctum::actingAs($this->hr());
        $this->postJson('/api/employees', $this->payload())->assertCreated()->assertJsonPath('data.isActive', true);

        $this->assertDatabaseHas('employees', ['email' => 'rina.pkl@mail.com', 'asal' => 'SMKN 1 Bekasi', 'avatar_initials' => 'RA']);
        $emp = Employee::where('employee_no', 'PKL-001')->first();
        $this->assertDatabaseHas('users', ['email' => 'rina.pkl@mail.com', 'role' => 'peserta', 'employee_id' => $emp->id]);
        $this->login('rina.pkl@mail.com', 'password123')->assertOk();
    }

    public function test_create_rejects_duplicate_employee_no(): void
    {
        $this->peserta('EMP-1');
        Sanctum::actingAs($this->hr());
        $this->postJson('/api/employees', $this->payload(['employee_no' => 'EMP-1']))->assertJsonValidationErrors('employee_no');
    }

    public function test_create_rejects_email_used_by_hr_account(): void
    {
        Sanctum::actingAs($this->hr());
        $this->postJson('/api/employees', $this->payload(['email' => 'HR@x.id']))->assertJsonValidationErrors('email');
    }

    public function test_create_rejects_invalid_jenis_and_short_password(): void
    {
        Sanctum::actingAs($this->hr());
        $this->postJson('/api/employees', $this->payload(['jenis' => 'magang', 'password' => '1234567']))
            ->assertJsonValidationErrors(['jenis', 'password']);
    }

    public function test_peserta_cannot_create_employee(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->postJson('/api/employees', $this->payload())->assertForbidden();
    }

    public function test_update_changes_user_email_too(): void
    {
        $u = $this->peserta('EMP-1');
        Sanctum::actingAs($this->hr());
        $body = $this->payload(['employee_no' => 'EMP-1', 'email' => 'baru@x.id']);
        unset($body['password']);
        $this->putJson("/api/employees/{$u->employee_id}", $body)->assertOk()->assertJsonPath('data.email', 'baru@x.id');

        $this->assertSame('baru@x.id', $u->fresh()->email);
        $u->update(['password' => 'password123']);
        $this->login('baru@x.id', 'password123')->assertOk();
    }

    public function test_update_without_changing_email_succeeds(): void
    {
        $u = $this->peserta('EMP-1');
        Sanctum::actingAs($this->hr());
        $this->putJson("/api/employees/{$u->employee_id}", $this->payload(['employee_no' => 'EMP-1', 'email' => 'emp-1@x.id', 'position' => 'Lead']))
            ->assertOk()->assertJsonPath('data.position', 'Lead');
    }

    public function test_update_rejects_email_of_another_account(): void
    {
        $u = $this->peserta('EMP-1');
        $this->peserta('EMP-2');
        Sanctum::actingAs($this->hr());
        $this->putJson("/api/employees/{$u->employee_id}", $this->payload(['employee_no' => 'EMP-1', 'email' => 'emp-2@x.id']))
            ->assertJsonValidationErrors('email');
    }

    private function pesertaWithToken(): array
    {
        $u = $this->peserta('EMP-1');
        $u->update(['password' => 'password123']);
        $token = $this->login('emp-1@x.id', 'password123')->assertOk()->json('token');

        return [$u, $token];
    }

    public function test_deactivate_revokes_tokens(): void
    {
        [$u, $token] = $this->pesertaWithToken();
        Sanctum::actingAs($this->hr());
        $this->patchJson("/api/employees/{$u->employee_id}/status", ['is_active' => false])->assertOk()->assertJsonPath('data.isActive', false);

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
        $this->login('emp-1@x.id', 'password123')->assertStatus(422);
    }

    public function test_reactivate_allows_login(): void
    {
        [$u] = $this->pesertaWithToken();
        Sanctum::actingAs($this->hr());
        $this->patchJson("/api/employees/{$u->employee_id}/status", ['is_active' => false])->assertOk();
        $this->patchJson("/api/employees/{$u->employee_id}/status", ['is_active' => true])->assertOk();
        $this->login('emp-1@x.id', 'password123')->assertOk();
    }

    public function test_reset_password_revokes_tokens_and_sets_new_password(): void
    {
        [$u, $token] = $this->pesertaWithToken();
        Sanctum::actingAs($this->hr());
        $this->putJson("/api/employees/{$u->employee_id}/password", ['password' => 'rahasia99'])->assertNoContent();

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
        $this->login('emp-1@x.id', 'password123')->assertStatus(422);
        $this->login('emp-1@x.id', 'rahasia99')->assertOk();
    }
}
