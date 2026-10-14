import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { request, session, login, logout, type User } from './lib/api';
interface Auth { user: User | null; loading: boolean; error: unknown; signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void>; restore: () => Promise<void> }
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(session.hasTokens());
  const [error, setError] = useState<unknown>(null);
  async function restore() {
    setLoading(true); setError(null);
    try { const current = await request<User>('/auth/me'); setUser(current); }
    catch (failure) { setUser(null); setError(failure); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    const unsubscribe = session.subscribe(() => { if (active) { setUser(null); setLoading(false); } });
    if (session.hasTokens()) request<User>('/auth/me').then(current => { if (active) setUser(current); }).catch(failure => { if (active) setError(failure); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; unsubscribe(); };
  }, []);
  const value: Auth = { user, loading, error, restore,
    signIn: async (email, password) => { await login(email, password); try { const current = await request<User>('/auth/me'); setError(null); setUser(current); } catch (failure) { session.clear(); throw failure; } },
    signOut: async () => { setUser(null); setError(null); await logout(); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(): Auth { const context = useContext(AuthContext); if (!context) throw new Error('AuthProvider is required'); return context; }
