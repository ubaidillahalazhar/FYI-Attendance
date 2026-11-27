import React, { useEffect, useState } from 'react';
import {
  MapPin,
  LogIn,
  LogOut,
  ClipboardList,
  Clock4,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Briefcase,
  Lock,
} from 'lucide-react';
import AttendanceHistoryModal from './AttendanceHistoryModal';
import OvertimeRequestModal from './OvertimeRequestModal';
import { checkRealBrowserLocation, OFFICE_COORDS } from '../../utils/geofenceUtils';
import { formatDateISO } from '../../utils/timeUtils';

export default function EmployeeView({
  employee,
  employeeRecords,
  todayRecord,
  onClockIn,
  onClockOut,
  onSubmitOvertime,
  toastMessage,
}) {
  const [now, setNow] = useState(new Date());
  const [isInsideGeofence, setIsInsideGeofence] = useState(true);
  const [distanceMeters, setDistanceMeters] = useState(32);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTestRealGps = async () => {
    setGpsLoading(true);
    setGpsError('');
    try {
      const result = await checkRealBrowserLocation();
      setDistanceMeters(result.distance);
      setIsInsideGeofence(result.isInside);
    } catch (err) {
      setGpsError(err.message);
    } finally {
      setGpsLoading(false);
    }
  };

  const formattedClock = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hasClockedIn = Boolean(todayRecord?.actualIn);
  const hasClockedOut = Boolean(todayRecord?.actualOut);
  const clockInDisabled = !isInsideGeofence || hasClockedIn;
  const clockOutDisabled = !isInsideGeofence || !hasClockedIn || hasClockedOut;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-61px)] max-w-md flex-col px-4 py-6">
      {/* Feedback Toast */}
      {toastMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs font-medium text-teal-800 shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile App Card Container */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-teal-900 px-5 pb-6 pt-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white ring-2 ring-white/25">
                {employee.avatarInitials}
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{employee.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-300">
                  <Briefcase className="h-3 w-3 text-teal-400" />
                  {employee.position}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-teal-200">
              {employee.employeeNo}
            </span>
          </div>

          {/* Live Digital Clock */}
          <div className="mt-6 text-center">
            <p className="text-xs font-medium tracking-wide text-teal-300">{formattedDate}</p>
            <div className="mt-1 font-mono text-4xl font-bold tracking-wider text-white sm:text-5xl">
              {formattedClock}
            </div>
            <p className="mt-2 text-xs text-slate-300">
              Shift: <span className="font-medium text-white">{employee.shiftName}</span> (
              {employee.shiftIn} &ndash; {employee.shiftOut})
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="space-y-5 p-5">
          {/* Location Status Indicator */}
          <div
            className={`rounded-2xl border p-4 transition-all ${
              isInsideGeofence
                ? 'border-emerald-200 bg-emerald-50/70'
                : 'border-red-200 bg-red-50/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isInsideGeofence
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {isInsideGeofence ? (
                    <MapPin className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      isInsideGeofence ? 'text-emerald-800' : 'text-red-700'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isInsideGeofence ? 'animate-pulse bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    {isInsideGeofence ? 'Inside Office Area (Valid)' : 'Outside Radius'}
                  </span>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {OFFICE_COORDS.name} &middot; {distanceMeters}m from center (max{' '}
                    {OFFICE_COORDS.radiusMeters}m)
                  </p>
                </div>
              </div>
            </div>
            {gpsError && <p className="mt-2 text-[11px] text-red-600">{gpsError}</p>}
          </div>

          {/* Today Status Summary */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Today Clock In</p>
              <p className="mt-0.5 font-mono text-base font-bold text-navy-900">
                {todayRecord?.actualIn || '--:--'}
              </p>
            </div>
            <div className="border-l border-slate-200">
              <p className="text-[11px] font-medium text-slate-500">Today Clock Out</p>
              <p className="mt-0.5 font-mono text-base font-bold text-navy-900">
                {todayRecord?.actualOut || '--:--'}
              </p>
            </div>
          </div>

          {/* Clock In & Clock Out Buttons */}
          <div>
            {!isInsideGeofence && (
              <div className="mb-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-red-600">
                <Lock className="h-3.5 w-3.5" />
                <span>Clocking locked while outside office geofence</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={clockInDisabled}
                onClick={() =>
                  onClockIn({
                    latitude: OFFICE_COORDS.lat,
                    longitude: OFFICE_COORDS.lng,
                  })
                }
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl px-4 py-4 text-sm font-semibold transition-all ${
                  clockInDisabled
                    ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-65'
                    : 'bg-teal-600 text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98]'
                }`}
              >
                <LogIn className="h-5 w-5" />
                <span>{hasClockedIn ? 'Clocked In' : 'Clock In'}</span>
              </button>

              <button
                type="button"
                disabled={clockOutDisabled}
                onClick={() =>
                  onClockOut({
                    latitude: OFFICE_COORDS.lat,
                    longitude: OFFICE_COORDS.lng,
                  })
                }
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl px-4 py-4 text-sm font-semibold transition-all ${
                  clockOutDisabled
                    ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-65'
                    : 'bg-navy-900 text-white shadow-md shadow-navy-900/20 hover:bg-navy-800 active:scale-[0.98]'
                }`}
              >
                <LogOut className="h-5 w-5" />
                <span>{hasClockedOut ? 'Clocked Out' : 'Clock Out'}</span>
              </button>
            </div>
          </div>

          {/* Employee Dashboard Menu (2 required buttons) */}
          <div className="border-t border-slate-200 pt-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Employee Menu
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-teal-500 hover:bg-teal-50/40 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-800 transition group-hover:bg-teal-600 group-hover:text-white">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">Absensi</p>
                  <p className="text-[11px] text-slate-500">Attendance History</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowOvertimeModal(true)}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-teal-500 hover:bg-teal-50/40 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-600 group-hover:text-white">
                  <Clock4 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">Request Overtime</p>
                  <p className="text-[11px] text-slate-500">Submit OT Form</p>
                </div>
              </button>
            </div>
          </div>

          {/* Geofence Demo Controls */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Geofence Simulator
              </span>
              <button
                type="button"
                onClick={handleTestRealGps}
                disabled={gpsLoading}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800"
              >
                <Navigation className="h-3 w-3" />
                {gpsLoading ? 'Locating...' : 'Use Live GPS'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsInsideGeofence(true);
                  setDistanceMeters(32);
                  setGpsError('');
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isInsideGeofence
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Inside Radius
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsInsideGeofence(false);
                  setDistanceMeters(840);
                  setGpsError('');
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  !isInsideGeofence
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Outside Radius
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              Active date: {formatDateISO(now)} &middot; Toggle status above to test button lock.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AttendanceHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        employee={employee}
        records={employeeRecords}
      />

      <OvertimeRequestModal
        isOpen={showOvertimeModal}
        onClose={() => setShowOvertimeModal(false)}
        onSubmit={onSubmitOvertime}
      />
    </main>
  );
}
