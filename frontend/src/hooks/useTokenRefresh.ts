import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';
import { apiFetch } from '@/lib/api';

/**
 * Hook to refresh authentication token before long-running operations
 * This ensures the token doesn't expire during payment processing or other delays
 */
export const useTokenRefresh = () => {
  const { token, user } = useAuth();

  // Check if token is expiring soon (within 5 minutes)
  const isTokenExpiringPrematurely = useCallback((): boolean => {
    if (!token) return false;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(window.atob(base64));
      
      if (!decoded.exp) return false;

      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      const timeUntilExpiry = expiryTime - Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // Return true if token expires within 5 minutes
      return timeUntilExpiry < fiveMinutes;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return false;
    }
  }, [token]);

  // Refresh user data from server (this validates the token is still valid)
  const refreshTokenValidity = useCallback(async (): Promise<boolean> => {
    if (!token || !user) return false;

    try {
      const response = await apiFetch(`users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // If endpoint returns 401, token is invalid/expired
      if (response.status === 401) {
        console.warn('Token is invalid or expired');
        return false;
      }

      if (!response.ok) {
        console.warn('Token refresh check failed with status:', response.status);
        return false;
      }

      console.log('Token validated successfully');
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }, [token, user]);

  // Check token status and log details
  const logTokenStatus = useCallback((): void => {
    if (!token) {
      console.warn('[Token Status] No token found');
      return;
    }

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(window.atob(base64));
      
      const expiryTime = decoded.exp * 1000;
      const timeUntilExpiry = Math.round((expiryTime - Date.now()) / 1000 / 60); // in minutes

      console.log('[Token Status]', {
        userId: decoded.sub,
        expiresInMinutes: timeUntilExpiry,
        isExpiringSoon: timeUntilExpiry < 5,
        expiresAt: new Date(expiryTime).toLocaleString(),
      });
    } catch (error) {
      console.error('[Token Status] Failed to decode token:', error);
    }
  }, [token]);

  return {
    isTokenExpiringPrematurely,
    refreshTokenValidity,
    logTokenStatus,
  };
};
