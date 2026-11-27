const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true';

const TOKEN_KEY = 'geoattend_token';
const getToken = () => localStorage.getItem(TOKEN_KEY);

async function request(endpoint, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('auth:logout'));
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `API Error (${response.status})`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const authApi = {
  async login(email, password) {
    const res = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    return res;
  },

  async logout() {
    try {
      await request('/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  me: () => request('/me'),
  hasToken: () => !!getToken(),
};

export const employeeApi = {
  list: () => request('/employees'),
};

export const attendanceApi = {
  async fetchAdminReport({ search = '', month = '', date = '' } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (month) params.append('month', month);
    if (date) params.append('date', date);
    return request(`/admin/attendance-report?${params.toString()}`);
  },

  fetchMyHistory: () => request('/me/attendance'),

  async fetchEmployeeMonthlyHistory(employeeId, month = '') {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return request(`/employees/${employeeId}/attendance${query}`);
  },

  async clockIn({ latitude, longitude }) {
    return request('/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  },

  async clockOut({ latitude, longitude }) {
    return request('/attendance/clock-out', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  },

  async submitOvertimeRequest({ overtimeDate, startTime, endTime, reason }) {
    return request('/overtime-requests', {
      method: 'POST',
      body: JSON.stringify({
        overtime_date: overtimeDate,
        start_time: startTime,
        end_time: endTime,
        reason,
      }),
    });
  },

};
