import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { authApi } from '../../services/api';

const inputCls =
  'mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';

export default function LoginPage({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      onLoggedIn(res.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20 text-teal-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-navy-900">
            GeoAttend <span className="text-teal-600">HR</span>
          </h1>
        </div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
          Kata sandi
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-60"
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
