import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const confirmEmail = async () => {
      try {
        const response = await apiFetch('auth/confirm-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully! You can now login to your account.');
          toast({
            title: "Email Verified",
            description: "Your account has been activated successfully.",
          });
        } else {
          setStatus('error');
          setMessage(data.error || 'Email verification failed. The token may be expired or invalid.');
          toast({
            title: "Verification Failed",
            description: data.error || "Please try again or request a new verification email.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
        toast({
          title: "Network Error",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    };

    confirmEmail();
  }, [token, toast]);

  const handleReturnToLogin = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Theme Toggle in top right corner */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Logo and branding */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">Y</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Yuktor
              </span>
            </div>

            <div className="mx-auto mb-4">
              {status === 'loading' && (
                <div className="relative">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                </div>
              )}
              {status === 'success' && (
                <div className="relative">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="absolute -inset-2 bg-green-500/20 rounded-full animate-pulse"></div>
                </div>
              )}
              {status === 'error' && (
                <div className="relative">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">
                {status === 'loading' && 'Verifying Email...'}
                {status === 'success' && 'Email Verified!'}
                {status === 'error' && 'Verification Failed'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {status === 'loading' && 'Please wait while we verify your email address.'}
                {status === 'success' && 'Your email has been successfully verified.'}
                {status === 'error' && 'We encountered an issue verifying your email.'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-0">
            <div className="text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {message}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {status === 'success' && (
                <Button 
                  onClick={handleReturnToLogin} 
                  className="w-full h-11 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground font-medium transition-all duration-200"
                >
                  Continue to Login
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleGoHome} 
                className="w-full h-11 border-2 hover:bg-secondary/50 transition-all duration-200"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </div>

            {/* Footer text */}
            <div className="text-center pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                SAP BASIS Support Platform
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfirmEmail;