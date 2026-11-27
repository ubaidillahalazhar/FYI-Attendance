# Kelola Peserta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HR manages peserta (add, edit, activate/deactivate, reset password) from the dashboard, and every peserta carries Jenis (PKL/Outsourcing) and Asal (school/vendor) used in filters and the Excel export.

**Architecture:** `employees` gets `jenis` + `asal`; new HR-only endpoints on `EmployeeController` create/update the `employees` row and its `users` login row together in one transaction. React `AdminView` switches between the report page and a new Peserta page via state; the sidebar becomes clickable.

**Tech Stack:** Laravel 12 + Sanctum, PostgreSQL 16, PHPUnit feature tests; React 18 + Vite + Tailwind (no router, no frontend test runner).

**Spec:** `docs/superpowers/specs/2026-11-27-kelola-peserta-design.md`

## Global Constraints

- `jenis` stored exactly `pkl` | `outsourcing`; displayed "PKL" / "Outsourcing".
- `asal` max 150 chars, trimmed on save, case kept as typed.
- Password min 8 characters (create and reset).
- Email stored lowercase; unique across both `employees` and `users`.
- All new endpoints: `auth:sanctum` + `can:hr`.
- Deactivate and password reset both delete all of that peserta's tokens.
- Export columns `Jenis`, `Asal` inserted right after `Employee Name` (backend CSV and frontend CSV identical order).
- No delete endpoint. Mock mode (`VITE_USE_MOCK=true`) keeps working.
- PHP binary: `/e/laragon/bin/php/php-8.4.12-nts-Win32-vs17-x64/php.exe`; tests run on Postgres `geoattend_hr_test`.

## Review Focus

1. HR changes a peserta's email to the HR account's email (exists only in `users`) → 422 on `email`, not a 500 from the DB unique index. (Task 2 test)
2. HR saves an edit without changing the email or number → succeeds (uniqueness ignores the row itself in both tables). (Task 2 test)
3. A peserta already logged in on a phone is deactivated → their next API call gets 401. (Task 2 test)
4. Asal typed as `"  SMKN 1 Bekasi "` → stored `"SMKN 1 Bekasi"`; filter options do not show case-only duplicates. (Task 2 test + Task 3/4 manual)
5. HR on a phone-width screen (sidebar is `hidden lg:flex`) can still reach the Peserta page. (Task 3 manual)

---

### Task 1: Jenis/Asal data, read endpoints, report & export columns

**Files:**
- Create: `backend/database/migrations/2026_01_01_000006_add_jenis_asal_to_employees_table.php`
- Modify: `backend/app/Models/Employee.php` (fillable), `backend/app/Http/Resources/EmployeeResource.php`, `backend/app/Http/Resources/AttendanceReportResource.php`, `backend/app/Http/Controllers/Api/AttendanceController.php` (`exportCsv`), `backend/routes/api.php`, `backend/database/seeders/DatabaseSeeder.php`
- Create: `backend/app/Http/Controllers/Api/ShiftController.php`
- Test: `backend/tests/Feature/EmployeeManagementTest.php`

**Interfaces:**
- Produces:
  - Columns `employees.jenis` string(20) nullable, `employees.asal` string(150) nullable (API enforces required in Task 2).
  - `EmployeeResource` adds `jenis` (string|null), `asal` (string|null), `isActive` (bool), `shiftId` (int). Existing keys unchanged.
  - `AttendanceReportResource` adds `jenis`, `asal` (from the employee).
  - `GET /api/shifts` (hr) → `{data:[{id, name, shiftIn:"HH:MM", shiftOut:"HH:MM"}]}` ordered by `shift_in`.
  - `GET /api/employees` unchanged route; returns active and inactive.
  - Seeder: employees 001–003 `jenis=pkl, asal="SMKN 1 Bekasi"`, 004–006 `jenis=outsourcing, asal="PT Mitra Tenaga Kerja"`.

- [ ] **Step 1: Write failing tests** in `EmployeeManagementTest` (RefreshDatabase; helpers `hr()`, `peserta()` like `AccessTest`):
  - `test_employee_list_includes_inactive_and_new_fields`: one active + one inactive employee with jenis/asal → `GET /api/employees` as HR returns 2 items; inactive item has `isActive === false`, `jenis === 'pkl'`, `asal === 'SMKN 1 Bekasi'`, `shiftId` = its shift id.
  - `test_hr_lists_shifts`: 2 shifts → `GET /api/shifts` returns 2, first has keys `id,name,shiftIn,shiftOut`, `shiftIn` formatted `08:00`.
  - `test_peserta_cannot_list_shifts` → 403.
  - `test_report_rows_carry_jenis_and_asal`: one attendance → `/api/admin/attendance-report` `data.0.jenis === 'pkl'`, `data.0.asal === 'SMKN 1 Bekasi'`.
  - `test_export_has_jenis_asal_after_name`: `/api/admin/attendance-report/export` streamed content's header row (after BOM) starts `No.,Employee No.,Employee Name,Jenis,Asal,Date`; the data row contains `,pkl,SMKN 1 Bekasi,` (raw stored values).
