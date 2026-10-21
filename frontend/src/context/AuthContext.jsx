import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { tokenStore } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(Boolean(tokenStore.get()));

  // Restore the session from a saved token on first load.
  useEffect(() => {
    if (!tokenStore.get()) return;
    let active = true;
    authService
      .me()
      .then((u) => active && setUser(u))
      .catch(() => {
        tokenStore.clear();
        if (active) setUser(null);
      })
      .finally(() => active && setInitializing(false));
    return () => {
      active = false;
    };
  }, []);

  // The API layer fires this when the server rejects the token (expired/revoked).
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    tokenStore.set(data.token);
    setUser(data.user);
    return data;
  }, []);

  const signup = useCallback(async (payload) => {
    const data = await authService.signup(payload);
    tokenStore.set(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, isAdmin: user?.role === 'admin', login, signup, logout }),
    [user, initializing, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
