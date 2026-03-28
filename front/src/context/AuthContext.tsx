import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { decodeToken } from '../lib/utils';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('med_reimburse_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('med_reimburse_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (newToken: string) => {
    const payload = decodeToken(newToken);
    if (payload) {
      const newUser: User = {
        user_id: Number(payload.sub),
        username: payload.email?.split('@')[0] || 'user',
        email: payload.email || '',
        role: payload.role as UserRole,
        account_status: 'ACTIVE',
        last_login: new Date().toISOString(),
      };
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('med_reimburse_token', newToken);
      localStorage.setItem('med_reimburse_user', JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('med_reimburse_token');
    localStorage.removeItem('med_reimburse_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
