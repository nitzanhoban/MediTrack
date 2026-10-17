import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { setAccessToken, setOnUnauthorized, refreshAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    setOnUnauthorized(clearSession);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    refreshAccessToken()
      .then(() => authApi.me())
      .then((data) => {
        if (!cancelled) {
          setUser(data.user);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  const register = useCallback(async (username, password, role) => {
    await authApi.register(username, password, role);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = { user, status, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
