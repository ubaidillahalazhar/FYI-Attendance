import React, { useState } from 'react';
import { X } from 'lucide-react';
import { employeeApi } from '../../services/api';
import { JENIS_LABEL } from '../../utils/pesertaUtils';

const inputCls =
  'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20';

export default function PesertaFormModal({ employee, shifts, asalOptions, onClose, onSaved }) {
  const editing = !!employee;
  const [form, setForm] = useState({
    employee_no: employee?.employeeNo || '',
    name: employee?.name || '',
    email: employee?.email || '',
    jenis: employee?.jenis || 'pkl',
    asal: employee?.asal || '',
    position: employee?.position || '',
    department: employee?.department || '',
    shift_id: employee?.shiftId || '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setError('');
    const { password, ...rest } = form;
    const payload = { ...rest, shift_id: form.shift_id ? Number(form.shift_id) : null };
    try {
      const res = editing
        ? await employeeApi.update(employee.id, payload)
        : await employeeApi.create({ ...payload, password });
      onSaved(res.data);
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
      setSaving(false);
    }
  };

  const field = (key, label, input) => (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <div className="mt-1">{input}</div>
      {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key][0]}</p>}
    </label>
  );

  const text = (key, extra = {}) => (
    <input className={inputCls} value={form[key]} onChange={set(key)} required {...extra} />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
      <form
        onSubmit={submit}
        className="max-h-full w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-900">
            {editing ? 'Ubah Peserta' : 'Tambah Peserta'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Tutup">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {field('employee_no', 'No Peserta', text('employee_no'))}
          {field('name', 'Nama', text('name'))}
          {field('email', 'Email', text('email', { type: 'email' }))}
          {field(
            'jenis',
            'Jenis',
            <select className={inputCls} value={form.jenis} onChange={set('jenis')}>
              {Object.entries(JENIS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          )}
          {field(
            'asal',
            'Asal (sekolah / perusahaan)',
            <>
              {text('asal', { list: 'asal-options' })}
              <datalist id="asal-options">
                {asalOptions.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </>
          )}
          {field('position', 'Posisi', text('position'))}
          {field('department', 'Departemen', text('department'))}
          {field(
            'shift_id',
            'Shift',
            <select className={inputCls} value={form.shift_id} onChange={set('shift_id')} required>
              <option value="">Pilih shift</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.shiftIn}-{s.shiftOut})
                </option>
              ))}
            </select>
          )}
          {!editing && field('password', 'Password', text('password', { type: 'password', minLength: 8 }))}
        </div>

        {error && !Object.keys(errors).length && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
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
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
