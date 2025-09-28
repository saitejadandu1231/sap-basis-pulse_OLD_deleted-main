import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Clock, DollarSign, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSummary {
  totalReceived: number;
  adminEarnings: number;
  consultantPayouts: number;
  pendingReleases: number;
}

interface PaymentReadyForPayout {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  consultantName: string;
  amount: number;
  currency: string;
  status: string;
  consultantEarning: number;
  createdAt: string;
}

const PaymentsReadyForPayout: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch payments ready for payout (both EscrowReadyForRelease and EscrowReleased)
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments-ready-for-payout'],
    queryFn: async () => {
      const response = await fetch('/api/admin/payments/ready-for-payout');
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json() as Promise<PaymentReadyForPayout[]>;
    },
  });

  // Calculate summary statistics
  const summary: PaymentSummary = React.useMemo(() => {
    if (!payments) return { totalReceived: 0, adminEarnings: 0, consultantPayouts: 0, pendingReleases: 0 };

    const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
    const adminEarnings = payments.reduce((sum, p) => sum + (p.amount - p.consultantEarning), 0);
    const consultantPayouts = payments.reduce((sum, p) => sum + p.consultantEarning, 0);
    const pendingPayouts = payments.filter(p => p.status === 'PayoutInitiated').length;

    return { totalReceived, adminEarnings, consultantPayouts, pendingReleases: pendingPayouts };
  }, [payments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="secondary">Paid</Badge>;
      case 'PayoutInitiated':
        return <Badge variant="secondary">Ready for Payout</Badge>;
      case 'PayoutCompleted':
        return <Badge variant="default">Payout Completed</Badge>;
      case 'PayoutFailed':
        return <Badge variant="destructive">Payout Failed</Badge>;
      case 'Failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (paymentsLoading) {
    return <div className="flex justify-center p-8">Loading payments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalReceived)}</div>
            <p className="text-xs text-muted-foreground">From all payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.adminEarnings)}</div>
            <p className="text-xs text-muted-foreground">Platform commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultant Payouts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.consultantPayouts)}</div>
            <p className="text-xs text-muted-foreground">To be paid manually</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingReleases}</div>
            <p className="text-xs text-muted-foreground">Ready for manual payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Consultant Payout Management</CardTitle>
          <CardDescription>
            Track payments received from customers and manage manual payouts to consultants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Consultant</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Consultant Share</TableHead>
                  <TableHead>Admin Share</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.orderNumber}</TableCell>
                    <TableCell>{payment.customerName}</TableCell>
                    <TableCell>{payment.consultantName || 'Unassigned'}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatCurrency(payment.consultantEarning)}</TableCell>
                    <TableCell>{formatCurrency(payment.amount - payment.consultantEarning)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {payment.status === 'PayoutInitiated' && (
                        <Badge variant="outline" className="text-blue-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Ready for Manual Payout
                        </Badge>
                      )}
                      {payment.status === 'PayoutCompleted' && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid to Consultant
                        </Badge>
                      )}
                      {payment.status === 'PayoutFailed' && (
                        <Badge variant="destructive">
                          Payout Failed
                        </Badge>
                      )}
                      {payment.status === 'Paid' && (
                        <Badge variant="outline" className="text-orange-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Awaiting Order Completion
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsReadyForPayout;
