import { calculateAttendanceMetrics, formatDateISO } from '../utils/timeUtils';

export const EMPLOYEES = [
  {
    id: 1,
    employeeNo: 'EMP-2024-001',
    name: 'Budi Santoso',
    email: 'budi.santoso@company.co.id',
    position: 'Senior Frontend Engineer',
    department: 'Engineering',
    shiftName: 'Regular Office',
    shiftIn: '08:00',
    shiftOut: '17:00',
    shiftScheduleMinute: 540,
    avatarInitials: 'BS',
  },
  {
    id: 2,
    employeeNo: 'EMP-2024-002',
    name: 'Siti Rahmawati',
    email: 'siti.rahmawati@company.co.id',
    position: 'UI/UX Designer',
    department: 'Product Design',
    shiftName: 'Regular Office',
    shiftIn: '08:00',
    shiftOut: '17:00',
    shiftScheduleMinute: 540,
    avatarInitials: 'SR',
  },
  {
    id: 3,
    employeeNo: 'EMP-2024-003',
    name: 'Andi Pratama',
    email: 'andi.pratama@company.co.id',
    position: 'Backend Developer',
    department: 'Engineering',
    shiftName: 'Morning Shift A',
    shiftIn: '07:00',
    shiftOut: '16:00',
    shiftScheduleMinute: 540,
    avatarInitials: 'AP',
  },
  {
    id: 4,
    employeeNo: 'EMP-2024-004',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@company.co.id',
    position: 'HR Operations Specialist',
    department: 'Human Resources',
    shiftName: 'Regular Office',
    shiftIn: '08:00',
    shiftOut: '17:00',
    shiftScheduleMinute: 540,
    avatarInitials: 'DL',
  },
  {
    id: 5,
    employeeNo: 'EMP-2024-005',
    name: 'Reza Mahendra',
    email: 'reza.mahendra@company.co.id',
    position: 'Production Supervisor',
    department: 'Operations',
    shiftName: 'Morning Shift A',
    shiftIn: '07:00',
    shiftOut: '16:00',
    shiftScheduleMinute: 540,
    avatarInitials: 'RM',
  },
  {
    id: 6,
    employeeNo: 'EMP-2024-006',
    name: 'Nadia Kusuma',
    email: 'nadia.kusuma@company.co.id',
    position: 'QA Automation Engineer',
    department: 'Engineering',
    shiftName: 'Mid Shift B',
    shiftIn: '09:00',
    shiftOut: '18:00',
    shiftScheduleMinute: 540,
    avatarInitials: 'NK',
  },
];

export const CURRENT_EMPLOYEE = EMPLOYEES[0];

const OVERTIME_REASONS = [
  'Production hotfix deployment',
  'Monthly payroll reconciliation',
  'Client demo preparation',
  'Database migration monitoring',
  'Sprint release QA regression',
];

/**
 * Generates realistic 1-month attendance data (past 22 workdays) for all employees.
 */
export function generateInitialAttendanceRecords() {
  const records = [];
  const today = new Date();
  let idCounter = 1000;

  for (let dayOffset = 1; dayOffset <= 28; dayOffset++) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - dayOffset);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const dateStr = formatDateISO(dateObj);

    EMPLOYEES.forEach((emp, empIndex) => {
      const seed = (dayOffset * 13 + empIndex * 7) % 10;
      const shiftStartHour = Number(emp.shiftIn.split(':')[0]);
      const shiftEndHour = Number(emp.shiftOut.split(':')[0]);

      // Vary clock-in slightly (early, on-time, or late)
      let inOffsetMin = -5;
      if (seed === 2 || seed === 7) inOffsetMin = 12 + (seed * 2); // Late
      else if (seed === 4) inOffsetMin = 0;
      else inOffsetMin = -(seed + 2);

      const inTotalMin = shiftStartHour * 60 + inOffsetMin;
      const actualIn = `${String(Math.floor(inTotalMin / 60)).padStart(2, '0')}:${String(
        inTotalMin % 60
      ).padStart(2, '0')}`;

      // Occasional overtime
      const hasOvertime = seed === 1 || seed === 6;
      const overtimeMinutes = hasOvertime ? (seed === 1 ? 120 : 90) : 0;
      const overtimeHours = Number((overtimeMinutes / 60).toFixed(2));
      const outTotalMin = shiftEndHour * 60 + (hasOvertime ? overtimeMinutes : seed === 8 ? -10 : 5);
      const actualOut = `${String(Math.floor(outTotalMin / 60)).padStart(2, '0')}:${String(
        outTotalMin % 60
      ).padStart(2, '0')}`;

      const overtimeStart = hasOvertime ? emp.shiftOut : '-';
      const overtimeEnd = hasOvertime ? actualOut : '-';
      const overtimeReason = hasOvertime
        ? OVERTIME_REASONS[(dayOffset + empIndex) % OVERTIME_REASONS.length]
        : '-';

      const metrics = calculateAttendanceMetrics({
        shiftIn: emp.shiftIn,
        shiftOut: emp.shiftOut,
        actualIn,
        actualOut,
        shiftScheduleMinute: emp.shiftScheduleMinute,
        overtimeMinutes,
      });

      records.push({
        id: idCounter++,
        employeeId: emp.id,
        employeeNo: emp.employeeNo,
        employeeName: emp.name,
        position: emp.position,
        department: emp.department,
        date: dateStr,
        shiftName: emp.shiftName,
        shiftIn: emp.shiftIn,
        shiftOut: emp.shiftOut,
        actualIn,
        actualOut,
        minuteIn: metrics.minuteIn,
        minuteOut: metrics.minuteOut,
        actualWorkingMinute: metrics.actualWorkingMinute,
        shiftScheduleMinute: metrics.shiftScheduleMinute,
        remark: metrics.remark,
        overtimeReason,
        overtimeStart,
        overtimeEnd,
        overtimeMinutes,
        overtimeHours,
      });
    });
  }

  return records;
}
