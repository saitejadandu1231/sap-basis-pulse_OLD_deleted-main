
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  hourlyRate?: number;
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
  signIn: (email: string, password: string, oauthData?: AuthResponse) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (firstName: string, lastName: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>({
  user: null,
  token: null,
  loading: true,
  userRole: null,
  firstName: null,
  lastName: null,
  signIn: async () => ({ error: new Error('AuthProvider not initialized') }),
  signUp: async () => ({ error: new Error('AuthProvider not initialized') }),
  signOut: async () => {},
  refreshUser: async () => {},
  updateUser: async () => ({ error: new Error('AuthProvider not initialized') }),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Loading guard hook to prevent using auth before initialization
export const useAuthLoading = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context.loading;
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

  const signIn = async (email: string, password: string, oauthData?: AuthResponse) => {
    try {
      // If OAuth data is provided, use it directly without API call
      if (oauthData) {
        // Fetch full user data including hourlyRate
        const userResponse = await apiFetch(`users/${decodeJwt(oauthData.token).sub}`, {
          headers: {
            'Authorization': `Bearer ${oauthData.token}`,
          },
        });
        
        let userData: User;
        if (userResponse.ok) {
          const fullUserData = await userResponse.json();
          userData = {
            id: fullUserData.id,
            email: fullUserData.email,
            role: fullUserData.role.toLowerCase(),
            firstName: fullUserData.firstName,
            lastName: fullUserData.lastName,
            hourlyRate: fullUserData.hourlyRate
          };
        } else {
          // Fallback to basic user data from OAuth response
          userData = {
            id: decodeJwt(oauthData.token).sub || '',
            email: oauthData.email,
            role: oauthData.role.toLowerCase(),
            firstName: oauthData.firstName,
            lastName: oauthData.lastName
          };
        }

        // First save to localStorage to ensure persistence
        localStorage.setItem('authToken', oauthData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Then update state
        setToken(oauthData.token);
        setUserRole(userData.role);
        setFirstName(userData.firstName);
        setLastName(userData.lastName);
        setUser(userData);
        
        return { error: null };
      }

      // Regular email/password login
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
      
      // Fetch full user data including hourlyRate
      const userResponse = await apiFetch(`users/${decodeJwt(authData.token).sub}`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`,
        },
      });
      
      let userData: User;
      if (userResponse.ok) {
        const fullUserData = await userResponse.json();
        userData = {
          id: fullUserData.id,
          email: fullUserData.email,
          role: fullUserData.role.toLowerCase(),
          firstName: fullUserData.firstName,
          lastName: fullUserData.lastName,
          hourlyRate: fullUserData.hourlyRate
        };
      } else {
        // Fallback to basic user data from auth response
        userData = {
          id: decodeJwt(authData.token).sub || '',
          email: authData.email,
          role: authData.role.toLowerCase(),
          firstName: authData.firstName,
          lastName: authData.lastName
        };
      }

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

  const refreshUser = async () => {
    if (!token || !user) return;

    try {
      const userResponse = await apiFetch(`users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (userResponse.ok) {
        const fullUserData = await userResponse.json();
        const updatedUserData: User = {
          id: fullUserData.id,
          email: fullUserData.email,
          role: fullUserData.role.toLowerCase(),
          firstName: fullUserData.firstName,
          lastName: fullUserData.lastName,
          hourlyRate: fullUserData.hourlyRate
        };

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUserData));

        // Update state
        setUser(updatedUserData);
        setUserRole(updatedUserData.role);
        setFirstName(updatedUserData.firstName);
        setLastName(updatedUserData.lastName);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const updateUser = async (firstName: string, lastName: string) => {
    if (!token || !user) return { error: { message: 'Not authenticated' } };

    try {
      const response = await apiFetch(`users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          role: user.role, // Keep the existing role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.error || 'Failed to update profile' } };
      }

      // Refresh user data after successful update
      await refreshUser();
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'An unexpected error occurred' } };
    }
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
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
