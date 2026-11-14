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
import { signInWithEmailPassword } from '../lib/firebase';
import {
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
} from '../lib/session';
import { getMe, verifyFirebaseToken } from '../api/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isBootstrapping: boolean;
  loginWithFirebase: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() =>
    getToken() ? getStoredUser() : null,
  );
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(
    () => Boolean(getToken()),
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsBootstrapping(false);
      return;
    }

    let active = true;
    getMe()
      .then((response) => {
        if (!active) return;
        const currentUser = response.data.user;
        if (currentUser.role !== 'admin') {
          throw new Error('This account does not have admin access.');
        }
        saveSession(token, currentUser);
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

  const loginWithFirebase = useCallback(
    async (email: string, password: string) => {
      const idToken = await signInWithEmailPassword(email.trim(), password);
      const response = await verifyFirebaseToken(idToken);
      const { token, user: currentUser } = response.data;

      if (currentUser.role !== 'admin') {
        throw new Error('This account does not have admin access.');
      }

      queryClient.clear();
      saveSession(token, currentUser);
      setUser(currentUser);
    },
    [queryClient],
  );

  const loginWithToken = useCallback(async (token: string) => {
    const trimmed = token.trim();
    if (!trimmed) {
      throw new Error('Paste an admin access token to continue.');
    }

    const response = await getMe(trimmed);
    const currentUser = response.data.user;

    if (currentUser.role !== 'admin') {
      throw new Error('This account does not have admin access.');
    }

    queryClient.clear();
    saveSession(trimmed, currentUser);
    setUser(currentUser);
  }, [queryClient]);

  const logout = useCallback(() => {
    clearSession();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isBootstrapping,
      loginWithFirebase,
      loginWithToken,
      logout,
    }),
    [user, isBootstrapping, loginWithFirebase, loginWithToken, logout],
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
