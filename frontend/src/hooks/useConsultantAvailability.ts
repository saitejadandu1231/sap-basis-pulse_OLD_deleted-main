import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface BookedSlot {
  id: string;
  consultantId: string;
  slotStartTime: string;
  slotEndTime: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  supportTypeName: string;
  supportCategoryName: string;
  priority: string;
  description: string;
  status: string;
  createdAt: string;
}

export const useConsultantBookedSlots = (consultantId?: string) => {
  const { token } = useAuth();

  return useQuery<BookedSlot[]>({
    queryKey: ['consultant-booked-slots', consultantId],
    queryFn: async () => {
      if (!consultantId) return [];
      
      const response = await apiFetch(`/ConsultantAvailability/consultant/${consultantId}/booked-slots`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booked slots');
      }

      return response.json();
    },
    enabled: !!consultantId && !!token,
  });
};