import React from 'react';
import { X, Calendar, Clock, Timer } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function AttendanceHistoryModal({ isOpen, onClose, employee, records }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-navy-900 px-5 py-4 text-white">
          <div>
            <h3 className="text-base font-semibold">Riwayat Absensi</h3>
            <p className="text-xs text-slate-300">
              {employee.name} &middot; {employee.employeeNo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50 text-center">
          <div className="py-2.5">
            <p className="text-[11px] font-medium text-slate-500">Total Days</p>
            <p className="text-sm font-bold text-navy-900">{records.length}</p>
          </div>
          <div className="py-2.5">
            <p className="text-[11px] font-medium text-slate-500">Late</p>
            <p className="text-sm font-bold text-amber-600">
              {records.filter((r) => r.minuteIn > 0).length}
            </p>
          </div>
          <div className="py-2.5">
            <p className="text-[11px] font-medium text-slate-500">Overtime Hrs</p>
            <p className="text-sm font-bold text-teal-600">
              {records.reduce((sum, r) => sum + Number(r.overtimeHours || 0), 0).toFixed(1)}h
            </p>
          </div>
        </div>

        {/* Records list */}
        <div className="custom-scrollbar flex-1 space-y-2.5 overflow-y-auto p-4">
          {records.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Belum ada data absensi tercatat.
            </p>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-teal-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    <span>{rec.date}</span>
                  </div>
                  <StatusBadge status={rec.remark} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                      Clock In
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 font-semibold text-slate-800">
                      <Clock className="h-3 w-3 text-emerald-600" />
                      {rec.actualIn || '--:--'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                      Clock Out
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 font-semibold text-slate-800">
                      <Clock className="h-3 w-3 text-rose-500" />
                      {rec.actualOut || '--:--'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                      Overtime
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 font-semibold text-teal-700">
                      <Timer className="h-3 w-3 text-teal-600" />
                      {rec.overtimeHours > 0 ? `${rec.overtimeHours} hrs` : '-'}
                    </span>
                  </div>
                </div>

                {rec.overtimeReason && rec.overtimeReason !== '-' && (
                  <p className="mt-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">OT Note:</span>{' '}
                    {rec.overtimeReason}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
