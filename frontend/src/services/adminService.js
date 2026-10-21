import api from './api';

export const adminService = {
  async stats() {
    const { data } = await api.get('/admin/stats');
    return data;
  },
  async registrations(eventId) {
    const { data } = await api.get('/admin/registrations', { params: eventId ? { event_id: eventId } : {} });
    return data; // { event, registrations, count }
  },
};
