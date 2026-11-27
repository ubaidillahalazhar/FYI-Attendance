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
Buat database bernama `geoattend_hr`, lalu jalankan migrasi Laravel (langkah 2) atau import `database/schema.sql`.

---

### 2. Setup Backend (Laravel API)

Karena folder `backend/` berisi source code inti (Models, Controllers, Services, Migrations, Routes, Config) tanpa folder `vendor/`, ikuti langkah berikut untuk memasangnya ke proyek Laravel baru:

```bash
# 1. Buat skeleton proyek Laravel 12 baru (jika belum ada)
composer create-project laravel/laravel geoattend-api
cd geoattend-api

# 2. Aktifkan dukungan API routing (Laravel 12)
php artisan install:api

# 3. Salin seluruh isi folder backend/ dari ZIP ini ke dalam folder geoattend-api/
#    (timpa file app/, config/, database/, routes/, dan .env.example)

# 4. Salin konfigurasi environment
cp .env.example .env
php artisan key:generate

# 5. Sesuaikan koneksi PostgreSQL & koordinat kantor di .env, lalu jalankan migrasi & seeder
php artisan migrate --seed

# 6. Jalankan server Laravel API
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
> Ubah menjadi `VITE_USE_MOCK=false` ketika backend Laravel + PostgreSQL sudah berjalan di `http://localhost:8000`.

---

## Daftar Endpoint API Laravel

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/employees` | Daftar seluruh karyawan beserta shift |
| `GET` | `/api/employees/{id}/attendance` | Riwayat absensi 1 bulan untuk 1 karyawan (Side-Drawer) |
| `POST` | `/api/attendance/clock-in` | Clock In dengan validasi koordinat GPS (Haversine Geofencing) |
| `POST` | `/api/attendance/clock-out` | Clock Out dengan kalkulasi otomatis durasi kerja & menit keluar |
| `GET` | `/api/admin/attendance-report` | Laporan lengkap 20 kolom (mendukung filter `?search=&month=&date=`) |
| `GET` | `/api/admin/attendance-report/export` | Unduh CSV/Excel dari backend (global atau per `employee_id`) |
| `POST` | `/api/overtime-requests` | Pengajuan lembur dari Employee View |
| `PATCH` | `/api/overtime-requests/{id}/status` | Approval / Reject lembur dari Admin |
