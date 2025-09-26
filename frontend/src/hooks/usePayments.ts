import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface CreatePaymentOrderResponse {
  razorpayOrderId: string;
  amountInPaise: number;
  currency: string;
  razorpayKeyId: string;
  description: string;
  receipt: string;
}

export const useCreatePaymentOrder = () => {
  return useMutation({
    mutationFn: async (data: { orderId: string }) => {
      const res = await apiFetch('Payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create payment order');
      }
      return (await res.json()) as CreatePaymentOrderResponse;
    }
  });
};

export interface PaymentSummaryDto {
  orderId: string;
  status: string;
  amountInPaise: number;
  platformFeeInPaise: number;
  consultantEarningInPaise: number;
  currency: string;
  capturedAt?: string | null;
}

export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: async (data: { orderId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }) => {
      const res = await apiFetch('Payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderId,
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to verify payment');
      }
      return (await res.json()) as PaymentSummaryDto;
    }
  });
};

// Create payment order when consultant closes the ticket (pay-on-close)
export const useCreatePaymentOrderOnClose = () => {
  return useMutation({
    mutationFn: async (data: { orderId: string }) => {
      const res = await apiFetch('Payments/create-order-on-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create payment order on close');
      }
      return (await res.json()) as CreatePaymentOrderResponse;
    }
  });
};

export const usePaymentSummary = (orderId: string) => {
  return {
    get: async () => {
      const res = await apiFetch(`Payments/summary/${orderId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch payment summary');
      }
      return await res.json();
    }
  };
};
