import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Save, Settings, ExternalLink, IndianRupee } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ConsultantSettings = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate?.toString() || '');
  const queryClient = useQueryClient();

  // Update local state when user data changes
  useEffect(() => {
    setHourlyRate(user?.hourlyRate?.toString() || '');
  }, [user?.hourlyRate]);

  const updateHourlyRateMutation = useMutation({
    mutationFn: async (rate: number) => {
      const response = await apiFetch(`/users/${user?.id}/hourly-rate`, {
        method: 'PUT',
        body: JSON.stringify({
          hourlyRate: rate
        })
      });
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Hourly rate updated successfully');
      await refreshUser(); // Refresh user data to update the auth context
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update hourly rate');
    }
  });

  const handleSave = () => {
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error('Please enter a valid hourly rate');
      return;
    }
    updateHourlyRateMutation.mutate(rate);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hourlyRate" className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4" />
          Hourly Rate
        </Label>
        <div className="flex gap-2">
          <Input
            id="hourlyRate"
            type="number"
            placeholder="Enter your hourly rate"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            min="0"
            step="0.01"
          />
          <Button
            onClick={handleSave}
            disabled={updateHourlyRateMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateHourlyRateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Set your hourly consulting rate. This will be used to calculate charges for support sessions.
        </p>
      </div>

      {user?.hourlyRate && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Current Rate:</strong> ₹{user.hourlyRate.toFixed(2)} per hour
          </p>
        </div>
      )}

      {/* Skills Management Section */}
      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <Label className="text-base font-semibold">Expertise Areas</Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/consultant/skills')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Manage Skills
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Define your SAP consulting specializations to help customers find the right expert.
          Click "Manage Skills" to update your expertise areas.
        </p>
      </div>
    </div>
  );
};

export default ConsultantSettings;