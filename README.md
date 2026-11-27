# GeoAttend HR — Web-Based Attendance System with Geofencing

Full-stack modular prototype & starter architecture built with:
- **Frontend:** React.js (Vite), Tailwind CSS, Lucide Icons
- **Backend:** Laravel 12 REST API (Service-Repository pattern, Haversine Geofencing validation)
- **Database:** PostgreSQL 16

---

## Struktur Folder

```text
geoattend-hr/
├── docker-compose.yml            # PostgreSQL 16 + pgAdmin container
├── database/
│   └── schema.sql                # Raw PostgreSQL DDL + sample data
├── frontend/                     # React.js + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # TopModeBar, StatusBadge
│   │   │   ├── employee/         # EmployeeView, AttendanceHistoryModal, OvertimeRequestModal
│   │   │   └── admin/            # AdminView, AdminSidebar, AttendanceTable, EmployeeProfileDrawer
│   │   ├── data/                 # Mock data (untuk mode demo / fallback tanpa backend)
│   │   ├── services/             # API client (Axios/Fetch ke Laravel API)
│   │   └── utils/                # Geofence Haversine, Time Calculator, Excel Exporter
└── backend/                      # Laravel REST API (PostgreSQL)
    ├── app/
    │   ├── Http/Controllers/Api/ # AttendanceController, OvertimeController, EmployeeController
    │   ├── Http/Resources/       # AttendanceReportResource (mapping 20 kolom tabel)
    │   ├── Models/               # Employee, Shift, Attendance, OvertimeRequest
    │   └── Services/             # GeofenceService, AttendanceCalculatorService
    ├── config/geofence.php       # Koordinat kantor & radius (meter)
    ├── database/migrations/      # Migrasi tabel PostgreSQL
    ├── database/seeders/         # Seeder data karyawan, shift, & riwayat absensi 1 bulan
    └── routes/api.php            # Definisi endpoint REST API
```

---

## Cara Menjalankan Proyek

### 1. Setup Database (PostgreSQL)

**Opsi A — Menggunakan Docker Compose (Direkomendasikan):**
```bash
docker compose up -d
```
PostgreSQL akan berjalan di `localhost:5432` dengan kredensial:
- Database: `geoattend_hr`
- Username: `postgres`
- Password: `postgres_password`

**Opsi B — PostgreSQL Lokal:**
Buat database bernama `geoattend_hr`, lalu jalankan migrasi Laravel (langkah 2: `php artisan migrate --seed`). Migrasi wajib karena tabel `users`, `personal_access_tokens`, dan `cache` tidak ada di `database/schema.sql`.

---

### 2. Setup Backend (Laravel API)

Pastikan database PostgreSQL `geoattend_hr` (dan `geoattend_hr_test` untuk `php artisan test`) sudah dibuat.

```bash
cd backend
composer install
cp .env.example .env      # sesuaikan koneksi PostgreSQL & koordinat kantor
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
API akan aktif di `http://localhost:8000/api`.

---

### 3. Setup Frontend (React.js + Vite + Tailwind CSS)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Aplikasi frontend akan berjalan di `http://localhost:5173`.

> **Catatan Mode Demo vs Mode API:**
> Di file `frontend/.env`, variabel `VITE_USE_MOCK=true` diaktifkan secara default agar Anda bisa langsung mencoba seluruh UI/UX (termasuk *Clock In/Out*, simulasi *Geofence*, *Request Overtime*, dan *Export Excel*) bahkan sebelum menjalankan backend Laravel.
> Halaman login hanya berfungsi dengan `VITE_USE_MOCK=false`; setel nilai itu ketika backend Laravel + PostgreSQL sudah berjalan di `http://localhost:8000`.

---

## Akun Login (Seed)

| Role | Email | Password |
| :--- | :--- | :--- |
| `hr` | `hr@company.co.id` | `password` |
| `peserta` (contoh) | `budi.santoso@company.co.id` | `password` |

Setiap karyawan seed punya akun `peserta` dengan email karyawan tersebut. **Ganti password di production.** Login peserta hanya berhasil bila karyawan terkait aktif.

## Daftar Endpoint API Laravel

Semua endpoint non-publik memerlukan header `Authorization: Bearer <token>` (token dari `/api/login`).

| Method | Endpoint | Role | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | publik | Cek status API |
| `POST` | `/api/login` | publik | **Baru.** Login, mengembalikan token |
| `POST` | `/api/logout` | login | **Baru.** Cabut token saat ini |
| `GET` | `/api/me` | login | **Baru.** Profil user yang sedang login |
| `GET` | `/api/me/attendance` | peserta | **Baru.** Riwayat absensi milik sendiri |
| `POST` | `/api/attendance/clock-in` | peserta | Clock In dengan validasi koordinat GPS (Haversine Geofencing) |
| `POST` | `/api/attendance/clock-out` | peserta | Clock Out dengan kalkulasi otomatis durasi kerja & menit keluar |
| `POST` | `/api/overtime-requests` | peserta | Pengajuan lembur |
| `GET` | `/api/employees` | hr | Daftar seluruh karyawan beserta shift |
| `GET` | `/api/employees/{id}/attendance` | hr | Riwayat absensi 1 bulan untuk 1 karyawan |
| `GET` | `/api/overtime-requests` | hr | Daftar pengajuan lembur |
| `PATCH` | `/api/overtime-requests/{id}/status` | hr | Approval / Reject lembur |
| `GET` | `/api/admin/attendance-report` | hr | Laporan 20 kolom (filter `?search=&month=&date=`) |
| `GET` | `/api/admin/attendance-report/export` | hr | Unduh CSV/Excel (global atau per `employee_id`) |
