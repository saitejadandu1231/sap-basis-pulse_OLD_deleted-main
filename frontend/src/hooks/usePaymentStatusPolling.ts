import { useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface PaymentStatusCheckOptions {
  orderId: string;
  maxAttempts?: number;
  pollIntervalMs?: number;
  onSuccess?: (paymentStatus: string) => void;
  onFailure?: (error: string) => void;
  onAttempt?: (attempt: number, maxAttempts: number) => void;
}

/**
 * Hook to automatically check payment status after payment completion
 * Useful when verification endpoint might be temporarily unavailable or token expired
 * 
 * Usage:
 * const { startPolling, stopPolling } = usePaymentStatusPolling();
 * 
 * // After payment completes
 * startPolling({
 *   orderId: ticket.id,
 *   maxAttempts: 12,  // 12 attempts * 5 seconds = 60 seconds total
 *   pollIntervalMs: 5000,
 *   onSuccess: (status) => { ... }
 * });
 */
export const usePaymentStatusPolling = () => {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef<number>(0);

  const startPolling = useCallback((options: PaymentStatusCheckOptions) => {
    const {
      orderId,
      maxAttempts = 12, // 1 minute with 5 second interval
      pollIntervalMs = 5000, // 5 seconds
      onSuccess,
      onFailure,
      onAttempt,
    } = options;

    attemptsRef.current = 0;

    const poll = async () => {
      attemptsRef.current++;
      onAttempt?.(attemptsRef.current, maxAttempts);

      try {
        const response = await apiFetch(`orders/${orderId}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch order status: ${response.statusText}`);
        }

        const order = await response.json();

        if (order.paymentStatus === 'Paid') {
          console.log('[Payment Polling] Payment verified successfully');
          stopPolling();
          onSuccess?.(order.paymentStatus);
          return;
        }

        if (attemptsRef.current >= maxAttempts) {
          console.warn('[Payment Polling] Max attempts reached, payment status still not updated');
          stopPolling();
          onFailure?.('Payment verification timeout - please refresh to check status');
          return;
        }
      } catch (error) {
        console.error('[Payment Polling] Error checking payment status:', error);

        if (attemptsRef.current >= maxAttempts) {
          stopPolling();
          onFailure?.(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };

    // Start polling
    console.log(`[Payment Polling] Starting payment status check (max ${maxAttempts} attempts, ${pollIntervalMs}ms interval)`);
    pollingIntervalRef.current = setInterval(poll, pollIntervalMs);

    // Also do an immediate check
    poll();
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('[Payment Polling] Polling stopped');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
  };
};
