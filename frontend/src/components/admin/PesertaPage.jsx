import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import PesertaFormModal from './PesertaFormModal';
import { employeeApi, shiftApi, USE_MOCK } from '../../services/api';
import { JENIS_LABEL, matchesAsal, uniqueAsal } from '../../utils/pesertaUtils';

const selectCls =
  'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20';
const actionCls = 'text-xs font-semibold text-teal-700 hover:underline';
const HEADERS = ['No Peserta', 'Nama', 'Jenis', 'Asal', 'Posisi', 'Shift', 'Status'];

function ResetPasswordModal({ employee, onClose, onDone }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await employeeApi.resetPassword(employee.id, password);
      onDone();
    } catch (err) {
      setError(err.errors?.password?.[0] || err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-900">Reset Password</h3>
          <button type="button" onClick={onClose} aria-label="Tutup">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <p className="text-sm text-slate-500">{employee.name}</p>
        <input
          type="password"
          minLength={8}
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password baru (min. 8 karakter)"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PesertaPage({ employees, onEmployeeSaved }) {
  const [search, setSearch] = useState('');
  const [jenis, setJenis] = useState('');
  const [asal, setAsal] = useState('');
  const [status, setStatus] = useState('active'); // active | inactive | all
  const [shifts, setShifts] = useState([]);
  const [form, setForm] = useState(null); // null | { employee: obj | null }
  const [resetFor, setResetFor] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (USE_MOCK) return;
    shiftApi
      .list()
      .then((r) => setShifts(r.data || []))
      .catch((e) => setNotice(e.message));
  }, []);

  const asalOptions = useMemo(() => uniqueAsal(employees), [employees]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter(
      (e) =>
        (!q || e.name.toLowerCase().includes(q) || e.employeeNo.toLowerCase().includes(q)) &&
        (!jenis || e.jenis === jenis) &&
        matchesAsal(e.asal, asal) &&
        (status === 'all' || (status === 'active') === e.isActive)
    );
  }, [employees, search, jenis, asal, status]);

  const toggleStatus = async (emp) => {
    if (emp.isActive && !window.confirm(`Nonaktifkan ${emp.name}? Peserta tidak bisa login lagi.`)) {
      return;
    }
    try {
      const res = await employeeApi.setStatus(emp.id, !emp.isActive);
      onEmployeeSaved(res.data);
      setNotice('');
    } catch (err) {
      setNotice(err.message);
    }
  };

  const headers = USE_MOCK ? HEADERS : [...HEADERS, 'Aksi'];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">Peserta</h2>
          <p className="mt-1 text-sm text-slate-500">Kelola peserta PKL dan outsourcing.</p>
        </div>
        {!USE_MOCK && (
          <button
            type="button"
            onClick={() => setForm({ employee: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Peserta
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau no peserta..."
            className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>
        <select value={jenis} onChange={(e) => setJenis(e.target.value)} className={selectCls}>
          <option value="">Semua Jenis</option>
          {Object.entries(JENIS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={asal} onChange={(e) => setAsal(e.target.value)} className={selectCls}>
          <option value="">Semua Asal</option>
          {asalOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="all">Semua</option>
        </select>
      </div>

      {notice && <p className="mb-3 text-sm text-red-600">{notice}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-900 text-xs uppercase tracking-wide text-white">
            <tr>
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{e.employeeNo}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-navy-900">{e.name}</td>
                <td className="px-4 py-3">{JENIS_LABEL[e.jenis] || '-'}</td>
                <td className="px-4 py-3">{e.asal || '-'}</td>
                <td className="px-4 py-3">{e.position}</td>
                <td className="whitespace-nowrap px-4 py-3">{e.shiftName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      e.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {e.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                {!USE_MOCK && (
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-3">
                      <button type="button" className={actionCls} onClick={() => setForm({ employee: e })}>
                        Ubah
                      </button>
                      <button type="button" className={actionCls} onClick={() => setResetFor(e)}>
                        Reset Password
                      </button>
                      <button type="button" className={actionCls} onClick={() => toggleStatus(e)}>
                        {e.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-slate-400">
                  Tidak ada peserta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <PesertaFormModal
          employee={form.employee}
          shifts={shifts}
          asalOptions={asalOptions}
          onClose={() => setForm(null)}
          onSaved={(emp) => {
            onEmployeeSaved(emp);
            setForm(null);
          }}
        />
      )}
      {resetFor && (
        <ResetPasswordModal
          employee={resetFor}
          onClose={() => setResetFor(null)}
          onDone={() => {
            setResetFor(null);
            setNotice('');
          }}
        />
      )}
    </div>
  );
}
