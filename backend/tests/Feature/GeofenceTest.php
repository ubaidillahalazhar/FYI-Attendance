<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GeofenceTest extends TestCase
{
    use RefreshDatabase;

    private const OFFICE = ['latitude' => -6.3017, 'longitude' => 107.1705];

    private function peserta(): User
    {
        $shift = Shift::create(['name' => 'Pagi', 'shift_in' => '08:00', 'shift_out' => '17:00', 'schedule_minutes' => 540]);
        $emp = Employee::create([
            'employee_no' => 'EMP-1', 'name' => 'Emp 1', 'email' => 'emp1@x.id',
            'position' => 'Staff', 'department' => 'IT', 'shift_id' => $shift->id,
            'avatar_initials' => 'EM', 'is_active' => true,
        ]);

        return User::factory()->create(['email' => 'emp1@x.id', 'role' => 'peserta', 'employee_id' => $emp->id]);
    }

    private function hr(): User
    {
        return User::factory()->create(['email' => 'hr@x.id', 'role' => 'hr', 'employee_id' => null]);
    }

    public function test_clock_in_requires_accuracy(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->postJson('/api/attendance/clock-in', self::OFFICE)->assertStatus(422)->assertJsonValidationErrors('accuracy');
        $this->assertSame(0, Attendance::count());
    }

    public function test_clock_in_rejects_poor_accuracy(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->postJson('/api/attendance/clock-in', self::OFFICE + ['accuracy' => 120.4])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Akurasi GPS ±120 m terlalu rendah (maks 100 m). Coba dekat jendela atau area terbuka, lalu ulangi.');
        $this->assertSame(0, Attendance::count());
    }

    public function test_clock_in_approximate_location_gets_precise_location_hint(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->postJson('/api/attendance/clock-in', self::OFFICE + ['accuracy' => 2500])
            ->assertStatus(422)
            ->assertJsonPath('message', "Lokasi HP hanya perkiraan (±2500 m). Aktifkan 'Lokasi Akurat / Precise Location' untuk browser ini, lalu ulangi.");
        $this->assertSame(0, Attendance::count());
    }

    public function test_clock_in_accepts_accuracy_at_max(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->postJson('/api/attendance/clock-in', self::OFFICE + ['accuracy' => 100])->assertCreated();
    }

    public function test_clock_in_far_away_rejected_by_radius(): void
    {
        Sanctum::actingAs($this->peserta());
        $res = $this->postJson('/api/attendance/clock-in', ['latitude' => -6.2000, 'longitude' => 106.8166, 'accuracy' => 5]);
        $res->assertStatus(422);
        $this->assertStringContainsString('Outside office geofence radius', $res->json('message'));
    }

    public function test_clock_in_and_out_store_distance_and_accuracy(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->postJson('/api/attendance/clock-in', self::OFFICE + ['accuracy' => 12.6])->assertCreated();
        $this->postJson('/api/attendance/clock-out', self::OFFICE + ['accuracy' => 30])->assertOk();

        $row = Attendance::first();
        $this->assertSame(0, (int) $row->distance_in_meters);
        $this->assertSame(13, (int) $row->clock_in_accuracy_m);
        $this->assertSame(0, (int) $row->clock_out_distance_m);
        $this->assertSame(30, (int) $row->clock_out_accuracy_m);
    }

    public function test_clock_out_rejects_poor_accuracy(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->postJson('/api/attendance/clock-in', self::OFFICE + ['accuracy' => 10])->assertCreated();
        $this->postJson('/api/attendance/clock-out', self::OFFICE + ['accuracy' => 500])->assertStatus(422);
        $this->assertNull(Attendance::first()->actual_out);
    }

    public function test_me_includes_office(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.office.radius_meters', 150)
            ->assertJsonPath('user.office.max_accuracy_meters', 100)
            ->assertJsonPath('user.office.lat', -6.3017);
    }

    public function test_export_has_gps_columns_last(): void
    {
        Sanctum::actingAs($this->peserta());
        $this->postJson('/api/attendance/clock-in', self::OFFICE + ['accuracy' => 12.6])->assertCreated();
        $this->postJson('/api/attendance/clock-out', self::OFFICE + ['accuracy' => 30])->assertOk();

        Sanctum::actingAs($this->hr());
        $csv = $this->get('/api/admin/attendance-report/export')->streamedContent();
        $lines = explode("\n", trim(ltrim($csv, "\xEF\xBB\xBF")));

        $this->assertSame(
            ['Clock In Distance (m)', 'Clock In Accuracy (m)', 'Clock Out Distance (m)', 'Clock Out Accuracy (m)'],
            array_slice(str_getcsv($lines[0]), -4)
        );
        $this->assertSame(['0', '13', '0', '30'], array_slice(str_getcsv($lines[1]), -4));
    }
}
