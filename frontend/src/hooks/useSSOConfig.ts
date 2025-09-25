import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface SSOConfig {
  googleEnabled: boolean;
  appleEnabled: boolean;
  supabaseEnabled: boolean;
}

export const useSSOConfig = () => {
  return useQuery({
    queryKey: ['sso-config'],
    queryFn: async () => {
      const response = await apiFetch('SSOConfig/status');
      if (!response.ok) {
        throw new Error('Failed to fetch SSO configuration');
      }
      return await response.json() as SSOConfig;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
};

export const useUpdateSSOConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: SSOConfig) => {
      const response = await apiFetch('SSOConfig/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update SSO configuration');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-config'] });
    },
  });
};