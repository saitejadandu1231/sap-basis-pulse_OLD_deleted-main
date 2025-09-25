import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SSOConfiguration {
  id: number;
  googleEnabled: boolean;
  appleEnabled: boolean;
  supabaseEnabled: boolean;
}

const AdminSSOSettings = () => {
  const [config, setConfig] = useState<SSOConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSSOConfig();
  }, []);

  const fetchSSOConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sso-config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        toast.error('Failed to load SSO configuration');
      }
    } catch (error) {
      console.error('Error fetching SSO config:', error);
      toast.error('Failed to load SSO configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sso-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('SSO configuration updated successfully');
      } else {
        toast.error('Failed to update SSO configuration');
      }
    } catch (error) {
      console.error('Error updating SSO config:', error);
      toast.error('Failed to update SSO configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof Omit<SSOConfiguration, 'id'>, value: boolean) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center text-muted-foreground">
        Failed to load SSO configuration
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SSO Settings</h1>
        <p className="text-muted-foreground">
          Configure Single Sign-On options for your users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SSO Providers</CardTitle>
          <CardDescription>
            Enable or disable SSO authentication providers. When disabled, users will use the standard login form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="supabase-enabled">Supabase SSO</Label>
              <p className="text-sm text-muted-foreground">
                Enable Supabase-based SSO authentication
              </p>
            </div>
            <Switch
              id="supabase-enabled"
              checked={config.supabaseEnabled}
              onCheckedChange={(checked) => updateConfig('supabaseEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="google-enabled">Google SSO</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to sign in with Google
              </p>
            </div>
            <Switch
              id="google-enabled"
              checked={config.googleEnabled}
              onCheckedChange={(checked) => updateConfig('googleEnabled', checked)}
              disabled={!config.supabaseEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="apple-enabled">Apple SSO</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to sign in with Apple
              </p>
            </div>
            <Switch
              id="apple-enabled"
              checked={config.appleEnabled}
              onCheckedChange={(checked) => updateConfig('appleEnabled', checked)}
              disabled={!config.supabaseEnabled}
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Supabase SSO must be enabled to use Google or Apple authentication
          </p>
          <p className="text-sm text-muted-foreground">
            • When SSO is disabled, users will see only the standard login form
          </p>
          <p className="text-sm text-muted-foreground">
            • New SSO users will be prompted to select their role and provide additional information
          </p>
          <p className="text-sm text-muted-foreground">
            • Make sure your Supabase project is configured with the appropriate OAuth providers
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSSOSettings;