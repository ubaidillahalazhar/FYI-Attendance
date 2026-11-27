# Fitur 2 — Kelola Peserta oleh HR (+ Jenis & Asal)

Ukuran: proyek kecil (backend + frontend). Dibangun di atas Fitur 1 (Login, sudah di `main`).

## Tujuan & alasan
Sistem absensi untuk siswa PKL dan pekerja outsourcing/vendor, dikontrol penuh oleh HR
perusahaan tempat PKL/kerja. Saat ini akun hanya bisa dibuat lewat seeder, jadi sistem belum
bisa dipakai orang sungguhan. HR harus bisa menambah, mengubah, menonaktifkan peserta dan
mereset password dari dashboard. Setiap peserta diberi **Jenis** (PKL / Outsourcing) dan
**Asal** (nama sekolah / vendor) supaya HR bisa menyaring dan mengirim laporan per
sekolah/vendor (sekolah & vendor tidak punya akun — HR mengirim file export).

## Goals
- Halaman **Peserta** di dashboard HR: daftar, tambah, ubah, aktif/nonaktif, reset password.
- Kolom **Jenis** dan **Asal** pada peserta; filter Jenis/Asal di daftar peserta dan di
  laporan absensi; kolom Jenis & Asal di export Excel.
- Menu samping admin bisa dipakai pindah halaman (Laporan Absensi ↔ Peserta).

## Non-goals (fitur lain)
- Impor peserta massal dari Excel.
- Kelola shift (tambah/ubah shift) dan multi-lokasi — diputuskan: **satu kantor, 3 shift yang ada**.
- Hapus permanen peserta.
- Peserta mengganti password sendiri / lupa password.
- Menu samping lain (Overtime Approvals, Geofence Zones, Payroll Exports) tetap belum aktif.

## Anti-goals
- Riwayat absen hilang saat peserta "dihapus" → karena itu hanya nonaktif, tidak ada delete.
- Data `employees` dan akun login (`users`) tidak sinkron (email beda, peserta tanpa akun).
- Peserta bisa memanggil endpoint kelola peserta.

## Keputusan dari partner
- Satu kantor (geofence `.env` yang ada) dan 3 shift yang ada (`Regular Office` 08–17,
  `Morning Shift A` 07–16, `Mid Shift B` 09–18). HR memilih shift dari daftar.
- **Password awal diketik HR** di form (opsi A). Reset password juga diketik HR. Minimal 8 karakter.
- Pendekatan 1: halaman baru di dashboard React yang ada (bukan panel Filament).

## Approaches
- **(Dipilih) Halaman Peserta di dashboard React + endpoint HR di Laravel.** Satu aplikasi,
  satu login, aturan role Fitur 1 otomatis berlaku. Biaya: form/tabel ditulis sendiri.
- Panel admin Filament: CRUD cepat, tapi HR punya dua aplikasi/dua login dan tampilan beda. Ditolak.
- Tabel `participants` baru menggantikan `employees`: membongkar semua yang sudah jalan. Ditolak.

## Desain

### Data
- `employees` + kolom `jenis` (string, nilai `pkl` | `outsourcing`) dan `asal` (string, maks 150).
  Wajib saat tambah/ubah lewat API. Baris lama diisi oleh seeder (contoh: campuran PKL dari
  "SMKN 1 Bekasi" dan Outsourcing dari "PT Mitra Tenaga Kerja").
- `avatar_initials` dihitung server dari nama (2 huruf pertama kata), tidak diisi HR.
- Satu peserta = satu `employees` + satu `users` (role `peserta`, `employee_id`), email sama.
  Tambah & ubah dijalankan dalam satu DB transaction.

### API (semua `auth:sanctum` + `can:hr`)
- `GET /api/employees` (sudah ada) — sekarang menyertakan peserta nonaktif, dan
  `EmployeeResource` ditambah `jenis`, `asal`, `isActive`, `shiftId`.
