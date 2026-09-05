import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../lib/types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isHRManager: boolean;
  isPayrollUser: boolean;
  isPayrollManager: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('peoplepay_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCurrentUser() {
      const storedToken = localStorage.getItem('peoplepay_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await api.get<User>('/auth/me');
        setUser(profile);
      } catch (err) {
        console.error('Failed to load authenticated profile', err);
        localStorage.removeItem('peoplepay_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/login', {
      email,
      password: pass,
    });
    localStorage.setItem('peoplepay_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/register', data);
    localStorage.setItem('peoplepay_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('peoplepay_token');
      setToken(null);
      setUser(null);
    }
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isHRManager = user?.role === 'HR_MANAGER' || isAdmin;
  const isPayrollUser = user?.role === 'HR_PAYROLL_USER' || user?.role === 'HR_PAYROLL_MANAGER' || isAdmin;
  const isPayrollManager = user?.role === 'HR_PAYROLL_MANAGER' || isAdmin;
  const isEmployee = user?.role === 'EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        isAdmin,
        isHRManager,
        isPayrollUser,
        isPayrollManager,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
