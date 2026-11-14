import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, setUnauthorizedHandler } from '../api/client.js';
import { clearToken, getToken, setToken } from './tokenStorage.js';

const AuthContext = createContext(null);

// status: 'loading'       a stored token is being checked with /api/auth/me
//         'anonymous'     nobody is logged in (loggedOut: true after the logout button)
//         'authenticated' user is set: { id, name, email, role, specialistType?, childId? }
//         'error'         the stored token could not be checked (backend unreachable)
export function AuthProvider({ children }) {
  const [state, setState] = useState(() => ({
    status: getToken() ? 'loading' : 'anonymous',
    user: null,
  }));

  // loggedOut tells the guards that the user chose to log out, so the login
  // page does not send the next person back to the page that was open.
  const logout = useCallback(() => {
    clearToken();
    setState({ status: 'anonymous', user: null, loggedOut: true });
  }, []);

  // An expired or invalid token: back to login, then return to the same page.
  const endSession = useCallback(() => {
    clearToken();
    setState({ status: 'anonymous', user: null });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(endSession);
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  // Restore the session after a page reload (FR-M1-04: the role always comes
  // from the account on the server, never from what the client stored).
  useEffect(() => {
    if (state.status !== 'loading') return undefined;

    const controller = new AbortController();
    apiFetch('/api/auth/me', { signal: controller.signal })
      .then(({ user }) => setState({ status: 'authenticated', user }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        // A 401 already called endSession() through the unauthorized handler.
        if (err.status !== 401) {
          setState({ status: 'error', user: null });
        }
      });

    return () => controller.abort();
  }, [state.status]);

  const login = useCallback(async (email, password) => {
    const { token, user } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    setToken(token);
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const retry = useCallback(() => {
    setState({ status: getToken() ? 'loading' : 'anonymous', user: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout, retry }),
    [state, login, logout, retry]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** { status, user, login(email, password), logout(), retry() } */
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return value;
}

// Where each role lands after login (FR-M1-03).
export function homePathFor(user) {
  return user?.role === 'child' ? '/my-tasks' : '/children';
}
