import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  clearSession,
  encodeBasicAuth,
  getBasicAuth,
  getStoredUser,
  saveSession,
} from '../lib/session';
import { getMe } from '../api/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isBootstrapping: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() =>
    getBasicAuth() ? getStoredUser() : null,
  );
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(() =>
    Boolean(getBasicAuth()),
  );

  useEffect(() => {
    const basicAuth = getBasicAuth();
    if (!basicAuth) {
      setIsBootstrapping(false);
      return;
    }

    let active = true;
    getMe(`Basic ${basicAuth}`)
      .then((response) => {
        if (!active) return;
        const currentUser = response.data.user;
        if (currentUser.role !== 'admin') {
          throw new Error('This account does not have admin access.');
        }
        saveSession(basicAuth, currentUser);
        setUser(currentUser);
      })
      .catch(() => {
        if (!active) return;
        clearSession();
        queryClient.clear();
        setUser(null);
      })
      .finally(() => {
        if (active) setIsBootstrapping(false);
      });

    return () => {
      active = false;
    };
  }, [queryClient]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      queryClient.clear();
      setUser(null);
    };
    window.addEventListener('sp:unauthorized', handleUnauthorized);
    return () =>
      window.removeEventListener('sp:unauthorized', handleUnauthorized);
  }, [queryClient]);

  const loginWithCredentials = useCallback(
    async (email: string, password: string) => {
      const basicAuth = encodeBasicAuth(email.trim(), password);
      const response = await getMe(`Basic ${basicAuth}`);
      const currentUser = response.data.user;

      if (currentUser.role !== 'admin') {
        throw new Error('This account does not have admin access.');
      }

      queryClient.clear();
      saveSession(basicAuth, currentUser);
      setUser(currentUser);
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    clearSession();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isBootstrapping,
      loginWithCredentials,
      logout,
    }),
    [user, isBootstrapping, loginWithCredentials, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
