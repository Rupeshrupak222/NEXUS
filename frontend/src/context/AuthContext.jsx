import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.success && res.data) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error('Authentication failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API call failed:', e);
    } finally {
      api.setToken(null);
      setUser(null);
    }
  };

  // Helper for effortless review & testing: login instantly with pre-seeded credentials
  const demoLogin = async (role = 'ADMIN') => {
    if (role === 'ADMIN') {
      return login('admin@academy.io', 'AdminPassword@2026');
    } else if (role === 'STUDENT') {
      // Rahul Sharma
      return login('rahul@example.com', 'StudentPass@2026');
    } else if (role === 'STUDENT_PRIYA') {
      // Priya Patel (100% completion & Certificate)
      return login('priya@example.com', 'StudentPass@2026');
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        demoLogin,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
