
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  AlertCircle, 
  ArrowLeft, 
  Shield, 
  Mail, 
  Lock, 
  User, 
  Users, 
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Server,
  Building2
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import SSOButtons from "@/components/SSOButtons";
import { Checkbox } from "@/components/ui/checkbox";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();
  
  // Get the redirect path from location state if available
  const from = (location.state as { from?: string })?.from || '/dashboard';
  // domain validation removed; we call backend register API directly
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedRole, setSelectedRole] = useState("customer");
  const [allowConsultantSignup, setAllowConsultantSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Fetch consultant registration status
  useEffect(() => {
    const fetchConsultantRegistrationStatus = async () => {
      try {
        const response = await apiFetch('auth/consultant-registration-status');
        const data = await response.json();
        setAllowConsultantSignup(data.isEnabled || false);
      } catch (error) {
        console.error('Error fetching consultant registration status:', error);
        // Default to false if there's an error
        setAllowConsultantSignup(false);
      }
    };

    fetchConsultantRegistrationStatus();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully"
      });
      
      // Navigate with replace to avoid history stack issues
      navigate(from, { replace: true });
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Missing Information",
        description: "First name and last name are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Call backend register endpoint directly
      const payload = { 
        email, 
        password, 
        firstName, 
        lastName, 
        role: selectedRole
      };
      const res = await apiFetch('auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await res.json();
      const error = res.ok ? null : { message: result?.error ?? 'Registration failed' };
      
      if (error) {
        if (error.message?.includes('already')) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: error.message || "Failed to create account",
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account before signing in."
      });
      
      // Clear form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setSelectedRole("customer");
      
    } catch (error: any) {
      toast({
        title: "Sign Up Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-2 sm:p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-4 lg:gap-8 items-center relative z-10">
        
        {/* Left side - Branding & Features */}
        <div className="hidden lg:block">
          <div className="space-y-8">
            {/* Logo and heading */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">Y</span>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Yuktor
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Enterprise SAP BASIS
                <span className="block text-primary">Support Platform</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Join thousands of professionals who trust Yuktor for their SAP infrastructure needs.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-foreground">24/7 Expert SAP BASIS Support</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-foreground">SAP RISE & Cloud Migration Services</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-foreground">Enterprise Security & Compliance</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-foreground">Performance Optimization</span>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="border-t border-border/50 pt-6">
              <p className="text-sm text-muted-foreground mb-4">Trusted by leading enterprises</p>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-xs text-muted-foreground">Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">99.9%</div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">15+</div>
                  <div className="text-xs text-muted-foreground">Years</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">Y</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Yuktor
              </span>
            </div>
            <p className="text-muted-foreground">SAP BASIS Enterprise Support Platform</p>
          </div>

          <Card className="glass-card border-border/50">
            <div className="p-3 sm:p-6">
              <Tabs defaultValue="signin" className="w-full">
                <div className="p-1 bg-secondary/10 rounded-xl mb-4 sm:mb-6 border border-border/30">
                <TabsList className="grid w-full grid-cols-2 bg-transparent h-12 p-1">
                  <TabsTrigger 
                    value="signin" 
                    className="relative h-10 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 data-[state=inactive]:text-muted-foreground hover:text-foreground"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="relative h-10 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 data-[state=inactive]:text-muted-foreground hover:text-foreground"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="signin">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Welcome Back</CardTitle>
                  <CardDescription className="text-base">
                    Sign in to access your SAP support dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* SSO Buttons */}
                  <SSOButtons disabled={loading} />
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 h-12"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary/50 h-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full btn-glow h-12 text-lg font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                          Signing In...
                        </div>
                      ) : (
                        <>
                          <Shield className="mr-2 w-5 h-5" />
                          Sign In to Dashboard
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="signup">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Join Yuktor</CardTitle>
                  <CardDescription className="text-base">
                    Create your account for professional SAP support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* SSO Buttons */}
                  <SSOButtons disabled={loading} />
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSignUp} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name" className="text-sm font-medium">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="first-name"
                            type="text"
                            placeholder="First name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 h-12"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name" className="text-sm font-medium">Last Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="last-name"
                            type="text"
                            placeholder="Last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 h-12"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Account Type</Label>
                      <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-0">
                          <RadioGroupItem value="customer" id="customer" className="sr-only" />
                          <Label 
                            htmlFor="customer" 
                            className={`w-full p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedRole === 'customer' 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border/50 hover:border-border'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-5 h-5 text-primary" />
                              <div>
                                <div className="font-medium">Customer</div>
                                <div className="text-xs text-muted-foreground">Enterprise User</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-0">
                          <RadioGroupItem 
                            value="consultant" 
                            id="consultant"
                            disabled={!allowConsultantSignup}
                            className="sr-only"
                          />
                          <Label 
                            htmlFor="consultant" 
                            className={`w-full p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedRole === 'consultant' && allowConsultantSignup
                                ? 'border-primary bg-primary/5' 
                                : 'border-border/50 hover:border-border'
                            } ${!allowConsultantSignup ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center space-x-2">
                              <Users className="w-5 h-5 text-primary" />
                              <div>
                                <div className="font-medium">Consultant</div>
                                <div className="text-xs text-muted-foreground">SAP Expert</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                      {!allowConsultantSignup && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            <AlertCircle className="w-4 h-4 inline mr-2" />
                            Consultant registration is currently disabled. Contact <span className="font-medium">appadmin@yuktor.com</span> to register as a consultant.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 h-12"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password (min 6 characters)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary/50 h-12"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary/50 h-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start">
                        <Mail className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        You'll receive an email verification link after registration. Some domains may be restricted for security.
                      </p>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full btn-glow h-12 text-lg font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                          Creating Account...
                        </div>
                      ) : (
                        <>
                          <Sparkles className="mr-2 w-5 h-5" />
                          Create Your Account
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
            </div>
          </Card>

          <div className="text-center mt-6">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Home
            </Button>
          </div>

          <div className="flex justify-center mt-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
