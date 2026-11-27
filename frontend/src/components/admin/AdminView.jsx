import React, { useMemo, useState } from 'react';
import {
  Search,
  Calendar,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock4,
  RotateCcw,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AttendanceTable from './AttendanceTable';
import EmployeeProfileDrawer from './EmployeeProfileDrawer';
import { exportAttendanceToExcel } from '../../utils/exportExcel';

export default function AdminView({ employees, records }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  const availableMonths = useMemo(() => {
    const months = new Set(records.map((r) => r.date.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesName =
        !searchQuery.trim() ||
        rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employeeNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMonth = !selectedMonth || rec.date.startsWith(selectedMonth);
      const matchesDate = !selectedDate || rec.date === selectedDate;
      return matchesName && matchesMonth && matchesDate;
    });
  }, [records, searchQuery, selectedMonth, selectedDate]);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );

  const selectedEmployeeRecords = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return records
      .filter((r) => r.employeeId === selectedEmployeeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, selectedEmployeeId]);

  const kpis = useMemo(() => {
    const total = filteredRecords.length;
    const onTime = filteredRecords.filter((r) => r.minuteIn <= 0 && r.actualIn).length;
    const late = filteredRecords.filter((r) => r.minuteIn > 0).length;
    const totalOtHours = filteredRecords
      .reduce((acc, r) => acc + Number(r.overtimeHours || 0), 0)
      .toFixed(1);
    return { total, onTime, late, totalOtHours };
  }, [filteredRecords]);

  const handleGlobalExport = () => {
    const suffix = selectedDate || selectedMonth || 'all-records';
    exportAttendanceToExcel(filteredRecords, `geoattend-report-${suffix}.csv`);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMonth('');
    setSelectedDate('');
  };

  return (
    <div className="flex min-h-[calc(100vh-61px)] bg-slate-50">
      <AdminSidebar totalEmployees={employees.length} totalRecords={records.length} />

      <main className="min-w-0 flex-1 p-5 lg:p-8">
        {/* Page Heading */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
              Attendance Directory &amp; Report
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor real-time geofenced attendance, shift compliance, and employee overtime logs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGlobalExport}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Filtered Logs</span>
              <Users className="h-4 w-4 text-navy-700" />
            </div>
            <p className="mt-2 text-2xl font-bold text-navy-900">{kpis.total}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">On-Time Entries</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{kpis.onTime}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Late Entries</span>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">{kpis.late}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Overtime</span>
              <Clock4 className="h-4 w-4 text-teal-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-teal-700">{kpis.totalOtHours} hrs</p>
          </div>
        </div>

        {/* Top Toolbar Actions */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Search by Employee Name */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Employee Name or Employee No..."
              className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedDate('');
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="">All Months</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Exact Date Filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />

          {(searchQuery || selectedMonth || selectedDate) && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Hint */}
        <p className="mb-2.5 text-xs text-slate-500">
          Tip: Click any <span className="font-semibold text-teal-700">Employee Name</span> in the
          table below to open their 1-Month Attendance History drawer.
        </p>

        {/* 20-Column Table */}
        <AttendanceTable
          records={filteredRecords}
          onSelectEmployee={(empId) => setSelectedEmployeeId(empId)}
        />
      </main>

      {/* Interactive Employee Profile Side-Drawer */}
      <EmployeeProfileDrawer
        employee={selectedEmployee}
        records={selectedEmployeeRecords}
        onClose={() => setSelectedEmployeeId(null)}
      />
    </div>
  );
}
