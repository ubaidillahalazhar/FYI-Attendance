import React from 'react';
import { ShieldCheck, Smartphone, LayoutDashboard, Database, LogOut } from 'lucide-react';
import { USE_MOCK } from '../../services/api';

export default function TopModeBar({ mode, setMode, user, onLogout }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-navy-900 text-white shadow-sm">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 ring-1 ring-teal-400/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight sm:text-base">
              GeoAttend <span className="text-teal-400">HR</span>
            </h1>
            <p className="hidden text-[11px] text-slate-300 sm:block">
              Geofencing Attendance &amp; Overtime Management
            </p>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-200">{user.name}</span>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500 sm:text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
        <div className="flex items-center rounded-lg bg-navy-950/70 p-1 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => setMode('employee')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all sm:text-sm ${
              mode === 'employee'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Employee Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('admin')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all sm:text-sm ${
              mode === 'admin'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Admin Mode</span>
          </button>
        </div>
        )}

        {/* Data Source Indicator */}
        <div className="hidden items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10 lg:flex">
          <Database className="h-3.5 w-3.5 text-teal-400" />
          <span>{USE_MOCK ? 'Demo Mode (Mock State)' : 'Connected: Laravel + PostgreSQL'}</span>
        </div>
      </div>
    </header>
  );
}
