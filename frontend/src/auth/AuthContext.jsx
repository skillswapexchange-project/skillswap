import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, authApi } from '../api/client.js';

const TOKEN_KEY = 'skillswap.accessToken';
const AuthContext = createContext(null);

function readStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(readStoredToken()));
  const [sessionError, setSessionError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setUser(null);
      setSessionError('');
      return undefined;
    }

    let active = true;
    setIsLoading(true);
    setSessionError('');
    authApi
      .me(token)
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          window.localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          return;
        }
        setSessionError(error.message || 'Could not restore your session.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, retryKey]);

  const saveSession = useCallback((session) => {
    window.localStorage.setItem(TOKEN_KEY, session.access_token);
    setToken(session.access_token);
    setUser(session.user);
    setSessionError('');
  }, []);

  const login = useCallback(
    async (credentials) => saveSession(await authApi.login(credentials)),
    [saveSession],
  );

  const register = useCallback(
    async (details) => saveSession(await authApi.register(details)),
    [saveSession],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setSessionError('');
  }, []);

  const updateUser = useCallback((updatedUser) => setUser(updatedUser), []);
  const retrySession = useCallback(() => setRetryKey((current) => current + 1), []);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      sessionError,
      login,
      register,
      logout,
      updateUser,
      retrySession,
    }),
    [
      token,
      user,
      isLoading,
      sessionError,
      login,
      register,
      logout,
      updateUser,
      retrySession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return value;
}
