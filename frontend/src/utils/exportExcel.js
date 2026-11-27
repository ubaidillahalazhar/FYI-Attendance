export const ATTENDANCE_HEADERS = [
  'No.',
  'Employee No.',
  'Employee Name',
  'Date',
  'Position',
  'Shift Name',
  'Shift In',
  'Shift Out',
  'Actual In',
  'Actual Out',
  'Minute In',
  'Minute Out',
  'Actual Working Minute',
  'Shift Schedule Minute',
  'Remark',
  'Overtime Reason',
  'Overtime Start',
  'Overtime End',
  'Overtime Minute(s)',
  'Overtime Hour(s)',
];

function escapeCsvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export attendance records to an Excel-compatible CSV file (UTF-8 with BOM).
 */
export function exportAttendanceToExcel(records, filename = 'attendance-report.csv') {
  const rows = records.map((row, idx) => [
    idx + 1,
    row.employeeNo,
    row.employeeName,
    row.date,
    row.position,
    row.shiftName,
    row.shiftIn,
    row.shiftOut,
    row.actualIn || '-',
    row.actualOut || '-',
    row.minuteIn,
    row.minuteOut,
    row.actualWorkingMinute,
    row.shiftScheduleMinute,
    row.remark,
    row.overtimeReason || '-',
    row.overtimeStart || '-',
    row.overtimeEnd || '-',
    row.overtimeMinutes,
    row.overtimeHours,
  ]);

  const csvContent = [
    ATTENDANCE_HEADERS.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
