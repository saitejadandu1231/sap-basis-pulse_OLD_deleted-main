import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  dataType: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface UpdateSystemSettingRequest {
  value: string;
}

export interface CreateSystemSettingRequest {
  key: string;
  value: string;
  description?: string;
  dataType: string;
}

// Get all system settings
export const useSystemSettings = () => {
  return useQuery<SystemSetting[]>({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const response = await apiFetch('SystemSettings');
      if (!response.ok) {
        throw new Error('Failed to fetch system settings');
      }
      return await response.json() as SystemSetting[];
    },
  });
};

// Get a specific system setting
export const useSystemSetting = (key: string) => {
  return useQuery<SystemSetting>({
    queryKey: ['systemSetting', key],
    queryFn: async () => {
      const response = await apiFetch(`SystemSettings/${key}`);
      if (!response.ok) {
        throw new Error('Failed to fetch system setting');
      }
      return await response.json() as SystemSetting;
    },
    enabled: !!key,
  });
};

// Update a system setting
export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiFetch(`SystemSettings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      if (!response.ok) {
        throw new Error('Failed to update system setting');
      }
      return await response.json() as SystemSetting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      queryClient.invalidateQueries({ queryKey: ['systemSetting'] });
    },
  });
};

// Create a new system setting
export const useCreateSystemSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSystemSettingRequest) => {
      const response = await apiFetch('SystemSettings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create system setting');
      }
      return await response.json() as SystemSetting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    },
  });
};

// Delete a system setting
export const useDeleteSystemSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (key: string) => {
      await apiFetch(`SystemSettings/${key}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    },
  });
};