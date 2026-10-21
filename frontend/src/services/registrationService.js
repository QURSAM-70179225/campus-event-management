import api from './api';

export const registrationService = {
  async register(eventId) {
    const { data } = await api.post('/register', { event_id: eventId });
    return data; // { message, registration, event }
  },
  async mine() {
    const { data } = await api.get('/my-registrations');
    return data.registrations;
  },
  async cancel(registrationId) {
    const { data } = await api.delete(`/registrations/${registrationId}`);
    return data; // { message, event }
  },
};
