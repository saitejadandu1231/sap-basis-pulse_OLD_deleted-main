import { createClient } from '@supabase/supabase-js';
import { apiFetch } from '@/lib/api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const useSupabaseAuth = () => {
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      return { data, error };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signInWithApple = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      return { data, error };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const handleAuthCallback = async () => {
    try {
      console.log('[useSupabaseAuth] Getting session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('[useSupabaseAuth] No session or error:', { error, hasSession: !!session });
        return { error: error?.message || 'No session found' };
      }

      console.log('[useSupabaseAuth] Session found, calling backend...');
      // Send session to your backend
      const response = await apiFetch('auth/supabase-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: session.access_token,
          provider: session.user.app_metadata.provider
        })
      });

      const result = await response.json();
      console.log('[useSupabaseAuth] Backend response:', result);
      
      if (result.requiresAdditionalInfo) {
        console.log('[useSupabaseAuth] Returning requiresAdditionalInfo:', {
          supabaseUserId: result.supabaseUserId,
          firstName: result.firstName,
          lastName: result.lastName
        });
        return { 
          requiresAdditionalInfo: true, 
          supabaseUserId: result.supabaseUserId,
          firstName: result.firstName,
          lastName: result.lastName
        };
      }

      console.log('[useSupabaseAuth] Returning authData');
      return { authData: result };
    } catch (error: any) {
      console.error('[useSupabaseAuth] Exception:', error);
      return { error: error.message || 'Authentication failed' };
    }
  };

  const completeSignup = async (supabaseUserId: string, role: string, firstName?: string, lastName?: string, password?: string, confirmPassword?: string) => {
    try {
      const response = await apiFetch('auth/complete-supabase-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUserId,
          role,
          firstName,
          lastName,
          password,
          confirmPassword
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete signup');
      }

      return { success: true, authData: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    signInWithGoogle,
    signInWithApple,
    handleAuthCallback,
    completeSignup
  };
};