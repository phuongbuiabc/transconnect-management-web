import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { session } from '../../../core/api/client';
import { authApi } from '../api/authApi';
import type { User } from '../models/user';
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
    setLoading(true);
    setError(null);
    try {
      const current = await authApi.currentUser();
      setUser(current);
    } catch (failure) {
      setUser(null);
      setError(failure);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    const unsubscribe = session.subscribe(() => {
      if (active) {
        setUser(null);
        setLoading(false);
      }
    });
    if (session.hasTokens())
      authApi
        .currentUser()
        .then((current) => {
          if (active) setUser(current);
        })
        .catch((failure) => {
          if (active) setError(failure);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
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
      try {
        const current = await authApi.currentUser();
        setError(null);
        setUser(current);
      } catch (failure) {
        session.clear();
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
