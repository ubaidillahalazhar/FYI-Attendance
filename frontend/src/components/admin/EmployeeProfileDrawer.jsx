import React from 'react';
import { X, Download, Briefcase, Mail, Clock, CalendarDays } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { exportAttendanceToExcel } from '../../utils/exportExcel';

export default function EmployeeProfileDrawer({ employee, records, onClose }) {
  if (!employee) return null;

  const totalWorkingHours = (
    records.reduce((sum, r) => sum + Number(r.actualWorkingMinute || 0), 0) / 60
  ).toFixed(1);
  const totalOvertimeHours = records
    .reduce((sum, r) => sum + Number(r.overtimeHours || 0), 0)
    .toFixed(2);
  const lateDays = records.filter((r) => r.minuteIn > 0).length;

  const handleDownloadIndividualExcel = () => {
    const safeName = employee.name.toLowerCase().replace(/\s+/g, '-');
    exportAttendanceToExcel(records, `1-month-attendance-${employee.employeeNo}-${safeName}.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      {/* Backdrop click closes drawer */}
      <div className="flex-1" onClick={onClose} />

      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Drawer Header */}
        <div className="border-b border-slate-200 bg-navy-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-base font-bold text-white ring-2 ring-white/25">
                {employee.avatarInitials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{employee.name}</h2>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs text-teal-300">
                    {employee.employeeNo}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-teal-400" />
                    {employee.position} &middot; {employee.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-teal-400" />
                    {employee.email}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Metrics + Dedicated Download Action */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-navy-900">
                <CalendarDays className="h-4 w-4 text-teal-600" />
                1-Month Attendance History
              </h3>
              <p className="text-xs text-slate-500">
                Default Shift: {employee.shiftName} ({employee.shiftIn} &ndash; {employee.shiftOut})
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadIndividualExcel}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              <Download className="h-4 w-4" />
              Download as Excel
            </button>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Work Days</p>
              <p className="mt-0.5 text-lg font-bold text-navy-900">{records.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Working Hrs</p>
              <p className="mt-0.5 text-lg font-bold text-navy-900">{totalWorkingHours}h</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Late Days</p>
              <p className="mt-0.5 text-lg font-bold text-amber-600">{lateDays}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Overtime</p>
              <p className="mt-0.5 text-lg font-bold text-teal-700">{totalOvertimeHours}h</p>
            </div>
          </div>
        </div>

        {/* 1-Month Table */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-4">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3.5 py-2.5 font-semibold">Date</th>
                  <th className="px-3.5 py-2.5 font-semibold">In / Out</th>
                  <th className="px-3.5 py-2.5 font-semibold">Min In</th>
                  <th className="px-3.5 py-2.5 font-semibold">Work Min</th>
                  <th className="px-3.5 py-2.5 font-semibold">OT (Hrs)</th>
                  <th className="px-3.5 py-2.5 font-semibold">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-3.5 py-2.5 font-mono font-medium text-slate-800">
                      {rec.date}
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {rec.actualIn || '--:--'} &rarr; {rec.actualOut || '--:--'}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-3.5 py-2.5 font-mono font-medium ${
                        rec.minuteIn > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {rec.minuteIn > 0 ? `+${rec.minuteIn}` : rec.minuteIn}
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-slate-700">
                      {rec.actualWorkingMinute}m
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-2.5 font-mono font-semibold text-teal-700">
                      {rec.overtimeHours > 0 ? `${rec.overtimeHours}h` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-2.5">
                      <StatusBadge status={rec.remark} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
