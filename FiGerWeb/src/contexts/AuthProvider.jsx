import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './authContext.js';
import {
  SESSION_EXPIRED_EVENT,
  apiFetch,
  clearSession,
  readApiError,
  readSession,
  saveSession,
} from '../utils/api.js';

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(() => readSession()?.user ?? null);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      queryClient.clear();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [queryClient]);

  useEffect(() => {
    const session = readSession();
    if (!session?.token) return;

    let ignore = false;

    apiFetch('/api/auth/me')
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            clearSession();
            setUser(null);
          }
          return;
        }

        const nextUser = await response.json();
        if (!ignore) {
          saveSession({ token: session.token, user: nextUser });
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (!ignore) {
          clearSession();
          setUser(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const authenticate = useCallback(
    async (path, body, fallbackMessage) => {
      const response = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, fallbackMessage));
      }

      const { token, usuario, user: userFromApi } = await response.json();
      const nextUser = usuario ?? userFromApi ?? null;

      saveSession({ token, user: nextUser });
      queryClient.clear();
      setUser(nextUser);
      return nextUser;
    },
    [queryClient],
  );

  const login = useCallback(
    (email, senha) =>
      authenticate('/api/auth/login', { email, senha }, 'Não foi possível entrar.'),
    [authenticate],
  );

  const register = useCallback(
    (dados) =>
      authenticate('/api/auth/register', dados, 'Não foi possível criar a conta.'),
    [authenticate],
  );

  const logout = useCallback(() => {
    clearSession();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const updateUser = useCallback((nextUser) => {
    const session = readSession();
    saveSession({ token: session?.token, user: nextUser });
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, register, logout, updateUser }),
    [user, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
