import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRecentTickets, useUpdateTicketStatus, useTicketRatings } from '@/hooks/useSupport';
import { useStatusOptions } from '@/hooks/useStatus';
import { useCreatePaymentOrder, useVerifyPayment } from '@/hooks/usePayment';
    
import TicketStatusUpdater from '@/components/TicketStatusUpdater';
import TicketRatingContainer from '@/components/TicketRatingContainer';
import StatusHistory from '@/components/StatusHistory';
import WorkSummary from '@/components/WorkSummary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Plus, Settings, User, Calendar, ChevronDown, Star, ChevronUp, ChevronRight, Eye, Filter, X, DollarSign } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { toast } from 'sonner';
import PageLayout from '@/components/layout/PageLayout';

// Compact rating preview component
const TicketRatingPreview: React.FC<{ ticketId: string }> = ({ ticketId }) => {
  const { data: ratings } = useTicketRatings(ticketId);
  const { userRole } = useAuth();
  
  if (!ratings || ratings.length === 0) {
    return (
      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
        <Star className="w-3 h-3" />
        <span>{userRole === 'customer' ? 'Not rated yet' : 'No ratings yet'}</span>
      </div>
    );
  }
  
  const avgRating = ratings.reduce((sum: number, rating: any) => {
    const total = (rating.resolutionQuality + rating.responseTime + rating.communicationProfessionalism) / 3;
    return sum + total;
  }, 0) / ratings.length;
  
  return (
    <div className="flex items-center space-x-1 text-xs">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= Math.round(avgRating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
      <span className="text-muted-foreground">
        {avgRating.toFixed(1)} ({ratings.length} review{ratings.length !== 1 ? 's' : ''})
      </span>
    </div>
  );
};

const Tickets = () => {
  const { user, userRole } = useAuth();
  const { data: featureFlags } = useFeatureFlags();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState({ open: false, ticketId: '', newStatus: '', oldStatus: '', consultantHourlyRate: null as number | null });
  const [statusComment, setStatusComment] = useState('');
  const [dialogHoursWorked, setDialogHoursWorked] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingTicketId, setProcessingTicketId] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    supportType: 'all',
    consultant: 'all',
    paymentStatus: 'all',
    dateRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const updateTicketStatus = useUpdateTicketStatus();
  const { data: statusOptionsData } = useStatusOptions();
  const createPaymentOrder = useCreatePaymentOrder();
  const verifyPaymentMutation = useVerifyPayment();

  // Get search query from URL
  const searchQuery = searchParams.get('search') || '';
  const ticketIdFromUrl = searchParams.get('ticket');
  console.log('Tickets component - searchQuery:', searchQuery, 'searchParams:', searchParams.toString());

  const { data: tickets, isLoading, refetch } = useRecentTickets(searchQuery?.trim() || undefined);

  // Filter tickets based on selected filters
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];

    return tickets.filter(ticket => {
      // Status filter
      if (filters.status !== 'all' && ticket.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) {
        return false;
      }

      // Support Type filter
      if (filters.supportType !== 'all' && ticket.supportTypeName !== filters.supportType) {
        return false;
      }

      // Consultant filter (only for admin/consultant roles)
      if (filters.consultant !== 'all') {
        if (userRole === 'admin' && ticket.consultantName !== filters.consultant) {
          return false;
        }
        if (userRole === 'consultant' && ticket.consultantId !== filters.consultant) {
          return false;
        }
      }

      // Payment Status filter
      if (filters.paymentStatus !== 'all' && ticket.paymentStatus !== filters.paymentStatus) {
        return false;
      }

      // Date Range filter
      if (filters.dateRange !== 'all') {
        const ticketDate = new Date(ticket.createdAt);
        const now = new Date();

        switch (filters.dateRange) {
          case 'today':
            // Fix: Use local date comparison instead of mathematical calculation
            const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const ticketLocalDate = new Date(ticketDate.getFullYear(), ticketDate.getMonth(), ticketDate.getDate());
            if (ticketLocalDate.toDateString() !== todayLocal.toDateString()) return false;
            break;
          case 'week':
            const daysDiffWeek = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiffWeek > 7) return false;
            break;
          case 'month':
            const daysDiffMonth = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiffMonth > 30) return false;
            break;
          case 'quarter':
            const daysDiffQuarter = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiffQuarter > 90) return false;
            break;
        }
      }

      return true;
    });
  }, [tickets, filters, userRole]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    if (!tickets) return {
      statuses: [] as string[],
      priorities: [] as string[],
      supportTypes: [] as string[],
      consultants: [] as string[],
      paymentStatuses: [] as string[]
    };

    const statuses = [...new Set(tickets.map(t => t.status).filter(Boolean))] as string[];
    const priorities = [...new Set(tickets.map(t => t.priority).filter(Boolean))] as string[];
    const supportTypes = [...new Set(tickets.map(t => t.supportTypeName).filter(Boolean))] as string[];
    const consultants = userRole === 'admin' 
      ? [...new Set(tickets.map(t => t.consultantName).filter(Boolean))] as string[]
      : [] as string[];
    
    // Ensure common payment statuses are always available as filter options
    const ticketPaymentStatuses = [...new Set(tickets.map(t => t.paymentStatus).filter(Boolean))] as string[];
    const commonPaymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
    const paymentStatuses = [...new Set([...commonPaymentStatuses, ...ticketPaymentStatuses])].sort();

    return {
      statuses: statuses.sort(),
      priorities: priorities.sort(),
      supportTypes: supportTypes.sort(),
      consultants: consultants.sort(),
      paymentStatuses: paymentStatuses.sort()
    };
  }, [tickets, userRole]);

  // Auto-open ticket from URL parameter
  useEffect(() => {
    if (ticketIdFromUrl && tickets && tickets.length > 0 && !selectedTicket) {
      const ticket = tickets.find(t => t.id === ticketIdFromUrl);
      if (ticket) {
        setSelectedTicket(ticket);
        setIsDialogOpen(true);
        // Clear the ticket parameter from URL after opening
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('ticket');
          return newParams;
        });
      }
    }
  }, [ticketIdFromUrl, tickets, selectedTicket]);

  // Transform API data to match component expectations
  const statusOptions = statusOptionsData?.map(option => ({
    value: option.statusCode,
    label: option.statusName,
    color: option.colorCode || 'bg-gray-500', // Fallback color if not provided
    description: option.description
  })) || [];

  // Filter status options based on user role and business rules
  const getFilteredStatusOptions = (currentTicketStatus?: string) => {
    if (userRole === 'consultant') {
      // Check if ticket is closed - consultants cannot change status of closed tickets
      const isTicketClosed = currentTicketStatus === 'Closed' || 
                           currentTicketStatus === 'TopicClosed' || 
                           currentTicketStatus === 'Paid';
      
      // If ticket is closed, consultants cannot change status until customer reopens
      if (isTicketClosed) {
        return [];
      }
      
      // For consultants: allow moving FROM "New" but not TO "New" (except if already New)
      // Also cannot set TopicClosed, Paid, or ReOpened
      return statusOptions.filter(option => {
        // Allow keeping current status
        if (option.value === currentTicketStatus) {
          return true;
        }
        
        // Block these statuses completely for consultants
        if (option.value === 'TopicClosed' || 
            option.value === 'Paid' || 
            option.value === 'ReOpened') {
          return false;
        }
        
        // Block "New" status unless ticket is currently "New"
        if (option.value === 'New' && currentTicketStatus !== 'New') {
          return false;
        }
        
        return true;
      });
    } else if (userRole === 'customer') {
      // Customers can only reopen closed tickets
      const isTicketClosed = currentTicketStatus === 'Closed' || currentTicketStatus === 'TopicClosed';
      return isTicketClosed 
        ? statusOptions.filter(option => option.value === 'ReOpened')
        : [];
    } else {
      // Admins can access all statuses
      return statusOptions;
    }
  };

  const filteredStatusOptions = getFilteredStatusOptions();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Closed':
      case 'Paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'In Progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Closed':
        return 'default' as const;
      case 'In Progress':
        return 'secondary' as const;
      case 'PendingCustomerAction':
        return 'outline' as const;
      case 'TopicClosed':
        return 'default' as const;
      case 'ReOpened':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const handleTicketClick = (ticket: any) => {
    // Allow all user types to view ticket details
    setSelectedTicket(ticket);
    setIsDialogOpen(true);
  };

  const handleStatusUpdate = (ticketId: string, newStatus: string) => {
    // Refresh tickets after status update
    refetch();
    setIsDialogOpen(false);
  };

  const handleQuickStatusUpdate = (ticketId: string, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) {
      return;
    }

    // Find the ticket to get consultant hourly rate
    const ticket = tickets?.find(t => t.id === ticketId);
    const consultantHourlyRate = ticket?.consultantHourlyRate || null;

    // Open comment dialog for status change
    setStatusChangeDialog({ open: true, ticketId, newStatus, oldStatus: currentStatus, consultantHourlyRate });
    setStatusComment('');
    setDialogHoursWorked('');
  };

  const confirmStatusChange = async () => {
    const { ticketId, newStatus, oldStatus } = statusChangeDialog;
    
    // Check if this is a completion status and user is consultant
    const isCompletionStatus = newStatus === 'Completed' || newStatus === 'Closed' || newStatus === 'TopicClosed';
    const isTransitioningToCompletion = isCompletionStatus && oldStatus !== newStatus && userRole === 'consultant';
    
    // Validate hours worked for completion statuses
    if (isTransitioningToCompletion) {
      const hours = parseFloat(dialogHoursWorked);
      if (!dialogHoursWorked || isNaN(hours) || hours <= 0) {
        toast.error('Please enter valid hours worked');
        return;
      }
      if (hours > 24) {
        toast.error('Hours worked cannot exceed 24 hours per ticket');
        return;
      }
    }
    
    try {
      await updateTicketStatus.mutateAsync({
        orderId: ticketId,
        status: newStatus as any,
        comment: statusComment.trim() || undefined,
        hoursWorked: isTransitioningToCompletion ? parseFloat(dialogHoursWorked) : undefined
      });
      toast.success('Status updated successfully');
      refetch();
      setStatusChangeDialog({ open: false, ticketId: '', newStatus: '', oldStatus: '', consultantHourlyRate: null });
      setStatusComment('');
      setDialogHoursWorked('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePayment = async (ticket: any) => {
    // Initialize Razorpay function
    const initializeRazorpay = (paymentOrder: any) => {
      // Initialize Razorpay
      const options = {
        key: paymentOrder.key,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Yuktor',
        description: `Payment for ${ticket.orderNumber}`,
        order_id: paymentOrder.razorpayOrderId,
        handler: async function (response: any) {
          try {
            console.log('Razorpay response:', response);
            console.log('Response keys:', Object.keys(response));
            
            // Check all possible property names
            const orderId = response.razorpay_order_id || response.order_id || response.razorpayOrderId;
            const paymentId = response.razorpay_payment_id || response.payment_id || response.razorpayPaymentId;
            const signature = response.razorpay_signature || response.signature || response.razorpaySignature;
            
            console.log('Extracted values:', { orderId, paymentId, signature });
            
            // Ensure all required fields are present
            if (!orderId || !paymentId || !signature) {
              console.error('Missing required Razorpay response fields:', {
                orderId, paymentId, signature,
                original: response
              });
              toast.error('Payment verification failed: Missing payment details');
              setProcessingTicketId(null);
              return;
            }

            await verifyPaymentMutation.mutateAsync({
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              razorpaySignature: signature
            });
            
            toast.success('Payment successful! Payment has been completed.');
            refetch(); // Refresh tickets
          } catch (error: any) {
            toast.error('Payment verification failed: ' + error.message);
          } finally {
            setProcessingTicketId(null);
          }
        },
        modal: {
          ondismiss: function() {
            setProcessingTicketId(null);
          }
        },
        prefill: {
          name: user?.firstName + ' ' + user?.lastName,
          email: user?.email,
        },
        theme: {
          color: '#3B82F6',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };

    try {
      setProcessingTicketId(ticket.id);
      const amount = ticket.calculatedAmount || ticket.totalAmount || 100; // Use calculated amount first, then total amount, or default
      
      const paymentOrder = await createPaymentOrder.mutateAsync({
        orderId: ticket.id,
        amount: amount
      });

      // Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          initializeRazorpay(paymentOrder);
        };
        script.onerror = () => {
          toast.error('Failed to load payment gateway');
          setProcessingTicketId(null);
        };
        document.body.appendChild(script);
      } else {
        initializeRazorpay(paymentOrder);
      }
    } catch (error: any) {
      toast.error('Failed to initiate payment: ' + error.message);
      setProcessingTicketId(null);
    }
  };

  const canManageTicket = (ticket: any) => {
    return userRole === 'admin' || 
           (userRole === 'consultant' && ticket.consultantId === user?.id); // Fixed incorrect comparison
  };

  // Filter handlers
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      supportType: 'all',
      consultant: 'all',
      paymentStatus: 'all',
      dateRange: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all');

  return (
    <PageLayout
      title={userRole === 'admin' ? 'All Tickets' : 'My Tickets'}
      description={
        searchQuery 
          ? `Search results for "${searchQuery}" (${filteredTickets?.length || 0} of ${tickets?.length || 0} results)`
          : hasActiveFilters
          ? `Showing ${filteredTickets?.length || 0} of ${tickets?.length || 0} tickets`
          : (userRole === 'admin' ? 'Manage all support requests' : 'View and manage your support tickets')
      }
      actions={
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-secondary' : ''}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                {Object.values(filters).filter(v => v !== 'all').length}
              </Badge>
            )}
          </Button>
          {searchQuery && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSearchParams({});
              }}
            >
              Clear Search
            </Button>
          )}
          {userRole === 'customer' && (
            <Button onClick={() => navigate('/support')}>
              <Plus className="w-4 h-4 mr-1" />
              New Ticket
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filter Tickets</CardTitle>
                <div className="flex items-center space-x-2">
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAllFilters}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">All Status</SelectItem>
                      {filterOptions.statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/([A-Z])/g, ' $1').trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Priority</Label>
                  <Select 
                    value={filters.priority} 
                    onValueChange={(value) => handleFilterChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">All Priority</SelectItem>
                      {filterOptions.priorities.map(priority => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Support Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Support Type</Label>
                  <Select 
                    value={filters.supportType} 
                    onValueChange={(value) => handleFilterChange('supportType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">All Types</SelectItem>
                      {filterOptions.supportTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Consultant Filter - Only for Admin */}
                {userRole === 'admin' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Consultant</Label>
                    <Select 
                      value={filters.consultant} 
                      onValueChange={(value) => handleFilterChange('consultant', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Consultants" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="all">All Consultants</SelectItem>
                        {filterOptions.consultants.map(consultant => (
                          <SelectItem key={consultant} value={consultant}>
                            {consultant}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Payment Status Filter - Hidden for consultants */}
                {userRole !== 'consultant' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Payment Status</Label>
                    <Select 
                      value={filters.paymentStatus} 
                      onValueChange={(value) => handleFilterChange('paymentStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Payment" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="all">All Payment</SelectItem>
                        {filterOptions.paymentStatuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <Select 
                    value={filters.dateRange} 
                    onValueChange={(value) => handleFilterChange('dateRange', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">Last 3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {Object.entries(filters).map(([key, value]) => {
                      if (value === 'all') return null;
                      return (
                        <Badge key={key} variant="secondary" className="flex items-center gap-1">
                          {key === 'supportType' ? 'Type' : key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                          <button
                            onClick={() => handleFilterChange(key, 'all')}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTickets && filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col h-full cursor-pointer"
                onClick={() => {
                  setSelectedTicket(ticket);
                  setIsDialogOpen(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{ticket.orderNumber || ticket.srIdentifier || `Ticket #${ticket.id.substring(0, 8)}`}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      {/* Quick Status Update for Consultants/Admins/Customers with available options */}
                      {(() => {
                        const ticketFilteredOptions = getFilteredStatusOptions(ticket.status);
                        const canUpdateTicketStatus = ticketFilteredOptions.length > 0 && (userRole === 'consultant' || userRole === 'admin' || userRole === 'customer');
                        
                        return canUpdateTicketStatus ? (
                          <Select
                            value={ticket.status}
                            onValueChange={(newStatus) => handleQuickStatusUpdate(ticket.id, newStatus, ticket.status)}
                          >
                            <SelectTrigger className="w-auto h-6 text-xs border-none bg-transparent p-0 focus:ring-0 focus:ring-offset-0">
                              <Badge variant={getStatusVariant(ticket.status)} className="text-xs cursor-pointer hover:bg-opacity-80">
                                {(userRole === 'consultant' && ticket.status === 'Paid' ? 'Closed' : ticket.status).replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent className="min-w-[200px] z-[10000]">
                              {ticketFilteredOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${option.color}`} />
                                    <span>{option.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getStatusVariant(ticket.status === 'Paid' ? 'Closed' : ticket.status)} className="text-xs">
                            {(ticket.status === 'Paid' ? 'Closed' : ticket.status).replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <CardDescription>{ticket.supportTypeName}</CardDescription>
                    {ticket.priority && (
                      <div className="flex items-center space-x-1 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>Priority: {ticket.priority}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      {ticket.consultantName && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span className="truncate">{ticket.consultantName}</span>
                        </div>
                      )}
                    </div>
                    
                    {ticket.description && (
                      <div className="group">
                        <p className="text-sm text-muted-foreground line-clamp-2 group-hover:bg-muted/30 rounded transition-colors duration-200 relative">
                          {ticket.description}
                          {ticket.description.length > 120 && (
                            <span className="inline-flex ml-1 items-center text-xs text-primary">
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {/* Rating Display */}
                    {(ticket.status === 'Closed' || ticket.status === 'TopicClosed' || ticket.status === 'Paid') && (
                      <div className="space-y-2">
                        <TicketRatingPreview ticketId={ticket.id} />
                        {userRole === 'customer' && (
                          <div className="flex items-center space-x-1 text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/20 rounded px-2 py-1 whitespace-nowrap">
                            <Star className="w-3 h-3" />
                            <span>Click "View & Rate" to rate your consultant</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons - Always at bottom */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                    {featureFlags?.messagingEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/messages?orderId=${ticket.id}`);
                        }}
                        className="flex-1 min-w-0"
                      >
                        <MessageSquare className="w-4 h-4 sm:hidden" />
                        <span className="sm:hidden">Message</span>
                        <MessageSquare className="w-4 h-4 hidden sm:inline mr-1" />
                        <span className="hidden sm:inline">Message</span>
                      </Button>
                    )}

                    {/* Payment status button - shows "Paid" when payment is completed */}
                    {ticket.paymentStatus === 'Paid' && ticket.calculatedAmount > 0 && userRole !== 'consultant' && (
                      <Button
                        variant="default"
                        size="sm"
                        disabled
                        className="flex-1 min-w-0 bg-green-600 hover:bg-green-600 cursor-not-allowed"
                      >
                        <span className="w-4 h-4 sm:hidden">✓</span>
                        <span className="sm:hidden">Paid</span>
                        <span className="w-4 h-4 hidden sm:inline mr-1">✓</span>
                        <span className="hidden sm:inline">Paid</span>
                      </Button>
                    )}

                    {/* Payment button for customers when ticket is closed and payment is pending */}
                    {(() => {
                      const shouldShow = userRole === 'customer' && (ticket.status === 'Closed' || ticket.status === 'Paid') && ticket.paymentStatus !== 'Paid' && ticket.calculatedAmount >= 0;
                        console.log('Pay Now button debug:', {
                        userRole,
                        ticketStatus: ticket.status,
                        paymentStatus: ticket.paymentStatus,
                        calculatedAmount: ticket.calculatedAmount,
                        shouldShow
                      });
                      return shouldShow;
                    })() && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePayment(ticket);
                        }}
                        disabled={processingTicketId !== null}
                        className="flex-1 min-w-0 bg-green-600 hover:bg-green-700"
                      >
                        <span className="w-4 h-4 sm:hidden">₹</span>
                        <span className="sm:hidden">{processingTicketId === ticket.id ? 'Processing...' : 'Pay'}</span>
                        <span className="w-4 h-4 hidden sm:inline mr-1">₹</span>
                        <span className="hidden sm:inline">{processingTicketId === ticket.id ? 'Processing...' : 'Pay Now'}</span>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTicketClick(ticket);
                      }}
                      className="flex-1 min-w-0"
                    >
                      {/* <Star className="w-4 h-4 mr-1" /> */}
                      <Eye className="w-4 h-4 sm:hidden" />
                      <span className="sm:hidden">{userRole === 'customer' ? 'View' : 'Details'}</span>
                      <span className="hidden sm:inline">{userRole === 'customer' ? 'View & Rate' : 'Details'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery 
                ? 'No tickets match your search' 
                : hasActiveFilters 
                ? 'No tickets match your filters' 
                : 'No tickets found'
              }
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? `No tickets found matching "${searchQuery}". Try a different search term.`
                : hasActiveFilters
                ? 'Try adjusting your filter criteria or clear all filters to see more tickets.'
                : (userRole === 'customer' 
                    ? "You haven't created any support tickets yet."
                    : "No tickets are currently assigned to you."
                  )
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchParams({})}
                >
                  Clear Search
                </Button>
              )}
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
              {!searchQuery && !hasActiveFilters && userRole === 'customer' && (
                <Button onClick={() => navigate('/support')}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create your first ticket
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ticket Management Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6 z-[9999]">
          <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>{userRole === 'customer' ? 'Ticket Details & Rating' : 'Manage Ticket'}</span>
        </DialogTitle>
        <DialogDescription>
          {userRole === 'customer' 
            ? 'View your support request details and rate your consultant\'s service'
            : 'Update ticket status, manage ratings, and handle support request details'
          }
        </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
        <Tabs defaultValue="details" className="w-full ticket-tabs">
          {(() => {
            const filteredOptions = getFilteredStatusOptions(selectedTicket.status);
            const canUpdateStatus = filteredOptions.length > 0 && (userRole === 'consultant' || userRole === 'admin' || userRole === 'customer');
            const tabCount = canUpdateStatus ? 4 : 3;
            
            return (
              <TabsList className={`grid w-full ${canUpdateStatus ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-1 sm:gap-2 p-1`}>
                <TabsTrigger value="details" className="flex-1 min-w-0 px-2 sm:px-4 py-2 text-center">
                  <span className="truncate text-xs sm:text-sm">
                    <span className="hidden sm:inline">Ticket </span>Details
                  </span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 min-w-0 px-2 sm:px-4 py-2 text-center">
                  <span className="truncate text-xs sm:text-sm">
                    <span className="hidden sm:inline">Status </span>History
                  </span>
                </TabsTrigger>
                {canUpdateStatus && (
                  <TabsTrigger value="status" className="flex-1 min-w-0 px-2 sm:px-4 py-2 text-center">
                    <span className="truncate text-xs sm:text-sm">
                      {userRole === 'customer' ? (
                        <><span className="hidden sm:inline">Re</span>open</>
                      ) : (
                        <><span className="hidden sm:inline">Status </span>Manage</>
                      )}
                    </span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="ratings" className="flex-1 min-w-0 px-2 sm:px-4 py-2 text-center">
                  <span className="truncate text-xs sm:text-sm">
                    {userRole === 'customer' ? (
                      <><span className="hidden sm:inline">Rate </span>Consultant</>
                    ) : (
                      <><span className="hidden sm:inline">Ratings & </span>Feedback</>
                    )}
                  </span>
                </TabsTrigger>
              </TabsList>
            );
          })()}
          
          <TabsContent value="details" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
            {/* Ticket Details */}
            <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex flex-col">
                <span className="break-all sm:break-normal">{selectedTicket.orderNumber}</span>
                {selectedTicket.srIdentifier && (
                  <span className="text-sm text-muted-foreground font-normal">SR Ref: {selectedTicket.srIdentifier}</span>
                )}
              </div>
              <Badge variant={getStatusVariant(selectedTicket.status)} className="self-start sm:self-center">
                {selectedTicket.status.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm">{selectedTicket.supportTypeName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground text-xs sm:text-sm">Created:</span>
                <p className="text-sm break-words">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground text-xs sm:text-sm">Priority:</span>
                <p className="text-sm">{selectedTicket.priority || 'Normal'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground text-xs sm:text-sm">Customer:</span>
                <p className="text-sm break-words">{selectedTicket.createdByName || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground text-xs sm:text-sm">Consultant:</span>
                <p className="text-sm break-words">{selectedTicket.consultantName || 'Unassigned'}</p>
              </div>
              {selectedTicket.calculatedAmount > 0 && userRole !== 'consultant' && (
                <div className="space-y-1">
                  <span className="font-medium text-muted-foreground text-xs sm:text-sm">Payment:</span>
                  <p className="text-sm">
                    {selectedTicket.paymentStatus === 'Paid' ? (
                      <span className="text-green-600 font-medium">✓ Completed</span>
                    ) : (
                      <span className="text-orange-600">Pending: ₹{selectedTicket.calculatedAmount?.toFixed(2)}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
            
            {selectedTicket?.description && (
              <div className="space-y-2">
                <span className="font-medium text-muted-foreground text-xs sm:text-sm">Description:</span>
                <div className="text-sm bg-muted/20 rounded p-2 sm:p-3">
                  <TruncatedText 
                    text={selectedTicket.description} 
                    maxLength={150}
                    className="text-sm leading-relaxed"
                    expandButtonClassName="h-6 px-2 py-1 text-xs mt-2"
                    showMoreText="Show More"
                    showLessText="Show Less"
                  />
                </div>
              </div>
            )}
          </CardContent>
            </Card>

            {/* Work Summary - Show for completed tickets */}
            {/* <WorkSummary 
              ticket={{
                status: selectedTicket.status,
                consultantName: selectedTicket.consultantName || 'Unknown',
                hoursWorked: selectedTicket.hoursWorked,
                hourlyRateAtCompletion: selectedTicket.hourlyRateAtCompletion,
                calculatedAmount: selectedTicket.calculatedAmount,
                consultantHourlyRate: selectedTicket.consultantHourlyRate
              }}
              userRole={userRole}
            /> */}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
            {/* Status History */}
            <StatusHistory orderId={selectedTicket.id} />
          </TabsContent>
          
          {(() => {
            const filteredOptions = getFilteredStatusOptions(selectedTicket.status);
            const canUpdateStatus = filteredOptions.length > 0 && (userRole === 'consultant' || userRole === 'admin' || userRole === 'customer');
            
            return canUpdateStatus && (
              <TabsContent value="status" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
                {/* Status Management */}
                <TicketStatusUpdater
                  orderId={selectedTicket.id}
                  currentStatus={selectedTicket.status}
                  onStatusUpdate={(newStatus) => handleStatusUpdate(selectedTicket.id, newStatus)}
                  allowedStatusOptions={filteredOptions.map(option => ({
                    ...option,
                    textColor: 'text-white',
                    bgColor: option.color || 'bg-gray-500',
                  }))}
                  userRole={userRole}
                />
              </TabsContent>
            );
          })()}
          
          <TabsContent value="ratings" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
            {/* Rating Management */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{userRole === 'customer' ? 'Rate Your Consultant' : 'Ratings & Feedback'}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {userRole === 'customer' 
                    ? 'Share your experience and rate your consultant\'s performance'
                    : 'View and manage customer ratings for consultant performance'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
            <TicketRatingContainer
              orderId={selectedTicket.id}
              consultantId={selectedTicket.consultantId || ''}
              createdByUserId={selectedTicket.createdByUserId || selectedTicket.customerId || ''}
              ticketStatus={selectedTicket.status}
              onRatingSubmitted={() => {
            toast.success('Rating submitted successfully');
            refetch();
              }}
            />
          </CardContent>
            </Card>
          </TabsContent>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-between pt-4 sm:pt-6 border-t space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {featureFlags?.messagingEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDialogOpen(false);
                    navigate(`/messages?orderId=${selectedTicket.id}`);
                  }}
                  className="w-full sm:w-auto"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Open </span>Messages
                </Button>
              )}
            </div>
            
            {/* Payment Button for Customers */}
            {userRole === 'customer' && selectedTicket && 
             (selectedTicket.status === 'Closed' || selectedTicket.status === 'TopicClosed' || selectedTicket.status === 'Paid') && 
             selectedTicket.paymentStatus !== 'Paid' && selectedTicket.calculatedAmount >= 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handlePayment(selectedTicket)}
                disabled={processingTicketId !== null}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                <span className="w-4 h-4 mr-1">₹</span>
                {processingTicketId === selectedTicket.id ? 'Processing...' : `Pay ₹${selectedTicket.calculatedAmount?.toFixed(2)} (${selectedTicket.hoursWorked}h)`}
              </Button>
            )}
            
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </div>
        </Tabs>
        )}
        </DialogContent>
      </Dialog>

      {/* Status Change Comment Dialog */}
      <Dialog open={statusChangeDialog.open} onOpenChange={(open) => !open && setStatusChangeDialog({ open: false, ticketId: '', newStatus: '', oldStatus: '', consultantHourlyRate: null })}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] z-[9999]">
          <DialogHeader>
            <DialogTitle>Update Ticket Status</DialogTitle>
            <DialogDescription>
              Changing status from <Badge variant="outline" className="mx-1">{statusChangeDialog.oldStatus}</Badge> 
              to <Badge variant="outline" className="mx-1">{statusChangeDialog.newStatus}</Badge>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Hours Worked Input for Completion Status */}
            {(() => {
              const { newStatus, oldStatus, consultantHourlyRate } = statusChangeDialog;
              const isCompletionStatus = newStatus === 'Completed' || newStatus === 'Closed' || newStatus === 'TopicClosed';
              const isTransitioningToCompletion = isCompletionStatus && oldStatus !== newStatus && userRole === 'consultant';
              
              if (!isTransitioningToCompletion) return null;
              
              return (
                <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                    <Clock className="w-4 h-4" />
                    <Label className="text-sm font-medium">Hours Worked *</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="24"
                      placeholder="Enter hours worked"
                      value={dialogHoursWorked}
                      onChange={(e) => setDialogHoursWorked(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-blue-600">
                      Enter the total hours spent working on this ticket
                    </p>
                  </div>
                </div>
              );
            })()}

            <div>
              <Label htmlFor="status-comment">Add a comment (optional)</Label>
              <div className="text-xs text-muted-foreground mb-2 flex items-start space-x-1">
                <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                <span>This comment will be visible to both you and the customer in the ticket history</span>
              </div>
              
              {/* Quick comment templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                {[
                  "Investigation completed, ready for implementation",
                  "Waiting for customer confirmation",
                  "Issue resolved, monitoring for 24 hours",
                  "Requires system maintenance window",
                  "Escalating to specialist team"
                ].map((template) => (
                  <Button
                    key={template}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-2 justify-start truncate w-full"
                    onClick={() => setStatusComment(template)}
                  >
                    {template}
                  </Button>
                ))}
              </div>
              
              <Textarea
                id="status-comment"
                placeholder="Explain why you're changing the status... (e.g., 'Waiting for system maintenance window' or 'Issue resolved after applying patch')"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                rows={3}
                className="mt-2"
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {statusComment.length}/1000 characters
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusChangeDialog({ open: false, ticketId: '', newStatus: '', oldStatus: '', consultantHourlyRate: null });
                  setDialogHoursWorked('');
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmStatusChange}
                disabled={(() => {
                  const { newStatus, oldStatus } = statusChangeDialog;
                  const isCompletionStatus = newStatus === 'Completed' || newStatus === 'Closed' || newStatus === 'TopicClosed';
                  const isTransitioningToCompletion = isCompletionStatus && oldStatus !== newStatus && userRole === 'consultant';
                  return isTransitioningToCompletion && (!dialogHoursWorked || parseFloat(dialogHoursWorked) <= 0);
                })()}
                className="w-full sm:w-auto"
              >
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Tickets;