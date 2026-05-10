import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../api';
import { AuthUser } from '../types';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(payload: LoginPayload): Promise<{ error?: string | null }>;
  register(payload: RegisterPayload): Promise<{ error?: string | null; message?: string | null }>;
  loginWithGoogle(idToken: string): Promise<{ error?: string | null }>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchMe() {
  const response = await api.get<{ user: AuthUser | null }>('/auth/me');
  return response.data.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    try {
      const nextUser = await fetchMe();
      setUser(nextUser);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, []);

  async function login(payload: LoginPayload) {
    try {
      const response = await api.post<{ user: AuthUser }>('/auth/login', payload);
      setUser(response.data.user);
      return {};
    } catch (error: any) {
      return { error: error?.response?.data?.error || 'Nao foi possivel entrar.' };
    }
  }

  async function register(payload: RegisterPayload) {
    try {
      const response = await api.post<{ message?: string | null }>('/auth/register', payload);
      return { message: response.data.message || 'Conta criada. Verifique seu e-mail para concluir.' };
    } catch (error: any) {
      return { error: error?.response?.data?.error || 'Nao foi possivel criar a conta.' };
    }
  }

  async function loginWithGoogle(idToken: string) {
    try {
      const response = await api.post<{ user: AuthUser }>('/auth/google', { idToken });
      setUser(response.data.user);
      return {};
    } catch (error: any) {
      return { error: error?.response?.data?.error || 'Nao foi possivel entrar com Google.' };
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
