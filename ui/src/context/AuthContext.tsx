import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Admin, LoginRequest, LoginResponse } from '../types';
import { login as apiLogin, getCurrentAdmin } from '../api';

interface AuthContextType {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'shrota_admin_token';
const ADMIN_KEY = 'shrota_admin_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const stored = localStorage.getItem(ADMIN_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const adminData = await getCurrentAdmin(token);
          setAdmin(adminData);
          localStorage.setItem(ADMIN_KEY, JSON.stringify(adminData));
        } catch {
          // Token is invalid, clear auth state
          setToken(null);
          setAdmin(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(ADMIN_KEY);
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (credentials: LoginRequest) => {
    const response: LoginResponse = await apiLogin(credentials);
    setToken(response.access_token);
    setAdmin(response.admin);
    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(response.admin));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        admin,
        isAuthenticated: !!token && !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
