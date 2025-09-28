import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

// Define interfaces for consultant API responses
interface ConsultantPayment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  consultantEarning: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  paymentDate?: string;
}

// Get consultant payments
export const useConsultantPayments = () => {
  return useQuery({
    queryKey: ['consultant', 'payments'],
    queryFn: async () => {
      const response = await apiFetch('Consultant/payments');
      if (!response.ok) {
        throw new Error('Failed to fetch consultant payments');
      }
      return await response.json() as ConsultantPayment[];
    },
  });
};

// Get consultant earnings summary
export const useConsultantEarningsSummary = () => {
  return useQuery({
    queryKey: ['consultant', 'earnings-summary'],
    queryFn: async () => {
      const response = await apiFetch('Consultant/earnings-summary');
      if (!response.ok) {
        throw new Error('Failed to fetch earnings summary');
      }
      return await response.json();
    },
  });
};