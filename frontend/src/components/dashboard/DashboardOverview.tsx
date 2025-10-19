import { useAuth } from '@/contexts/AuthContext';
import { useUnreadMessageCount } from '@/services/messagingHooks';
import { useRecentTickets } from '@/hooks/useSupport';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { 
  MessageSquare, 
  Ticket, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import QuickActions from './QuickActions';
import ConsultantSettings from './ConsultantSettings';

const DashboardOverview = () => {
  const { user, userRole } = useAuth();
  const { data: unreadCount } = useUnreadMessageCount();
  const { data: tickets } = useRecentTickets();
  const { data: featureFlags } = useFeatureFlags();
  const navigate = useNavigate();

  // Get today's date for consultant slots
  const today = new Date();

  // Fetch all consultant slots (not filtered by date)
  const { data: allSlots } = useQuery({
    queryKey: ['consultant-all-slots', user?.id],
    queryFn: async () => {
      if (!user?.id || userRole !== 'consultant') return [];
      const response = await apiFetch(`ConsultantAvailability/consultant/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch consultant slots');
      }
      return response.json();
    },
    enabled: !!user?.id && userRole === 'consultant',
  });

  const getTodaySlotsStats = () => {
    if (!allSlots) return { total: 0, upcoming: 0 };

    const now = new Date();
    // Fix: Use UTC date components for consistent comparison across timezones
    const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    
    const todaySlotsFiltered = allSlots.filter((slot: any) => {
      const slotStartTime = new Date(slot.slotStartTime);
      const slotUTCDate = new Date(slotStartTime.getUTCFullYear(), slotStartTime.getUTCMonth(), slotStartTime.getUTCDate());
      return slotUTCDate.toDateString() === todayUTC.toDateString();
    });

    const upcoming = todaySlotsFiltered.filter((slot: any) => {
      const slotStart = new Date(slot.slotStartTime);
      return slotStart > now && slot.isBooked;
    }).length;

    return {
      total: todaySlotsFiltered.length,
      upcoming
    };
  };

  const todayStats = getTodaySlotsStats();

  const getTicketStats = () => {
    if (!tickets) return { total: 0, open: 0, inProgress: 0, closed: 0, totalEarnings: 0, completedTicketsWithEarnings: 0 };
    
    const completedTickets = tickets.filter(t => (t.status === 'Closed' || t.status === 'TopicClosed') && t.calculatedAmount);
    const totalEarnings = completedTickets.reduce((sum, ticket) => sum + (ticket.calculatedAmount || 0), 0);
    
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'New').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      closed: tickets.filter(t => t.status === 'Closed').length,
      totalEarnings,
      completedTicketsWithEarnings: completedTickets.length
    };
  };

  const stats = getTicketStats();

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Messages Card */}
        {featureFlags?.messagingEnabled && (
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/messages')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {unreadCount === 1 ? 'Unread message' : 'Unread messages'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Active Tickets */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tickets')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open + stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {stats.open} new, {stats.inProgress} in progress
            </p>
          </CardContent>
        </Card>

        {/* Total Tickets */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tickets')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.closed} resolved
            </p>
          </CardContent>
        </Card>

        {/* Role-specific metric */}
        {userRole === 'consultant' ? (
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/consultant/availability')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Slots</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {todayStats.upcoming} upcoming appointments
              </p>
            </CardContent>
          </Card>
        ) : userRole === 'customer' ? (
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tickets')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Work</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.closed}</div>
              <p className="text-xs text-muted-foreground">
                tickets resolved
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Consultant Earnings Summary */}
      {/* {userRole === 'consultant' && stats.totalEarnings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Earnings Summary</span>
            </CardTitle>
            <CardDescription>
              Your earnings from completed work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">Total Earnings</span>
                </div>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">
                  From {stats.completedTicketsWithEarnings} completed tickets
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Avg per Ticket</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{stats.completedTicketsWithEarnings > 0 ? (stats.totalEarnings / stats.completedTicketsWithEarnings).toFixed(2) : '0.00'}
                </p>
                <p className="text-xs text-blue-600 mt-1">Average earnings</p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800 dark:text-purple-200">Work Rate</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.total > 0 ? Math.round((stats.completedTicketsWithEarnings / stats.total) * 100) : 0}%
                </p>
                <p className="text-xs text-purple-600 mt-1">Completion rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Customer Invoicing Summary */}
      {/* {userRole === 'customer' && stats.totalEarnings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span>Billing Summary</span>
            </CardTitle>
            <CardDescription>
              Your invoicing for completed consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Total Invoiced</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">₹{stats.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  For {stats.completedTicketsWithEarnings} completed consultations
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">Avg per Session</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ₹{stats.completedTicketsWithEarnings > 0 ? (stats.totalEarnings / stats.completedTicketsWithEarnings).toFixed(2) : '0.00'}
                </p>
                <p className="text-xs text-green-600 mt-1">Average consultation cost</p>
              </div>
            </div>
            
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 <strong>Billing Information:</strong> All amounts are calculated based on actual work hours 
                and current consultant rates. Detailed invoices are available in individual ticket details.
              </p>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <QuickActions />

        {/* Consultant Settings - Only for consultants */}
        {userRole === 'consultant' && (
          <Card>
            <CardHeader>
              <CardTitle>Consultant Settings</CardTitle>
              <CardDescription>
                Manage your consulting rates and availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConsultantSettings />
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates on your tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tickets && tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.slice(0, 4).map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className="flex items-center space-x-3 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tickets?ticket=${ticket.id}`)}
                  >
                    <div className="flex-shrink-0">
                      {ticket.status === 'Closed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : ticket.status === 'In Progress' ? (
                        <Clock className="w-5 h-5 text-blue-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {ticket.srIdentifier || `SR-${ticket.id.substring(0, 8)}`}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {ticket.supportTypeName}
                      </p>
                      {/* Show work completion info for closed tickets */}
                      {/* {(ticket.status === 'Closed' || ticket.status === 'TopicClosed') && ticket.calculatedAmount && (
                        <p className="text-xs text-green-600 font-medium">
                          {ticket.hoursWorked?.toFixed(1)}h × ₹{ticket.hourlyRateAtCompletion?.toFixed(2)} = ₹{ticket.calculatedAmount.toFixed(2)}
                        </p>
                      )} */}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={ticket.status === 'Closed' ? 'default' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                      {/* Show earnings indicator for completed tickets */}
                      {/* {(ticket.status === 'Closed' || ticket.status === 'TopicClosed') && ticket.calculatedAmount && (
                        <div className="flex items-center text-green-600">
                          <DollarSign className="w-3 h-3" />
                        </div>
                      )} */}
                    </div>
                  </div>
                ))}
                
                {tickets.length > 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/tickets')}
                    className="w-full mt-2"
                  >
                    View all tickets ({tickets.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                {userRole === 'customer' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/support')}
                    className="mt-2"
                  >
                    Create your first ticket
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;