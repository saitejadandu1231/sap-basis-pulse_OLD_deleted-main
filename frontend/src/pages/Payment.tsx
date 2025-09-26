import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useVerifyPayment, useCreatePaymentOrder } from '@/hooks/usePayments';
import { toast } from 'sonner';

const loadRazorpay = () => new Promise<void>((resolve, reject) => {
  if ((window as any).Razorpay) return resolve();
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('Failed to load Razorpay script'));
  document.body.appendChild(script);
});

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const [summary, setSummary] = useState<any>(null);
  const verify = useVerifyPayment();
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      let res = await apiFetch(`Payments/summary/${orderId}`);
      if (res.status === 404) {
        // Payment record not found yet - try to create the order as a fallback (customer flow)
        try {
          toast('Creating payment order...');
          const createRes = await apiFetch('Payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          });
          if (!createRes.ok) {
            // Try to extract structured error message, otherwise fallback to plain text
            let errBody: any = {};
            try {
              errBody = await createRes.json();
            } catch (jsonErr) {
              try {
                const txt = await createRes.text();
                errBody = { error: txt };
              } catch {
                errBody = { error: 'Unknown error' };
              }
            }
            console.error('Create order failed', createRes.status, errBody);
            throw new Error(errBody?.error || 'Failed to create payment order');
          }
          // After creating, re-fetch summary
          res = await apiFetch(`Payments/summary/${orderId}`);
        } catch (err: any) {
          console.error('Failed to create payment order on-demand', err);
          toast.error(err?.message || 'Failed to create payment order');
          return;
        }
      }

      if (!res.ok) {
        toast.error('Failed to load payment details');
        return;
      }
      setSummary(await res.json());
    })();
  }, [orderId]);

  const startCheckout = async () => {
    if (!summary) return;
    try {
      await loadRazorpay();
    } catch (e) {
      toast.error('Unable to load payment checkout');
      return;
    }

    const options = {
      key: summary.razorpayKeyId,
      amount: summary.amountInPaise,
      currency: summary.currency,
      name: 'SAP Basis Pulse',
      description: summary.description || 'Consultation payment',
      order_id: summary.razorpayOrderId,
      handler: async function (response: any) {
        try {
          await verify.mutateAsync({
            orderId: orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          toast.success('Payment successful');
          navigate('/tickets');
        } catch (err) {
          console.error(err);
          toast.error('Payment verification failed');
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  if (!orderId) return <PageLayout title="Payment">No order specified</PageLayout>;

  return (
    <PageLayout title="Payment">
      <div className="space-y-4 max-w-lg">
        {summary ? (
          <div className="p-4 border rounded">
            <div className="text-sm text-muted-foreground">Amount</div>
            <div className="text-2xl font-semibold">₹{(summary.amountInPaise/100).toFixed(2)}</div>
            <div className="text-sm">Status: {summary.status}</div>
            <div className="mt-4 flex space-x-2">
              <Button onClick={startCheckout}>Pay now</Button>
              <Button variant="outline" onClick={() => navigate('/tickets')}>Back to tickets</Button>
            </div>
          </div>
        ) : (
          <div>Loading payment details...</div>
        )}
      </div>
    </PageLayout>
  );
};

export default PaymentPage;
