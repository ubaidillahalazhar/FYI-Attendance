import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { ATTENDANCE_HEADERS } from '../../utils/exportExcel';

export default function AttendanceTable({ records, onSelectEmployee }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="custom-scrollbar overflow-x-auto">
        <table className="min-w-max divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-navy-900 text-white">
            <tr>
              {ATTENDANCE_HEADERS.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-100"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={ATTENDANCE_HEADERS.length}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  No attendance records match your current search or filter criteria.
                </td>
              </tr>
            ) : (
              records.map((row, index) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-teal-50/40"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-slate-700">
                    {row.employeeNo}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectEmployee(row.employeeId)}
                      className="font-semibold text-teal-700 underline decoration-teal-300 underline-offset-2 transition hover:text-navy-900 hover:decoration-navy-900"
                    >
                      {row.employeeName}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">
                    {row.date}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.position}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.shiftName}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">
                    {row.shiftIn}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">
                    {row.shiftOut}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">
                    {row.actualIn || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">
                    {row.actualOut || '-'}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 font-mono font-medium ${
                      row.minuteIn > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {row.minuteIn > 0 ? `+${row.minuteIn}` : row.minuteIn}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 font-mono font-medium ${
                      row.minuteOut < 0 ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    {row.minuteOut > 0 ? `+${row.minuteOut}` : row.minuteOut}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">
                    {row.actualWorkingMinute}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-500">
                    {row.shiftScheduleMinute}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={row.remark} />
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={row.overtimeReason}>
                    {row.overtimeReason || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">
                    {row.overtimeStart || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">
                    {row.overtimeEnd || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-teal-700">
                    {row.overtimeMinutes}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-teal-800">
                    {Number(row.overtimeHours).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
