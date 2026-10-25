import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AUTH_MODE,
  fetchCurrentUser,
  staticLogin,
  demoLogin,
  startOktaLogin,
  logout as authLogout,
} from '@/lib/auth';

const AuthContext = createContext(null);
const REVALIDATE_MS = 5 * 60 * 1000;

// status: loading | anonymous | authorized | denied | unavailable
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, message: '' });

  const refresh = useCallback(async () => {
    try {
      const me = await fetchCurrentUser();
      setState({ status: 'authorized', user: me, message: '' });
      return me;
    } catch (e) {
      const status = e.kind === 'forbidden' ? 'denied' : e.kind === 'unavailable' ? 'unavailable' : 'anonymous';
      setState({ status, user: null, message: status === 'anonymous' ? '' : e.message });
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Re-check the role periodically so deactivation / role changes apply without a new login.
  useEffect(() => {
    if (state.status !== 'authorized') return undefined;
    const id = setInterval(refresh, REVALIDATE_MS);
    return () => clearInterval(id);
  }, [state.status, refresh]);

  // Any API 401 (expired session) drops back to the login page.
  useEffect(() => {
    const onExpired = () => setState({ status: 'anonymous', user: null, message: 'Your session has expired. Please sign in again.' });
    window.addEventListener('kwe:unauthorized', onExpired);
    return () => window.removeEventListener('kwe:unauthorized', onExpired);
  }, []);

  const signInWithPassword = useCallback(async (email, password) => {
    await (AUTH_MODE === 'static' ? staticLogin(email, password) : demoLogin(email, password));
    return refresh();
  }, [refresh]);

  const signInWithOkta = useCallback((originalUri) => startOktaLogin(originalUri), []);

  const signOut = useCallback(async () => {
    setState({ status: 'anonymous', user: null, message: '' });
    await authLogout();
  }, []);

  const value = {
    ...state,
    loading: state.status === 'loading',
    isAuthenticated: state.status === 'authorized',
    canWrite: state.user?.role === 'READ_WRITE',
    authMode: AUTH_MODE,
    refresh,
    signInWithPassword,
    signInWithOkta,
    signOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
