import axios from 'axios';

const TOKEN_KEY = 'uol_events_token';

/** localStorage wrapped so a blocked/private-mode storage never crashes the app. */
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or revoked token logs the user out everywhere in the app.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

/** Turns any Axios error into a sentence the user can act on. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (!error.response) {
    if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
    return 'Cannot reach the server. Make sure the backend is running on port 5000.';
  }
  return error.response.data?.error || fallback;
}

/** Field-level validation messages returned by the API ({ field: message }). */
export function getFieldErrors(error) {
  return error?.response?.data?.details || {};
}

export default api;
