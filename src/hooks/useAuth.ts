import { useState, useCallback } from 'react';
import { authAPI, clearToken } from '@/services/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role = 'ATTENDEE',
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await authAPI.register(
          email,
          password,
          displayName,
          role,
        );
        setUser(result.user);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Registration failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.login(email, password);
      setUser(result.user);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    void authAPI.logout().catch(() => {
      clearToken();
    });
    setUser(null);
  }, []);

  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get user';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    register,
    login,
    logout,
    getCurrentUser,
    isAuthenticated: !!user,
  };
}
