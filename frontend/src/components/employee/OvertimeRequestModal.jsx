import React, { useState } from 'react';
import { X, Clock, Calendar, FileText, Send } from 'lucide-react';
import { calculateOvertimeDuration, formatDateISO } from '../../utils/timeUtils';

export default function OvertimeRequestModal({ isOpen, onClose, onSubmit }) {
  const [overtimeDate, setOvertimeDate] = useState(formatDateISO(new Date()));
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:30');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const { minutes, hours } = calculateOvertimeDuration(startTime, endTime);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!overtimeDate || !startTime || !endTime || !reason.trim()) {
      setError('Mohon lengkapi seluruh kolom pengajuan lembur.');
      return;
    }
    if (minutes <= 0) {
      setError('Jam selesai lembur harus lebih besar daripada jam mulai.');
      return;
    }

    onSubmit({
      overtimeDate,
      startTime,
      endTime,
      reason: reason.trim(),
      overtimeMinutes: minutes,
      overtimeHours: hours,
    });

    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-navy-900 px-5 py-4 text-white">
          <div>
            <h3 className="text-base font-semibold">Request Overtime</h3>
            <p className="text-xs text-slate-300">Ajukan permohonan lembur ke HR / Admin</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-teal-600" />
              Overtime Date
            </label>
            <input
              type="date"
              value={overtimeDate}
              onChange={(e) => setOvertimeDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                required
              />
            </div>
          </div>

          {/* Calculated duration pill */}
          <div className="flex items-center justify-between rounded-lg bg-teal-50 px-3.5 py-2.5 text-xs text-teal-800 ring-1 ring-teal-200">
            <span>Estimated Duration</span>
            <span className="font-bold">
              {minutes > 0 ? `${minutes} min (${hours} hrs)` : 'Invalid range'}
            </span>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <FileText className="h-3.5 w-3.5 text-teal-600" />
              Reason
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Penyelesaian deployment fitur modul absensi..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              <Send className="h-3.5 w-3.5" />
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
