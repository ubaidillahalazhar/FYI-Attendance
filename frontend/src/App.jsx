import React, { useEffect, useMemo, useState } from 'react';
import TopModeBar from './components/common/TopModeBar';
import EmployeeView from './components/employee/EmployeeView';
import AdminView from './components/admin/AdminView';
import {
  CURRENT_EMPLOYEE,
  EMPLOYEES,
  generateInitialAttendanceRecords,
} from './data/mockData';
import {
  calculateAttendanceMetrics,
  formatDateISO,
  formatTimeHHMM,
} from './utils/timeUtils';
import { attendanceApi, USE_MOCK } from './services/api';

export default function App() {
  const [mode, setMode] = useState('employee'); // 'employee' | 'admin'
  const [records, setRecords] = useState(() => generateInitialAttendanceRecords());
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Load real data from Laravel + PostgreSQL when USE_MOCK=false
  useEffect(() => {
    if (USE_MOCK) return;
    attendanceApi
      .fetchAdminReport()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setRecords(res.data);
        }
      })
      .catch((err) => {
        console.warn('API fetch failed, falling back to local demo data:', err.message);
      });
  }, []);

  const todayISO = formatDateISO(new Date());

  const currentEmployeeRecords = useMemo(
    () =>
      records
        .filter((r) => r.employeeId === CURRENT_EMPLOYEE.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [records]
  );

  const todayRecord = useMemo(
    () => currentEmployeeRecords.find((r) => r.date === todayISO) || null,
    [currentEmployeeRecords, todayISO]
  );

  const handleClockIn = async ({ latitude, longitude }) => {
    const nowTime = formatTimeHHMM(new Date());

    if (!USE_MOCK) {
      try {
        const res = await attendanceApi.clockIn({
          employeeId: CURRENT_EMPLOYEE.id,
          latitude,
          longitude,
        });
        if (res.data) {
          setRecords((prev) => [res.data, ...prev.filter((r) => r.id !== res.data.id)]);
          showToast(`Clock In recorded at ${res.data.actualIn} (Validated by Laravel API)`);
          return;
        }
      } catch (err) {
        showToast(err.message);
        return;
      }
    }

    const metrics = calculateAttendanceMetrics({
      shiftIn: CURRENT_EMPLOYEE.shiftIn,
      shiftOut: CURRENT_EMPLOYEE.shiftOut,
      actualIn: nowTime,
      actualOut: null,
      shiftScheduleMinute: CURRENT_EMPLOYEE.shiftScheduleMinute,
      overtimeMinutes: 0,
    });

    const newRecord = {
      id: Date.now(),
      employeeId: CURRENT_EMPLOYEE.id,
      employeeNo: CURRENT_EMPLOYEE.employeeNo,
      employeeName: CURRENT_EMPLOYEE.name,
      position: CURRENT_EMPLOYEE.position,
      department: CURRENT_EMPLOYEE.department,
      date: todayISO,
      shiftName: CURRENT_EMPLOYEE.shiftName,
      shiftIn: CURRENT_EMPLOYEE.shiftIn,
      shiftOut: CURRENT_EMPLOYEE.shiftOut,
      actualIn: nowTime,
      actualOut: '',
      minuteIn: metrics.minuteIn,
      minuteOut: 0,
      actualWorkingMinute: 0,
      shiftScheduleMinute: CURRENT_EMPLOYEE.shiftScheduleMinute,
      remark: metrics.remark,
      overtimeReason: '-',
      overtimeStart: '-',
      overtimeEnd: '-',
      overtimeMinutes: 0,
      overtimeHours: 0,
    };

    setRecords((prev) => [newRecord, ...prev]);
    showToast(`Clock In successful at ${nowTime}. Have a productive day!`);
  };

  const handleClockOut = async ({ latitude, longitude }) => {
    if (!todayRecord) return;
    const nowTime = formatTimeHHMM(new Date());

    if (!USE_MOCK) {
      try {
        const res = await attendanceApi.clockOut({
          employeeId: CURRENT_EMPLOYEE.id,
          latitude,
          longitude,
        });
        if (res.data) {
          setRecords((prev) => prev.map((r) => (r.id === res.data.id ? res.data : r)));
          showToast(`Clock Out recorded at ${res.data.actualOut} (Validated by Laravel API)`);
          return;
        }
      } catch (err) {
        showToast(err.message);
        return;
      }
    }

    const metrics = calculateAttendanceMetrics({
      shiftIn: todayRecord.shiftIn,
      shiftOut: todayRecord.shiftOut,
      actualIn: todayRecord.actualIn,
      actualOut: nowTime,
      shiftScheduleMinute: todayRecord.shiftScheduleMinute,
      overtimeMinutes: todayRecord.overtimeMinutes,
    });

    setRecords((prev) =>
      prev.map((rec) =>
        rec.id === todayRecord.id
          ? {
              ...rec,
              actualOut: nowTime,
              minuteIn: metrics.minuteIn,
              minuteOut: metrics.minuteOut,
              actualWorkingMinute: metrics.actualWorkingMinute,
              remark: metrics.remark,
            }
          : rec
      )
    );
    showToast(`Clock Out successful at ${nowTime}.`);
  };

  const handleSubmitOvertime = async (payload) => {
    if (!USE_MOCK) {
      try {
        await attendanceApi.submitOvertimeRequest({
          employeeId: CURRENT_EMPLOYEE.id,
          ...payload,
        });
      } catch (err) {
        showToast(err.message);
        return;
      }
    }

    setRecords((prev) => {
      const existing = prev.find(
        (r) => r.employeeId === CURRENT_EMPLOYEE.id && r.date === payload.overtimeDate
      );

      if (existing) {
        return prev.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                overtimeReason: payload.reason,
                overtimeStart: payload.startTime,
                overtimeEnd: payload.endTime,
                overtimeMinutes: payload.overtimeMinutes,
                overtimeHours: payload.overtimeHours,
                remark: r.minuteIn > 0 ? 'Late & Overtime' : 'Overtime',
              }
            : r
        );
      }

      const newOtRecord = {
        id: Date.now(),
        employeeId: CURRENT_EMPLOYEE.id,
        employeeNo: CURRENT_EMPLOYEE.employeeNo,
        employeeName: CURRENT_EMPLOYEE.name,
        position: CURRENT_EMPLOYEE.position,
        department: CURRENT_EMPLOYEE.department,
        date: payload.overtimeDate,
        shiftName: CURRENT_EMPLOYEE.shiftName,
        shiftIn: CURRENT_EMPLOYEE.shiftIn,
        shiftOut: CURRENT_EMPLOYEE.shiftOut,
        actualIn: CURRENT_EMPLOYEE.shiftIn,
        actualOut: payload.endTime,
        minuteIn: 0,
        minuteOut: payload.overtimeMinutes,
        actualWorkingMinute: CURRENT_EMPLOYEE.shiftScheduleMinute + payload.overtimeMinutes,
        shiftScheduleMinute: CURRENT_EMPLOYEE.shiftScheduleMinute,
        remark: 'Overtime',
        overtimeReason: payload.reason,
        overtimeStart: payload.startTime,
        overtimeEnd: payload.endTime,
        overtimeMinutes: payload.overtimeMinutes,
        overtimeHours: payload.overtimeHours,
      };
      return [newOtRecord, ...prev];
    });

    showToast(
      `Overtime request submitted for ${payload.overtimeDate} (${payload.overtimeHours} hrs).`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopModeBar mode={mode} setMode={setMode} />

      {mode === 'employee' ? (
        <EmployeeView
          employee={CURRENT_EMPLOYEE}
          employeeRecords={currentEmployeeRecords}
          todayRecord={todayRecord}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          onSubmitOvertime={handleSubmitOvertime}
          toastMessage={toastMessage}
        />
      ) : (
        <AdminView employees={EMPLOYEES} records={records} />
      )}
    </div>
  );
}
