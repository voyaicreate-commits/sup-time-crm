import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Доски
export const boardsApi = {
  getAll: (params?: any) => api.get('/boards', { params }),
  getById: (id: string) => api.get(`/boards/${id}`),
  create: (data: any) => api.post('/boards', data),
  update: (id: string, data: any) => api.put(`/boards/${id}`, data),
  delete: (id: string) => api.delete(`/boards/${id}`),
  getAvailable: (date: string, type?: string) => 
    api.get(`/boards/available/${date}`, { params: { booking_type: type } }),
};

// Клиенты
export const clientsApi = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  getHistory: (id: string) => api.get(`/clients/${id}/history`),
  searchByPhone: (phone: string) => api.get(`/clients/search/phone/${phone}`),
};

// Бронирования
export const bookingsApi = {
  getAll: (params?: any) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  update: (id: string, data: any) => api.put(`/bookings/${id}`, data),
  delete: (id: string) => api.delete(`/bookings/${id}`),
  getCalendar: (date: string) => api.get(`/bookings/calendar/${date}`),
  getCalendarPeriod: (start: string, end: string) => 
    api.get(`/bookings/calendar/period/${start}/${end}`),
};

// Продажи
export const salesApi = {
  getAll: (params?: any) => api.get('/sales', { params }),
  getById: (id: string) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
  delete: (id: string) => api.delete(`/sales/${id}`),
  getStats: (params?: any) => api.get('/sales/stats/summary', { params }),
};

// Уведомления
export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  create: (data: any) => api.post('/notifications', data),
  getByBooking: (bookingId: string) => api.get(`/notifications/booking/${bookingId}`),
};

// Статистика
export const statisticsApi = {
  getDashboard: () => api.get('/statistics/dashboard'),
  getRevenue: (params?: any) => api.get('/statistics/revenue', { params }),
  getUtilization: (params?: any) => api.get('/statistics/utilization', { params }),
  getPopular: (params?: any) => api.get('/statistics/popular', { params }),
  getTopClients: (params?: any) => api.get('/statistics/top-clients', { params }),
  getWeeklyPattern: (params?: any) => api.get('/statistics/weekly-pattern', { params }),
};

// Настройки
export const settingsApi = {
  getAll: () => api.get('/settings'),
  get: (key: string) => api.get(`/settings/${key}`),
  update: (data: any) => api.put('/settings', data),
  updateOne: (key: string, value: string) => api.put(`/settings/${key}`, { value }),
};

export default api;
