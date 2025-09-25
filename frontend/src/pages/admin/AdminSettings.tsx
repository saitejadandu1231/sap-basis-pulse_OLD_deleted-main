import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  MessageSquare, 
  Shield, 
  Mail, 
  Database, 
  Globe, 
  Zap,
  Save,
  RotateCcw,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
  const { data: featureFlags } = useFeatureFlags();
  const navigate = useNavigate();

  return (
    <PageLayout
      title="System Settings"
      description="Configure system-wide settings and feature flags"
      actions={
        <div className="flex space-x-2">
          <Button variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Feature Flags
            </CardTitle>
            <CardDescription>
              Enable or disable application features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="messaging">Messaging System</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to send messages and chat with consultants
                </p>
              </div>
              <Switch 
                id="messaging" 
                checked={featureFlags?.messagingEnabled || false}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fileUpload">File Upload</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to upload attachments with tickets
                </p>
              </div>
              <Switch id="fileUpload" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send real-time notifications to users
                </p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="analytics">Analytics Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Collect usage analytics and performance metrics
                </p>
              </div>
              <Switch id="analytics" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Put the system in maintenance mode for updates
                </p>
              </div>
              <Switch id="maintenance" />
            </div>
          </CardContent>
        </Card>

        {/* SSO Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              SSO Configuration
            </CardTitle>
            <CardDescription>
              Configure Single Sign-On authentication providers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Single Sign-On Settings</Label>
                <p className="text-sm text-muted-foreground">
                  Manage Google, Apple, and Supabase SSO authentication options
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/sso-settings')}
              >
                Configure SSO
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Core system settings and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxFileSize">Max File Upload Size (MB)</Label>
                <Input id="maxFileSize" type="number" defaultValue="25" />
              </div>
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input id="sessionTimeout" type="number" defaultValue="60" />
              </div>
              <div>
                <Label htmlFor="maxTicketsPerUser">Max Tickets per User</Label>
                <Input id="maxTicketsPerUser" type="number" defaultValue="20" />
              </div>
              <div>
                <Label htmlFor="ticketRetentionDays">Ticket Retention (days)</Label>
                <Input id="ticketRetentionDays" type="number" defaultValue="365" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input 
                id="allowedFileTypes" 
                defaultValue=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                placeholder="Comma-separated file extensions"
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Configure email notifications and SMTP settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input id="smtpHost" defaultValue="smtp.gmail.com" />
              </div>
              <div>
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input id="smtpPort" type="number" defaultValue="587" />
              </div>
              <div>
                <Label htmlFor="fromEmail">From Email Address</Label>
                <Input id="fromEmail" type="email" defaultValue="noreply@sapbasispulse.com" />
              </div>
              <div>
                <Label htmlFor="fromName">From Name</Label>
                <Input id="fromName" defaultValue="SAP BASIS Pulse" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="emailEnabled" defaultChecked />
              <Label htmlFor="emailEnabled">Enable Email Notifications</Label>
            </div>
            
            <Button variant="outline">Test Email Configuration</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure authentication and security policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                <Input id="minPasswordLength" type="number" defaultValue="8" />
              </div>
              <div>
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input id="maxLoginAttempts" type="number" defaultValue="5" />
              </div>
              <div>
                <Label htmlFor="lockoutDuration">Account Lockout (minutes)</Label>
                <Input id="lockoutDuration" type="number" defaultValue="30" />
              </div>
              <div>
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <Input id="passwordExpiry" type="number" defaultValue="90" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireMfa">Require Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Force all users to enable 2FA
                </p>
              </div>
              <Switch id="requireMfa" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireComplexPasswords">Require Complex Passwords</Label>
                <p className="text-sm text-muted-foreground">
                  Enforce uppercase, lowercase, numbers, and symbols
                </p>
              </div>
              <Switch id="requireComplexPasswords" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Database & Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Database & Storage
            </CardTitle>
            <CardDescription>
              Monitor and configure data storage settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">2.4 GB</div>
                  <p className="text-xs text-muted-foreground">Database Size</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">856 MB</div>
                  <p className="text-xs text-muted-foreground">File Storage</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">12 days</div>
                  <p className="text-xs text-muted-foreground">Last Backup</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline">Create Backup</Button>
              <Button variant="outline">Optimize Database</Button>
              <Button variant="outline">Clean Up Files</Button>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Maintenance Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                <Textarea 
                  id="maintenanceMessage"
                  placeholder="Enter a message to display to users during maintenance..."
                  rows={3}
                  defaultValue="The system will be undergoing scheduled maintenance. Please check back later."
                />
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline">
                  Schedule Maintenance
                </Button>
                <Button variant="outline">
                  Send User Notifications
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AdminSettings;