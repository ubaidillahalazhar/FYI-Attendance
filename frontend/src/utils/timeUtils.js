/**
 * Convert HH:mm string to total minutes since midnight.
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || timeStr === '-' || !timeStr.includes(':')) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format Date object to HH:mm
 */
export function formatTimeHHMM(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Format Date object to YYYY-MM-DD (local time)
 */
export function formatDateISO(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculate attendance metrics (Minute In, Minute Out, Actual Working Minute, Remark)
 */
export function calculateAttendanceMetrics({
  shiftIn,
  shiftOut,
  actualIn,
  actualOut,
  shiftScheduleMinute = 540,
  overtimeMinutes = 0,
}) {
  const sIn = timeToMinutes(shiftIn);
  const sOut = timeToMinutes(shiftOut);
  const aIn = timeToMinutes(actualIn);
  const aOut = timeToMinutes(actualOut);

  const minuteIn = aIn !== null && sIn !== null ? aIn - sIn : 0;
  const minuteOut = aOut !== null && sOut !== null ? aOut - sOut : 0;
  const actualWorkingMinute = aIn !== null && aOut !== null ? Math.max(0, aOut - aIn) : 0;

  let remark = 'Present';
  if (!actualIn) {
    remark = 'Absent';
  } else if (minuteIn > 0 && overtimeMinutes > 0) {
    remark = 'Late & Overtime';
  } else if (minuteIn > 0) {
    remark = 'Late';
  } else if (overtimeMinutes > 0) {
    remark = 'Overtime';
  } else if (actualOut && minuteOut < 0) {
    remark = 'Early Out';
  } else if (!actualOut) {
    remark = 'Working';
  }

  return {
    minuteIn,
    minuteOut,
    actualWorkingMinute,
    shiftScheduleMinute,
    remark,
  };
}

/**
 * Calculate overtime duration in minutes and hours from HH:mm inputs
 */
export function calculateOvertimeDuration(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || end <= start) {
    return { minutes: 0, hours: 0 };
  }
  const minutes = end - start;
  const hours = Number((minutes / 60).toFixed(2));
  return { minutes, hours };
}
