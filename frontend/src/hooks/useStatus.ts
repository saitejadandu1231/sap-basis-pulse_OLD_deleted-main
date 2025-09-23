import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface StatusOption {
  id: number;
  statusCode: string;
  statusName: string;
  description: string;
  colorCode: string;
  iconCode: string;
}

interface StatusHistoryItem {
  id: string;
  changedAt: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  comment?: string;
  ipAddress?: string;
}

export const useStatusOptions = () => {
  return useQuery({
    queryKey: ['status-options'],
    queryFn: async (): Promise<StatusOption[]> => {
      const response = await apiFetch('api/status/options');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - status options don't change often
  });
};

export const useStatusHistory = (orderId: string, enabled = true) => {
  return useQuery({
    queryKey: ['status-history', orderId],
    queryFn: async (): Promise<StatusHistoryItem[]> => {
      const response = await apiFetch(`api/status/history/${orderId}`);
      return response.json();
    },
    enabled: enabled && !!orderId,
  });
};