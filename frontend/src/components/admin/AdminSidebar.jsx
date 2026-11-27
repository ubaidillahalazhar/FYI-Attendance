import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Clock,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'report', label: 'Attendance Report', icon: CalendarCheck, active: true },
  { id: 'employees', label: 'Employee Directory', icon: Users, active: false },
  { id: 'overtime', label: 'Overtime Approvals', icon: Clock, active: false },
  { id: 'geofence', label: 'Geofence Zones', icon: MapPin, active: false },
  { id: 'exports', label: 'Payroll Exports', icon: FileSpreadsheet, active: false },
];

export default function AdminSidebar({ totalEmployees, totalRecords }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <LayoutDashboard className="h-3.5 w-3.5 text-teal-600" />
          <span>HR Administration</span>
        </div>

        <nav className="mt-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  item.active
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${item.active ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-200 p-5">
        <div className="rounded-xl bg-navy-50 p-3.5">
          <p className="text-xs font-semibold text-navy-900">Active Geofence Policy</p>
          <p className="mt-1 text-[11px] text-slate-600">
            HQ Office Radius: <span className="font-semibold text-teal-700">150 meters</span>
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-navy-100 pt-2.5 text-[11px] text-slate-500">
            <span>{totalEmployees} Staff</span>
            <span>{totalRecords} Logs</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
