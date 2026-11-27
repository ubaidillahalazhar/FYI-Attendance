-- GeoAttend HR - PostgreSQL Schema (PostgreSQL 14+)
-- Referensi skema langsung jika ingin menginisialisasi DB tanpa artisan migrate

CREATE TABLE IF NOT EXISTS shifts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    shift_in TIME NOT NULL,
    shift_out TIME NOT NULL,
    schedule_minutes INTEGER NOT NULL DEFAULT 540,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    employee_no VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    position VARCHAR(120) NOT NULL,
    department VARCHAR(120) NOT NULL,
    shift_id BIGINT NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    avatar_initials VARCHAR(5),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendances (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id BIGINT NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    attendance_date DATE NOT NULL,
    actual_in TIME NULL,
    actual_out TIME NULL,
    clock_in_lat DOUBLE PRECISION NULL,
    clock_in_lng DOUBLE PRECISION NULL,
    clock_out_lat DOUBLE PRECISION NULL,
    clock_out_lng DOUBLE PRECISION NULL,
    distance_in_meters INTEGER NULL,
    minute_in INTEGER NOT NULL DEFAULT 0,          -- Negatif = datang awal, Positif = terlambat
    minute_out INTEGER NOT NULL DEFAULT 0,         -- Negatif = pulang cepat, Positif = lewat jam pulang
    actual_working_minute INTEGER NOT NULL DEFAULT 0,
    shift_schedule_minute INTEGER NOT NULL DEFAULT 540,
    remark VARCHAR(50) NOT NULL DEFAULT 'Present',
    overtime_reason TEXT NULL,
    overtime_start TIME NULL,
    overtime_end TIME NULL,
    overtime_minutes INTEGER NOT NULL DEFAULT 0,
    overtime_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_employee_attendance_date UNIQUE (employee_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS overtime_requests (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    overtime_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances (attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_employee_date ON attendances (employee_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_overtime_employee ON overtime_requests (employee_id, overtime_date DESC);

-- Sample Seed Data
INSERT INTO shifts (name, shift_in, shift_out, schedule_minutes) VALUES
('Regular Office', '08:00:00', '17:00:00', 540),
('Morning Shift A', '07:00:00', '16:00:00', 540),
('Mid Shift B', '09:00:00', '18:00:00', 540)
ON CONFLICT DO NOTHING;

INSERT INTO employees (employee_no, name, email, position, department, shift_id, avatar_initials) VALUES
('EMP-2024-001', 'Budi Santoso', 'budi.santoso@company.co.id', 'Senior Frontend Engineer', 'Engineering', 1, 'BS'),
('EMP-2024-002', 'Siti Rahmawati', 'siti.rahmawati@company.co.id', 'UI/UX Designer', 'Product Design', 1, 'SR'),
('EMP-2024-003', 'Andi Pratama', 'andi.pratama@company.co.id', 'Backend Developer', 'Engineering', 2, 'AP'),
('EMP-2024-004', 'Dewi Lestari', 'dewi.lestari@company.co.id', 'HR Operations Specialist', 'Human Resources', 1, 'DL'),
('EMP-2024-005', 'Reza Mahendra', 'reza.mahendra@company.co.id', 'Production Supervisor', 'Operations', 2, 'RM'),
('EMP-2024-006', 'Nadia Kusuma', 'nadia.kusuma@company.co.id', 'QA Automation Engineer', 'Engineering', 3, 'NK')
ON CONFLICT (employee_no) DO NOTHING;
