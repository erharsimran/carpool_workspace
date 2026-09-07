// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    phone_number?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const currentUser = await api.getMe();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, pass: string) => {
    await api.login(email, pass);
    const currentUser = await api.getMe();
    setUser(currentUser);
  };

  const register = async (payload: {
    username: string;
    email: string;
    password: string;
    phone_number?: string;
  }) => {
    await api.register(payload);
    const currentUser = await api.getMe();
    setUser(currentUser);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('API logout warning:', err);
    } finally {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await api.getMe();
      setUser(updatedUser);
    } catch {
      // Retain state or allow re-auth flow on hard failure
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};