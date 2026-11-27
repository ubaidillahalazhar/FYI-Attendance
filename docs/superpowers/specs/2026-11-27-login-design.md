# Fitur 1 — Login (HR & Peserta)

Ukuran: perubahan kecil (short design).

## Tujuan & alasan
Sistem absensi untuk siswa PKL dan pekerja outsourcing/vendor, dikontrol penuh oleh HR
perusahaan tempat PKL/kerja. Saat ini API menerima `employee_id` dari klien, jadi siapa pun
bisa absen atas nama orang lain dan semua endpoint admin terbuka. Login adalah dasar untuk
fitur berikutnya (selfie, approval lembur, kelola peserta).

## Goals
- Dua role: `hr` (admin) dan `peserta` (PKL / outsourcing).
- Login email + password, logout.
- Identitas peserta diambil dari token di server, bukan dari body request.
- Endpoint admin hanya untuk role `hr`.
- Tampilan ditentukan role (tombol switch Employee/Admin dihapus).

## Non-goals (fitur berikutnya)
- Halaman HR untuk tambah/ubah peserta & reset password (akun awal dari seeder).
- Selfie kamera, approval lembur, multi-lokasi, kolom Jenis/Asal.
- Lupa password via email.

## Anti-goals
- Peserta bisa melihat/mengubah data peserta lain.
- Token/password bocor di URL atau log.

## Approaches
- **Sanctum personal access token (dipilih):** sudah ada di `composer.json`, cocok untuk
  frontend (Vite :5173) dan API (:8000) terpisah. Token disimpan di `localStorage`,
  dikirim sebagai `Authorization: Bearer`.
- Sanctum SPA cookie session: butuh domain sama + setup CSRF/stateful domains — tidak cocok
  dengan setup dua origin saat ini.

## Desain
- **Database:** tabel `users` bawaan Laravel + kolom `role` (`hr`|`peserta`, default `peserta`)
  dan `employee_id` (nullable FK → employees, wajib untuk peserta).
- **API:**
  - `POST /api/login` {email, password} → {token, user{name, role, employee}}. Salah → 422.
    Dibatasi `throttle` (5x/menit) untuk mencegah tebak password.
  - `POST /api/logout` (hapus token aktif), `GET /api/me`.
  - Semua route lain di belakang `auth:sanctum`. Route `/admin/*`, `GET /employees`,
    `GET /employees/{id}/attendance`, `GET /overtime-requests` (semua) dan
    `PATCH /overtime-requests/{id}/status` hanya `hr`.
  - Peserta: `clock-in`, `clock-out`, `POST /overtime-requests`, `GET /me/attendance`
    memakai `employee_id` dari user yang login; field `employee_id` dari body diabaikan.
- **Frontend:** halaman Login; setelah login, role `peserta` → EmployeeView dengan data dirinya,
  `hr` → AdminView. Tombol Logout di top bar. Respons 401 → kembali ke Login.
  Mode mock tetap ada; login hanya aktif saat `VITE_USE_MOCK=false`.
- **Seeder:** 1 akun HR + akun peserta untuk employee contoh, password default dicatat di README.
- **Perbaikan kecil:** `postcss` `^10.4.47` → `^8.4.47` agar `npm install` berhasil.

## Keputusan builder (my calls)
- Login pakai email (bukan Nomor Peserta); mudah diganti nanti.
- Mode mock tetap ada untuk demo UI tanpa backend.