- [ ] **Step 2: Run** `php artisan test --filter EmployeeManagementTest` → FAIL.
- [ ] **Step 3: Implement** migration, fillable, resources, `ShiftController@index`, route `GET /shifts` in the hr group, export columns, seeder values (via `updateOrCreate`/update on existing `firstOrCreate` so re-seed sets them).
- [ ] **Step 4: Run** `php artisan test` → all PASS (existing 20 + new).
- [ ] **Step 5: Commit** `feat: jenis/asal on employees, shifts list, report/export columns`

### Task 2: Create / update / status / password endpoints

**Files:**
- Modify: `backend/app/Http/Controllers/Api/EmployeeController.php` (add `store`, `update`, `updateStatus`, `updatePassword`), `backend/routes/api.php`
- Test: `backend/tests/Feature/EmployeeManagementTest.php`

**Interfaces:**
- Consumes: Task 1 columns and `EmployeeResource`.
- Produces (all in hr group):
  - `POST /api/employees` {employee_no, name, email, jenis, asal, position, department, shift_id, password} → 201 `{data: EmployeeResource}`; creates `users` row `{name, email, password, role:'peserta', employee_id}`; `avatar_initials` = first letter of the first two words of name, uppercased (one word → first two letters).
  - `PUT /api/employees/{employee}` same fields minus password → 200 `{data: EmployeeResource}`; updates linked user's `name` and `email`.
  - `PATCH /api/employees/{employee}/status` {is_active: boolean} → 200 `{data: EmployeeResource}`; when false, deletes the linked user's tokens.
  - `PUT /api/employees/{employee}/password` {password} → 204; updates linked user's password and deletes all their tokens.
  - Validation: `employee_no` required, max 30, unique `employees`; `name` required max 150; `email` required email max 150, lowercased **before** validation, unique in `employees` and in `users` (on update ignore this employee and its linked user); `jenis` in `pkl,outsourcing`; `asal` required max 150 (trimmed — Laravel's TrimStrings middleware already trims; assert it); `position`, `department` required max 120; `shift_id` exists:shifts,id; `password` required min 8.
  - Create and update each wrapped in `DB::transaction`.

- [ ] **Step 1: Write failing tests**:
  - `test_hr_creates_peserta_with_login`: POST with email `Rina.PKL@Mail.com`, asal `"  SMKN 1 Bekasi "` → 201; `employees` has `email='rina.pkl@mail.com'`, `asal='SMKN 1 Bekasi'`, `avatar_initials='RA'` for name `Rina Ayu`; `users` has same email, `role='peserta'`, linked `employee_id`; then `POST /api/login` with that email + password → 200.
  - `test_create_rejects_duplicate_employee_no` → 422 `errors.employee_no`.
  - `test_create_rejects_email_used_by_hr_account`: email = HR user's email → 422 `errors.email`.
  - `test_create_rejects_invalid_jenis_and_short_password`: jenis `magang`, password `1234567` → 422 with `errors.jenis` and `errors.password`.
  - `test_peserta_cannot_create_employee` → 403.
  - `test_update_changes_user_email_too`: PUT new email → 200; linked user's email updated; login with new email works.
  - `test_update_without_changing_email_succeeds`: PUT same employee_no + email, new position → 200.
  - `test_update_rejects_email_of_another_account` → 422 `errors.email`.
  - `test_deactivate_revokes_tokens`: peserta logs in (real token from `/api/login`), HR PATCH `is_active=false` → 200 `isActive false`; `GET /api/me` with the old token → 401; login again → 422.
  - `test_reactivate_allows_login`: after false, PATCH true → login 200.
  - `test_reset_password_revokes_tokens_and_sets_new_password`: peserta token; HR PUT password `rahasia99` → 204; old token `/api/me` → 401; login with old password → 422; with `rahasia99` → 200.
- [ ] **Step 2: Run** `php artisan test --filter EmployeeManagementTest` → new tests FAIL.
- [ ] **Step 3: Implement** the four actions and routes. Use `$request->validate()` like the existing controllers. Note: Sanctum caches the authenticated user per test app instance — when a test calls HR then the peserta token in one test, call `$this->app['auth']->forgetGuards()` between requests.
- [ ] **Step 4: Run** `php artisan test` → all PASS.
- [ ] **Step 5: Commit** `feat: HR create/update/deactivate/reset-password for peserta`

### Task 3: Frontend — Peserta page and sidebar navigation

**Files:**
- Modify: `frontend/src/services/api.js`, `frontend/src/components/admin/AdminSidebar.jsx`, `frontend/src/components/admin/AdminView.jsx`, `frontend/src/App.jsx`
- Create: `frontend/src/components/admin/PesertaPage.jsx`, `frontend/src/components/admin/PesertaFormModal.jsx`, `frontend/src/utils/pesertaUtils.js`

**Interfaces:**
- Consumes: Task 1–2 endpoints and `EmployeeResource` shape.
- Produces:
  - `api.js`: `employeeApi.create(payload)`, `employeeApi.update(id, payload)`, `employeeApi.setStatus(id, isActive)`, `employeeApi.resetPassword(id, password)`, `shiftApi.list()`; payload keys are the backend snake_case names. On 422, `request()` must surface `errors` (throw an Error with `.errors` = server `errors` object) so forms can show field messages.
  - `pesertaUtils.js`: `JENIS_LABEL = { pkl: 'PKL', outsourcing: 'Outsourcing' }`; `uniqueAsal(list) -> string[]` — distinct non-empty `asal`, case-insensitive dedupe (first spelling wins), sorted; `matchesAsal(value, filter) -> boolean` — case-insensitive equality, empty filter matches all.
  - `AdminSidebar({ activePage, onNavigate, totalEmployees, totalRecords })`: items `report` "Laporan Absensi" and `peserta` "Peserta" clickable; others rendered dimmed, `disabled`.
  - `AdminView({ employees, records, onEmployeeSaved })`: state `page: 'report' | 'peserta'`; below `lg` a two-button tab row (Laporan Absensi / Peserta) replaces the hidden sidebar.
  - `App.jsx`: `upsertEmployee(emp)` replaces by `id` or appends; passed as `onEmployeeSaved`.
  - `PesertaPage({ employees, onEmployeeSaved })`: search (name/number), filters Jenis / Asal (`uniqueAsal`) / Status (Aktif, Nonaktif, Semua — default Aktif); table columns No Peserta, Nama, Jenis, Asal, Posisi, Shift, Status, Aksi (Ubah · Reset Password · Nonaktifkan/Aktifkan). Nonaktifkan asks `window.confirm`. Reset Password is a small modal with one password field. In mock mode (`USE_MOCK`) the add button and actions are hidden.
  - `PesertaFormModal({ employee|null, shifts, asalOptions, onClose, onSaved })`: fields per spec; password field only when creating; Asal uses `<input list>` + `<datalist>`; shows server field errors under each field; Indonesian labels; navy/teal styling.

- [ ] **Step 1:** Implement `api.js` additions and `pesertaUtils.js`.
- [ ] **Step 2:** Sidebar + AdminView page switching + mobile tab row; App `upsertEmployee`.
- [ ] **Step 3:** `PesertaPage` + `PesertaFormModal`.
- [ ] **Step 4: Verify** `npm run build` succeeds. With backend running and `VITE_USE_MOCK=false`, curl-free check left to controller (browser): add peserta → appears in list → login as them works; edit email; deactivate → status Nonaktif; reset password; filter Asal shows no case duplicates; at 375px width the tab row reaches Peserta.
- [ ] **Step 5: Commit** `feat: Peserta management page for HR`

### Task 4: Frontend — report filters and export columns

**Files:**
- Modify: `frontend/src/components/admin/AdminView.jsx` (report page filters), `frontend/src/utils/exportExcel.js`

**Interfaces:**
- Consumes: `uniqueAsal`, `matchesAsal`, `JENIS_LABEL` (Task 3); report rows carry `jenis`, `asal` (Task 1).
- Produces: report page filters Jenis and Asal combined with the existing search/month/date filters (KPIs and export use the filtered rows); `ATTENDANCE_HEADERS` gets `'Jenis', 'Asal'` after `'Employee Name'`, row values `row.jenis ?? ''`, `row.asal ?? ''` (raw stored value, same as backend CSV).

- [ ] **Step 1:** Add the two filters and include them in the reset button.
- [ ] **Step 2:** Export header/row change.
- [ ] **Step 3: Verify** `npm run build`; controller browser check: filter Jenis=PKL shows only PKL rows; exported CSV header order matches backend export.
- [ ] **Step 4: Commit** `feat: Jenis/Asal filters and export columns in attendance report`
