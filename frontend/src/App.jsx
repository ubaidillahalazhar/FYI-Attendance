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
import LoginPage from './components/common/LoginPage';
import { attendanceApi, authApi, employeeApi, USE_MOCK } from './services/api';

export default function App() {
  const [mode, setMode] = useState('employee'); // 'employee' | 'admin'
  const [records, setRecords] = useState(() => (USE_MOCK ? generateInitialAttendanceRecords() : []));
  const [employees, setEmployees] = useState(USE_MOCK ? EMPLOYEES : []);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(USE_MOCK || !authApi.hasToken());
  // Mock mode: fixed demo employee. API mode: the logged-in peserta (null for HR).
  const me = USE_MOCK ? CURRENT_EMPLOYEE : user?.employee;
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Restore session on load, and drop it when any request returns 401
  useEffect(() => {
    if (USE_MOCK) return;
    const onLogout = () => {
      setUser(null);
      setRecords([]);
      setEmployees([]);
    };
    window.addEventListener('auth:logout', onLogout);
    if (authApi.hasToken()) {
      authApi
        .me()
        .then((res) => setUser(res.user))
        .catch(() => {})
        .finally(() => setAuthReady(true));
    }
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  // Load role-specific data from the API once logged in
  useEffect(() => {
    if (USE_MOCK || !user) return;
    const load =
      user.role === 'hr'
        ? Promise.all([attendanceApi.fetchAdminReport(), employeeApi.list()]).then(
            ([rep, emps]) => {
              setRecords(rep.data || []);
              setEmployees(emps.data || []);
            }
          )
        : attendanceApi.fetchMyHistory().then((res) => setRecords(res.data || []));
    load.catch((err) => showToast(err.message));
  }, [user]);

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
    setRecords([]);
  };

  const todayISO = formatDateISO(new Date());

  const currentEmployeeRecords = useMemo(
    () =>
      records
        .filter((r) => r.employeeId === me?.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [records, me]
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
      shiftIn: me.shiftIn,
      shiftOut: me.shiftOut,
      actualIn: nowTime,
      actualOut: null,
      shiftScheduleMinute: me.shiftScheduleMinute,
      overtimeMinutes: 0,
    });

    const newRecord = {
      id: Date.now(),
      employeeId: me.id,
      employeeNo: me.employeeNo,
      employeeName: me.name,
      position: me.position,
      department: me.department,
      date: todayISO,
      shiftName: me.shiftName,
      shiftIn: me.shiftIn,
      shiftOut: me.shiftOut,
      actualIn: nowTime,
      actualOut: '',
      minuteIn: metrics.minuteIn,
      minuteOut: 0,
      actualWorkingMinute: 0,
      shiftScheduleMinute: me.shiftScheduleMinute,
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
          ...payload,
        });
      } catch (err) {
        showToast(err.message);
        return;
      }
    }

    setRecords((prev) => {
      const existing = prev.find(
        (r) => r.employeeId === me.id && r.date === payload.overtimeDate
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
        employeeId: me.id,
        employeeNo: me.employeeNo,
        employeeName: me.name,
        position: me.position,
        department: me.department,
        date: payload.overtimeDate,
        shiftName: me.shiftName,
        shiftIn: me.shiftIn,
        shiftOut: me.shiftOut,
        actualIn: me.shiftIn,
        actualOut: payload.endTime,
        minuteIn: 0,
        minuteOut: payload.overtimeMinutes,
        actualWorkingMinute: me.shiftScheduleMinute + payload.overtimeMinutes,
        shiftScheduleMinute: me.shiftScheduleMinute,
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

  if (!USE_MOCK && !authReady) return null;
  if (!USE_MOCK && !user) return <LoginPage onLoggedIn={setUser} />;

  const viewMode = USE_MOCK ? mode : user.role === 'hr' ? 'admin' : 'employee';

  return (
    <div className="min-h-screen bg-slate-50">
      <TopModeBar mode={viewMode} setMode={setMode} user={user} onLogout={handleLogout} />

      {viewMode === 'employee' ? (
        <EmployeeView
          employee={me}
          employeeRecords={currentEmployeeRecords}
          todayRecord={todayRecord}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          onSubmitOvertime={handleSubmitOvertime}
          toastMessage={toastMessage}
        />
      ) : (
        <AdminView employees={employees} records={records} />
      )}
    </div>
  );
}
