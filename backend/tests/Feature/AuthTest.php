<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(bool $active = true, string $email = 'budi.santoso@company.co.id'): User
    {
        $shift = Shift::create(['name' => 'Pagi', 'shift_in' => '08:00', 'shift_out' => '17:00', 'schedule_minutes' => 540]);
        $emp = Employee::create([
            'employee_no' => 'EMP-2024-001', 'name' => 'Budi Santoso', 'email' => $email,
            'position' => 'Staff', 'department' => 'IT', 'shift_id' => $shift->id,
            'avatar_initials' => 'BS', 'is_active' => $active,
        ]);

        return User::factory()->create([
            'name' => 'Budi Santoso', 'email' => $email, 'password' => 'secret123',
            'role' => 'peserta', 'employee_id' => $emp->id,
        ]);
    }

    public function test_peserta_can_login(): void
    {
        $this->makeUser();
        $this->postJson('/api/login', ['email' => 'budi.santoso@company.co.id', 'password' => 'secret123'])
            ->assertOk()
            ->assertJsonPath('user.role', 'peserta')
            ->assertJsonPath('user.employee.employeeNo', 'EMP-2024-001')
            ->assertJsonStructure(['token']);
    }

    public function test_login_email_is_case_insensitive(): void
    {
        $this->makeUser();
        $this->postJson('/api/login', ['email' => 'Budi.Santoso@Company.co.id', 'password' => 'secret123'])->assertOk();
    }

    public function test_wrong_password_rejected(): void
    {
        $this->makeUser();
        $this->postJson('/api/login', ['email' => 'budi.santoso@company.co.id', 'password' => 'nope'])->assertStatus(422);
    }

    public function test_inactive_employee_cannot_login(): void
    {
        $this->makeUser(false);
        $this->postJson('/api/login', ['email' => 'budi.santoso@company.co.id', 'password' => 'secret123'])->assertStatus(422);
    }

    public function test_login_is_throttled(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'x@y.z', 'password' => 'bad'])->assertStatus(422);
        }
        $this->postJson('/api/login', ['email' => 'x@y.z', 'password' => 'bad'])->assertStatus(429);
    }

    public function test_me_requires_token(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
        $user = $this->makeUser();
        Sanctum::actingAs($user);
        $this->getJson('/api/me')->assertOk()->assertJsonPath('user.email', $user->email);
    }

    public function test_logout_revokes_token(): void
    {
        $this->makeUser();
        $token = $this->postJson('/api/login', ['email' => 'budi.santoso@company.co.id', 'password' => 'secret123'])->json('token');
        $this->withToken($token)->postJson('/api/logout')->assertNoContent();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
