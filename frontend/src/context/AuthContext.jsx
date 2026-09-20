import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('fh_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fh_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('fh_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('fh_token');
        localStorage.removeItem('fh_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((token, user) => {
    localStorage.setItem('fh_token', token);
    localStorage.setItem('fh_user', JSON.stringify(user));
    setUser(user);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  }, [persist]);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    persist(res.data.token, res.data.user);
    return res.data.user;
  }, [persist]);

  const demoLogin = useCallback(async (persona) => {
    const res = await api.post('/auth/demo-login', { persona });
    persist(res.data.token, res.data.user);
    return res.data.user;
  }, [persist]);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me');
    localStorage.setItem('fh_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fh_token');
    localStorage.removeItem('fh_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, demoLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
