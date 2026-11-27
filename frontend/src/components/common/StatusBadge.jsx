import React from 'react';

const STYLES = {
  Present: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Working: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Overtime: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  Late: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Late & Overtime': 'bg-orange-50 text-orange-700 ring-orange-600/20',
  'Early Out': 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Absent: 'bg-red-50 text-red-700 ring-red-600/20',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-slate-100 text-slate-700 ring-slate-600/20';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}
