import api from './api';

/** Removes empty values so URLs stay clean (e.g. no `category=`). */
const clean = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const eventService = {
  async list(params = {}) {
    const { data } = await api.get('/events', { params: clean(params) });
    return data.events;
  },
  async get(id) {
    const { data } = await api.get(`/events/${id}`);
    return data; // { event, registration, is_registered }
  },
  async create(payload) {
    const { data } = await api.post('/events', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/events/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/events/${id}`);
    return data;
  },
  async publicStats() {
    const { data } = await api.get('/stats');
    return data;
  },
};
