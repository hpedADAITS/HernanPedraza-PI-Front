import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthState, UserRole } from '../types';

interface AuthContextType extends AuthState {
  login: (role: UserRole, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    username: null,
  });

  const login = (role: UserRole, username: string) => {
    setAuth({
      isAuthenticated: true,
      role,
      username,
    });
    localStorage.setItem('auth', JSON.stringify({ role, username }));
  };

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      role: null,
      username: null,
    });
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
