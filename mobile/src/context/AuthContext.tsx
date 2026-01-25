import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  RegisterPayload,
  SendOTPPayload,
  VerifyOTPPayload,
} from '../types';
import {
  registerUser,
  sendOTP,
  verifyOTP,
  getCurrentUser,
} from '../services/authApi';

const AUTH_TOKEN_KEY = '@shrota_auth_token';
const AUTH_USER_KEY = '@shrota_auth_user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (payload: RegisterPayload) => Promise<User>;
  sendOTP: (payload: SendOTPPayload) => Promise<void>;
  login: (payload: VerifyOTPPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth data on mount
  useEffect(() => {
    async function loadAuthData() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load auth data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuthData();
  }, []);

  // Check if stored token is still valid
  const checkAuth = useCallback(async (): Promise<boolean> => {
    if (!token) {
      return false;
    }

    try {
      const currentUser = await getCurrentUser(token);
      setUser(currentUser);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
      return true;
    } catch (error) {
      // Token is invalid, clear auth data
      await logout();
      return false;
    }
  }, [token]);

  // Register new user
  const handleRegister = useCallback(async (payload: RegisterPayload): Promise<User> => {
    const newUser = await registerUser(payload);
    return newUser;
  }, []);

  // Send OTP
  const handleSendOTP = useCallback(async (payload: SendOTPPayload): Promise<void> => {
    await sendOTP(payload);
  }, []);

  // Login (verify OTP)
  const handleLogin = useCallback(async (payload: VerifyOTPPayload): Promise<void> => {
    const response = await verifyOTP(payload);

    // Store auth data
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user)),
    ]);

    setToken(response.access_token);
    setUser(response.user);
  }, []);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }

    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    register: handleRegister,
    sendOTP: handleSendOTP,
    login: handleLogin,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
