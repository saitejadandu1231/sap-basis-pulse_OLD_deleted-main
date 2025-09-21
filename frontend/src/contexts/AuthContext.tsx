
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  token: string;
  expiresAt: string;
  refreshToken: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  userRole: string | null;
  firstName: string | null;
  lastName: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to decode JWT
const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (error) {
    console.error('Failed to decode JWT', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        // Check if token is expired
        const decoded = decodeJwt(savedToken);
        const expiryTime = decoded?.exp ? decoded.exp * 1000 : 0; // Convert to milliseconds
        
        if (expiryTime > Date.now()) {
          setToken(savedToken);
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setUserRole(userData.role);
          setFirstName(userData.firstName);
          setLastName(userData.lastName);
        } else {
          // Token expired, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing saved user', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiFetch('auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.error || 'Login failed' } };
      }

      const authData: AuthResponse = await response.json();
      
      // Create user object from response
      const userData: User = {
        id: decodeJwt(authData.token).sub || '',
        email: authData.email,
        role: authData.role.toLowerCase(),
        firstName: authData.firstName,
        lastName: authData.lastName
      };

      // First save to localStorage to ensure persistence
      localStorage.setItem('authToken', authData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Then update state
      setToken(authData.token);
      setUserRole(userData.role);
      setFirstName(userData.firstName);
      setLastName(userData.lastName);
      setUser(userData);
      
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'An unexpected error occurred' } };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: string) => {
    try {
      const response = await apiFetch('auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.error || 'Registration failed' } };
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'An unexpected error occurred' } };
    }
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    setUserRole(null);
    setFirstName(null);
    setLastName(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    loading,
    userRole,
    firstName,
    lastName,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
