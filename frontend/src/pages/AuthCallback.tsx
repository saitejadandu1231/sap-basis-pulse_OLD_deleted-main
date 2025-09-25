import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { handleAuthCallback, completeSignup } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [requiresInfo, setRequiresInfo] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRole, setSelectedRole] = useState('Customer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log('[AuthCallback] Starting handleCallback...');
      const result = await handleAuthCallback();
      console.log('[AuthCallback] Result:', result);
      
      if (result.error) {
        console.log('[AuthCallback] Error:', result.error);
        toast.error(result.error);
        navigate('/', { replace: true });
        return;
      }

      if (result.requiresAdditionalInfo) {
        console.log('[AuthCallback] Requires additional info:', result);
        setRequiresInfo(true);
        setSupabaseUserId(result.supabaseUserId);
        // Pre-fill with Google-provided names
        if (result.firstName) {
          console.log('[AuthCallback] Setting firstName:', result.firstName);
          setFirstName(result.firstName);
        }
        if (result.lastName) {
          console.log('[AuthCallback] Setting lastName:', result.lastName);
          setLastName(result.lastName);
        }
        setLoading(false);
        return;
      }

      if (result.authData) {
        console.log('[AuthCallback] Auth data received, redirecting to dashboard');
        // Sign in successful
  await signIn(result.authData.email, '', result.authData);
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error('[AuthCallback] Exception:', error);
      toast.error('Authentication failed: ' + error.message);
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast.error('Please select an account type');
      return;
    }

    // Validate required password fields
    if (!password) {
      toast.error('Password is required');
      return;
    }
    
    if (!confirmPassword) {
      toast.error('Please confirm your password');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const result = await completeSignup(
        supabaseUserId, 
        selectedRole, 
        firstName.trim() || undefined, 
        lastName.trim() || undefined,
        password,
        confirmPassword
      );
      
      if (!result.success) {
        toast.error(result.error || 'Failed to complete signup');
        return;
      }

      // Sign in successful
  await signIn(result.authData.email, '', result.authData);
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error('Failed to complete signup: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !requiresInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Processing authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiresInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Please provide some additional information to complete your account setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompleteSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder={firstName || "John"}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                  />
                  {firstName && <p className="text-xs text-muted-foreground">From Google account</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder={lastName || "Doe"}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                  {lastName && <p className="text-xs text-muted-foreground">From Google account</p>}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Account Type *</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  className="grid grid-cols-1 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Customer" id="customer" />
                    <Label htmlFor="customer" className="font-normal">
                      Customer - I need SAP BASIS support
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Consultant" id="consultant" />
                    <Label htmlFor="consultant" className="font-normal">
                      Consultant - I provide SAP BASIS services
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Set up your password *
                </Label>
                <p className="text-xs text-muted-foreground">
                  Create a secure password for your account. This allows you to login even if Google SSO is unavailable.
                </p>
                
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default AuthCallback;