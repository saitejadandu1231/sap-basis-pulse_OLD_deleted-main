import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Shield, Palette, Globe, Sun, Moon, Monitor, IndianRupee } from 'lucide-react';
import { useConsultantSelfProfile, useUpdateConsultantSelfProfile } from '@/hooks/useConsultantProfile';
import { toast } from 'sonner';

const Settings = () => {
  const { user, userRole, firstName, lastName } = useAuth();
  const isConsultant = userRole?.toLowerCase() === 'consultant';
  const { data: profile, isLoading: loadingProfile } = useConsultantSelfProfile();
  const updateProfile = useUpdateConsultantSelfProfile();
  const [rate, setRate] = React.useState<string>('');
  const [upi, setUpi] = React.useState<string>('');

  React.useEffect(() => {
    if (profile) {
      setRate(profile.hourlyRate?.toString() || '');
      setUpi(profile.upiId || '');
    }
  }, [profile]);
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      description: 'Clean and bright interface',
      icon: Sun
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: Moon
    },
    {
      value: 'system',
      label: 'System',
      description: 'Follow your system preference',
      icon: Monitor
    }
  ];
  
  return (
    <PageLayout
      title="Settings"
      description="Manage your account settings and preferences"
    >
      <div className="space-y-6">
        {/* Consultant Rates & Payouts */}
        {isConsultant && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IndianRupee className="w-5 h-5 mr-2" />
                Rates & Payouts
              </CardTitle>
              <CardDescription>
                Set your hourly rate and UPI ID for payouts. Customers will see your rate on booking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate (INR)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    placeholder="e.g. 1500"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    disabled={loadingProfile || updateProfile.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1">This is used to calculate price for booked slots.</p>
                </div>
                <div>
                  <Label htmlFor="upi">UPI ID (for payouts)</Label>
                  <Input
                    id="upi"
                    placeholder="e.g. name@bank"
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                    disabled={loadingProfile || updateProfile.isPending}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    const val = parseFloat(rate || '0');
                    if (isNaN(val) || val <= 0) {
                      toast.error('Please enter a valid hourly rate greater than 0');
                      return;
                    }
                    try {
                      await updateProfile.mutateAsync({ hourlyRate: val, upiId: upi || null });
                      toast.success('Rates & payouts updated');
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to update');
                    }
                  }}
                  disabled={loadingProfile || updateProfile.isPending}
                >
                  {updateProfile.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue={firstName || ''} />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={lastName || ''} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
              <p className="text-sm text-muted-foreground mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue={userRole || ''} disabled />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Switch id="emailNotifications" defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ticketUpdates">Ticket Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when ticket status changes
                </p>
              </div>
              <Switch id="ticketUpdates" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="messageNotifications">Message Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Notify for new messages
                </p>
              </div>
              <Switch id="messageNotifications" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Change Password</Button>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Switch id="twoFactor" />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Theme Preference</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose your preferred theme for the application
              </p>
              <div className="grid grid-cols-1 gap-3">
                {themeOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = theme === option.value;
                  
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto p-4 justify-start text-left ${
                        isSelected ? 'ring-2 ring-ring ring-offset-2' : ''
                      }`}
                      onClick={() => setTheme(option.value)}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={`w-5 h-5 mt-0.5 ${
                          isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                        }`} />
                        <div>
                          <div className={`font-medium ${
                            isSelected ? 'text-primary-foreground' : 'text-foreground'
                          }`}>
                            {option.label}
                          </div>
                          <div className={`text-sm ${
                            isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}>
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Language & Region
            </CardTitle>
            <CardDescription>
              Set your preferred language and regional settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="UTC">UTC</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Settings;