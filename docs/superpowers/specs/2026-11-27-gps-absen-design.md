# GPS Absen (Geofence Sungguhan) — Design

## Intent
Persiapan sebelum sistem dipakai sungguhan: peserta tidak boleh absen dari luar kantor
(mis. dari rumah) lalu tidak masuk. Absen yang tercatat harus bisa dipercaya HR sebagai
bukti peserta hadir di kantor.

## Kondisi saat ini
- Backend sudah memvalidasi radius (`GeofenceService`, Haversine, `config/geofence.php`).
- Frontend mengirim **koordinat kantor**, bukan lokasi HP (`EmployeeView.jsx` tombol Clock In/Out),
  sehingga validasi server selalu lolos.
- Panel "Geofence Simulator" tampil untuk peserta dan bisa memaksa status "di dalam".
- Akurasi GPS tidak dicek; titik kantor diduplikasi di `VITE_OFFICE_*`.

## Goals
- Clock In/Out mengirim GPS asli (fresh) + akurasi; server yang memutuskan.
- Tolak jika akurasi > `GEOFENCE_MAX_ACCURACY_METERS` (default 100) dengan pesan minta ulang.
- Tolak jika jarak > radius (perilaku sekarang).
- Simpan jarak & akurasi clock-in/out; tampil di export CSV.
- Simulator hanya di mode demo (`VITE_USE_MOCK=true`).
- Titik kantor satu sumber: `.env` backend, dikirim ke frontend lewat `/me`.

## Non-goals
- Deteksi Fake GPS / mock location (tidak mungkin dari browser).
- Cegah titip absen → fitur selfie berikutnya.
- Multi-lokasi, halaman Geofence Zones, jarak di tabel laporan (export dulu).

## Anti-goals
- Peserta jujur di dalam gedung terkunci tanpa jalan keluar → pesan akurasi buruk harus
  menyuruh coba ulang, bukan sekadar "ditolak".
- Server mempercayai keputusan "di dalam/luar" dari frontend.

## Approaches
- **Perkuat `GeofenceService` + kirim GPS asli (dipilih):** server tetap satu-satunya yang memutuskan.
- Cek di frontend saja: ditolak, request bisa dipalsukan.
- Opsi perilaku: A tolak keras / **B tolak + minta ulang jika akurasi buruk (dipilih)** /
  C izinkan tapi tandai — C bertentangan dengan tujuan.

## Keputusan builder (calls)
- `accuracy` wajib di request clock-in/out (numeric, ≥ 0).
- Kolom `distance_in_meters` yang sudah ada dipakai untuk jarak clock-in; 3 kolom nullable baru: `clock_in_accuracy_m`,
  `clock_out_distance_m`, `clock_out_accuracy_m` (integer meter).
- `getCurrentPosition` dengan `enableHighAccuracy: true, maximumAge: 0, timeout: 15000`.
- Mode demo (mock) tetap memakai simulator & koordinat kantor.

## Sebelum go-live
Isi `OFFICE_LAT`, `OFFICE_LNG`, `OFFICE_RADIUS_METERS` dengan titik kantor asli
(default `-6.3017, 107.1705` kemungkinan contoh).
