import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check session on mount
  useEffect(() => {
    fetch('/auth/status', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { authenticated: boolean; email?: string }) => {
        setIsAuthenticated(data.authenticated);
        setEmail(data.email ?? null);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setEmail(email.trim().toLowerCase());
        return true;
      }

      const data = await res.json().catch(() => ({ error: 'Login failed' }));
      setError(data.error ?? 'Login failed');
      return false;
    } catch {
      setError('Unable to connect to server');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setIsAuthenticated(false);
    setEmail(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, email, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
