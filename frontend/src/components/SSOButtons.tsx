import React from 'react';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSSOConfig } from '@/hooks/useSSOConfig';
import { toast } from 'sonner';

interface SSOButtonsProps {
  onSuccess?: (data: any) => void;
  onRequiresInfo?: (supabaseUserId: string) => void;
  disabled?: boolean;
}

const SSOButtons: React.FC<SSOButtonsProps> = ({ onSuccess, onRequiresInfo, disabled = false }) => {
  const { data: ssoConfig, isLoading } = useSSOConfig();
  const { signInWithGoogle, signInWithApple } = useSupabaseAuth();

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error('Google sign-in failed: ' + error.message);
      }
    } catch (error: any) {
      toast.error('Google sign-in failed: ' + error.message);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const { error } = await signInWithApple();
      if (error) {
        toast.error('Apple sign-in failed: ' + error.message);
      }
    } catch (error: any) {
      toast.error('Apple sign-in failed: ' + error.message);
    }
  };

  // Don't render if loading
  if (isLoading) {
    return null;
  }

  // For testing: render buttons if environment variables are configured, even if SSO config is not enabled
  const hasSupabaseConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Don't render if SSO is not enabled AND no environment config (production safety)
  if (!ssoConfig?.supabaseEnabled && !hasSupabaseConfig) {
    return null;
  }

  // Don't render if no providers are enabled (but allow environment override for testing)
  if (!ssoConfig?.googleEnabled && !ssoConfig?.appleEnabled && ssoConfig?.supabaseEnabled === false) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {ssoConfig.googleEnabled && (
          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={disabled}
            className="w-full"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        )}
        
        {ssoConfig.appleEnabled && (
          <Button
            variant="outline"
            onClick={handleAppleSignIn}
            disabled={disabled}
            className="w-full"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/>
              <path d="M15.53 3.83c.893-1.09 1.477-2.602 1.306-4.11-1.265.056-2.847.875-3.758 1.944-.806.942-1.526 2.486-1.34 3.938 1.421.106 2.88-.717 3.792-1.772z"/>
            </svg>
            Apple
          </Button>
        )}
      </div>
    </div>
  );
};

export default SSOButtons;