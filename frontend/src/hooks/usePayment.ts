import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

// Payment interfaces
interface PaymentOrder {
  id: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: string;
}

interface PaymentVerification {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// Create Razorpay order
export const useCreatePaymentOrder = () => {
  return useMutation({
    mutationFn: async ({ orderId, amount }: { orderId: string; amount: number }) => {
      const response = await apiFetch('Payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          currency: 'INR'
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }
      return await response.json();
    },
  });
};

// Verify payment
export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: async (verificationData: PaymentVerification) => {
      const response = await apiFetch('Payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });
      if (!response.ok) {
        throw new Error('Payment verification failed');
      }
      return await response.json();
    },
  });
};