import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConsultantPayments } from '@/hooks/useConsultant';

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

const ConsultantPayments = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Fetch consultant payments
  const { data: payments, isLoading, error } = useConsultantPayments();

  // Redirect if not consultant
  if (user?.role !== 'consultant') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">This page is only accessible to consultants.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter payments
  const filteredPayments = payments?.filter(payment => {
    const matchesSearch = payment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!payments) return { totalEarned: 0, pendingPayments: 0, completedPayments: 0, thisMonth: 0 };

    const totalEarned = payments
      .filter(p => ['PayoutCompleted', 'Paid', 'EscrowReleased'].includes(p.status))
      .reduce((sum, p) => sum + p.consultantEarning, 0);

    const pendingPayments = payments.filter(p =>
      ['PayoutInitiated', 'InEscrow', 'EscrowReadyForRelease'].includes(p.status)
    ).length;

    const completedPayments = payments.filter(p =>
      ['PayoutCompleted', 'Paid', 'EscrowReleased'].includes(p.status)
    ).length;

    const thisMonth = payments
      .filter(p => {
        const paymentDate = new Date(p.completedAt || p.createdAt);
        const now = new Date();
        return paymentDate.getMonth() === now.getMonth() &&
               paymentDate.getFullYear() === now.getFullYear() &&
               ['PayoutCompleted', 'Paid', 'EscrowReleased'].includes(p.status);
      })
      .reduce((sum, p) => sum + p.consultantEarning, 0);

    return { totalEarned, pendingPayments, completedPayments, thisMonth };
  }, [payments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PayoutInitiated':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Ready for Payout</Badge>;
      case 'PayoutCompleted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'PayoutFailed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>;
      case 'Paid':
      case 'EscrowReleased':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'InEscrow':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Escrow</Badge>;
      case 'EscrowReadyForRelease':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Ready for Release</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <PageLayout title="My Payments" description="Track your earnings and payment history">
        <div className="flex justify-center p-8">Loading payments...</div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="My Payments" description="Track your earnings and payment history">
        <div className="text-center p-8 text-red-600">Error loading payments</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="My Payments"
      description="Track your earnings, view payment history, and monitor payout status"
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalEarned)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.thisMonth)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingPayments}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completedPayments}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order number or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PayoutInitiated">Ready for Payout</SelectItem>
                  <SelectItem value="PayoutCompleted">Paid</SelectItem>
                  <SelectItem value="Paid">Completed</SelectItem>
                  <SelectItem value="PayoutFailed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!filteredPayments || filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No payments found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Your payment history will appear here once you complete tickets'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order Amount</TableHead>
                      <TableHead>Your Earnings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.orderNumber}
                        </TableCell>
                        <TableCell>{payment.customerName}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(payment.consultantEarning)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(payment.createdAt).toLocaleDateString()}</div>
                            {payment.completedAt && (
                              <div className="text-xs text-muted-foreground">
                                Completed: {new Date(payment.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Ready for Payout</Badge>
                  <span className="text-sm">Admin will process your payment externally</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge>
                  <span className="text-sm">Payment has been completed by admin</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>
                  <span className="text-sm">Payment processing failed, will be retried</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
                  <span className="text-sm">Payment successfully processed</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ConsultantPayments;