- `GET /api/shifts` → `{data:[{id, name, shiftIn, shiftOut}]}` untuk dropdown.
- `POST /api/employees` {employee_no, name, email, jenis, asal, position, department,
  shift_id, password} → 201 EmployeeResource. Validasi: employee_no unik, email unik di
  `employees` **dan** `users` (disimpan lowercase), jenis ∈ {pkl, outsourcing},
  shift_id ada, password min 8.
- `PUT /api/employees/{employee}` — field yang sama tanpa password → 200. Email ikut
  diperbarui di `users`. Unik mengabaikan dirinya sendiri.
- `PATCH /api/employees/{employee}/status` {is_active: bool} → 200.
- `PUT /api/employees/{employee}/password` {password} → 204. **Semua token peserta itu
  dihapus** (dia ter-logout di semua HP) — supaya reset benar-benar memutus akses lama.
- Laporan absensi: `AttendanceReportResource` + `jenis`, `asal`; `exportCsv` + kolom
  `Jenis`, `Asal` setelah `Employee Name`.

### Frontend
- `AdminSidebar`: item "Attendance Report" dan "Employee Directory" (label jadi **Peserta**)
  bisa diklik dan menandai yang aktif; item lain tampil redup tanpa aksi.
- `AdminView` memilih halaman lewat state (`'report' | 'peserta'`), tanpa library router.
- Halaman **Peserta**:
  ```
  [Cari nama/nomor…] [Jenis ▾] [Asal ▾] [Status ▾]            [+ Tambah Peserta]
  No Peserta | Nama | Jenis | Asal | Posisi | Shift | Status | Aksi
  PKL-001    | Rina | PKL   | SMKN 1 Bekasi | Admin | 08–17 | Aktif | Ubah · Reset Password · Nonaktifkan
  ```
  Form tambah/ubah berupa pop-up. Isian **Asal** pakai `<input list>` + `<datalist>` dari
  nilai Asal yang sudah ada di daftar peserta (saran, tetap bebas diketik). Reset password
  berupa pop-up kecil satu isian. Nonaktifkan minta konfirmasi. Pesan error validasi dari
  server (422) ditampilkan di form.
- Laporan absensi: tambah filter Jenis dan Asal (di sisi klien, seperti filter yang ada);
  export Excel klien (`exportExcel.js`) + kolom Jenis & Asal di posisi yang sama dengan backend.
- Mode mock tetap jalan; halaman Peserta di mode mock boleh hanya menampilkan data mock
  tanpa simpan (builder's call).

## Keputusan builder (my calls)
- **Nonaktif:** login sudah ditolak sejak Fitur 1 (`AuthController` → 422 "Akun peserta tidak
  aktif.") dan gate `peserta` memblokir absen. Tambahan: `PATCH status` ke nonaktif juga
  **menghapus semua token** peserta itu, sama seperti reset password.
- `GET /api/employees` diubah untuk semua pemakai (hanya HR: dashboard & drawer laporan) agar
  menyertakan nonaktif — laporan tetap menampilkan riwayat peserta nonaktif.
- Seeder (Fitur 1) menjamin setiap employee punya user. `PUT` memperbarui email user yang
  tertaut; employee tanpa user tidak didukung (tidak dibuat diam-diam).
- **Asal:** di-trim saat disimpan, huruf disimpan apa adanya. Saran `<datalist>` dan opsi filter
  Asal di-dedupe tanpa beda huruf besar/kecil; filter mencocokkan tanpa beda huruf besar/kecil.
  `jenis` & `asal` di `AttendanceReportResource` memakai nilai tersimpan yang sama dengan
  `EmployeeResource`.
- Nilai `jenis` disimpan lowercase (`pkl`/`outsourcing`), ditampilkan "PKL"/"Outsourcing".
- Posisi & Departemen tetap dua isian (kolom yang sudah ada).
- Reset password me-logout peserta dari semua perangkat.
- Kolom export: `Jenis`, `Asal` disisipkan setelah `Employee Name`.

## Diserahkan ke builder
- Struktur komponen frontend (nama file, pecahan komponen), gaya mengikuti navy/teal yang ada.
- Bentuk migration untuk baris lama (nullable + diisi seeder, atau default) selama API
  mewajibkan jenis & asal.
