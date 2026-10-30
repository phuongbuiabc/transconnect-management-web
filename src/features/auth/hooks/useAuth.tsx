import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { session } from '../../../core/api/client';
import { authApi } from '../api/authApi';
import type { User } from '../models/user';
import { ApiError } from '../../../core/api/apiError';
interface Auth {
  user: User | null;
  loading: boolean;
  error: unknown;
  signIn: (email: string, password: string, accountGroup?: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  verify: (code: string) => Promise<void>;
  resend: () => Promise<unknown>;
  signOut: () => Promise<void>;
  restore: () => Promise<void>;
}
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(session.hasTokens());
  const [error, setError] = useState<unknown>(null);
  async function restore() {
    const expected = session.generation;
    setLoading(true);
    setError(null);
    try {
      const current = await authApi.currentUser();
      if (session.generation === expected) setUser(current);
    } catch (failure) {
      if (session.generation === expected) {
        setUser(null);
        setError(failure);
      }
    } finally {
      if (session.generation === expected) setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    function loadCurrent() {
      const expected = session.generation;
      setLoading(true);
      setError(null);
      authApi
        .currentUser()
        .then((current) => {
          if (active && session.generation === expected) setUser(current);
        })
        .catch((failure) => {
          if (active && session.generation === expected) setError(failure);
        })
        .finally(() => {
          if (active && session.generation === expected) setLoading(false);
        });
    }
    const unsubscribe = session.subscribe(() => {
      if (active) {
        setUser(null);
        if (session.hasTokens()) loadCurrent();
        else {
          setLoading(false);
          setError(null);
        }
      }
    });
    if (session.hasTokens()) loadCurrent();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  const value: Auth = {
    user,
    loading,
    error,
    restore,
    register: async (email, password, fullName) => {
      await authApi.register(email, password, fullName);
      await restore();
    },
    verify: async (code) => {
      if (user) {
        await authApi.verify(user.email, code);
        await restore();
      }
    },
    resend: async () => {
      if (user) return authApi.resend(user.email);
    },
    signIn: async (email, password, accountGroup) => {
      await authApi.login(email, password, accountGroup);
      const expected = session.generation;
      try {
        const current = await authApi.currentUser();
        session.sync();
        if (session.generation !== expected)
          throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
        setError(null);
        setUser(current);
      } catch (failure) {
        session.sync();
        if (session.generation === expected) session.clear();
        throw failure;
      }
    },
    signOut: async () => {
      setUser(null);
      setError(null);
      await authApi.logout();
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(): Auth {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required');
  return context;
}
