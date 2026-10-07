import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message || 'Something went wrong. Please try again.';
    const status = err.response?.status;
    if (status === 401 && localStorage.getItem('fh_token')) {
      // Session expired — clear and let the app redirect naturally via AuthContext state.
      localStorage.removeItem('fh_token');
      localStorage.removeItem('fh_user');
    }
    return Promise.reject({ status, message, raw: err });
  }
);

export default api;
