const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `API Error (${response.status})`);
  }

  return response.json();
}

export const attendanceApi = {
  async fetchAdminReport({ search = '', month = '', date = '' } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (month) params.append('month', month);
    if (date) params.append('date', date);
    return request(`/admin/attendance-report?${params.toString()}`);
  },

  async fetchEmployeeMonthlyHistory(employeeId, month = '') {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return request(`/employees/${employeeId}/attendance${query}`);
  },

  async clockIn({ employeeId, latitude, longitude }) {
    return request('/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, latitude, longitude }),
    });
  },

  async clockOut({ employeeId, latitude, longitude }) {
    return request('/attendance/clock-out', {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, latitude, longitude }),
    });
  },

  async submitOvertimeRequest({ employeeId, overtimeDate, startTime, endTime, reason }) {
    return request('/overtime-requests', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: employeeId,
        overtime_date: overtimeDate,
        start_time: startTime,
        end_time: endTime,
        reason,
      }),
    });
  },

  getBackendExportUrl({ employeeId = '', month = '', search = '' } = {}) {
    const params = new URLSearchParams();
    if (employeeId) params.append('employee_id', employeeId);
    if (month) params.append('month', month);
    if (search) params.append('search', search);
    return `${API_BASE_URL}/admin/attendance-report/export?${params.toString()}`;
  },
};
