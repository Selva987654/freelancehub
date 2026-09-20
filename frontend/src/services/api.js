import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

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
