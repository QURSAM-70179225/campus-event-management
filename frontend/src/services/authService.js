import api from './api';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/login', { email, password });
    return data; // { token, user, message }
  },
  async signup(payload) {
    const { data } = await api.post('/signup', payload);
    return data;
  },
  async me() {
    const { data } = await api.get('/me');
    return data.user;
  },
};
