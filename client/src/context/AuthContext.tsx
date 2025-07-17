import React, { useState, useEffect } from "react";
import { AuthContext } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import { getUserProfile } from '@/lib/userSettingsApi';
import { fetchNotifications, Notification } from '@/api';
import { useConnection } from "@/hooks/useConnection";

// This should match the one in api/index.ts
interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;

}



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start in a loading state
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isOnline, checkConnection } = useConnection();

  // Initialize auth state from localStorage, and validate with backend
  useEffect(() => {
    const initAuth = async () => {
      const t = localStorage.getItem("token");
      
      if (t) {
        try {
          // Token found, validate it by fetching the user profile
          const profile = await getUserProfile(t);
          if (profile) {
            setToken(t);
            setUser(profile); // Use fresh user data from API
            localStorage.setItem('user', JSON.stringify(profile)); // Update localStorage
            // Fetch initial notifications
            fetchNotifications().then(setNotifications).catch(console.error);
          } else {
            // Token is invalid or user not found
            logout();
          }
        } catch (e) {
          console.error('Session validation failed', e);
          logout(); // Logout on any error during validation
        }
      }
      
      // Auth check is complete
      setLoading(false);
    };

    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    // Check connection first
    const isBackendAvailable = await checkConnection();
    if (!isBackendAvailable) {
      setLoading(false);
      return { success: false, message: 'Unable to connect to the server. Please check your internet connection.' };
    }
    
    try {
      const response = await apiFetch<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
      }
      
      // Update state
      setToken(response.token);
      setUser(response.user);
      
      // Persist to localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Fetch initial notifications
      fetchNotifications().then(setNotifications).catch(console.error);
      
      return { success: true };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid email or password';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    // Check connection first
    const isBackendAvailable = await checkConnection();
    if (!isBackendAvailable) {
      setLoading(false);
      return { success: false, message: 'Unable to connect to the server. Please check your internet connection.' };
    }
    
    try {
      const response = await apiFetch<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      
      if (!response.token || !response.user) {
        throw new Error('Registration failed. Please try again.');
      }
      
      // Update state
      setToken(response.token);
      setUser(response.user);
      
      // Persist to localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Fetch initial notifications
      fetchNotifications().then(setNotifications).catch(console.error);
      
      return { success: true };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };
  
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!token, 
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      loading,
      error,
      clearError,
      notifications,
      setNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
};

