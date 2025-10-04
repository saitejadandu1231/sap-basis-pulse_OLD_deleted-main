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
  Calendar
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
    const todaySlotsFiltered = allSlots.filter((slot: any) => {
      const slotDate = new Date(slot.slotStartTime).toDateString();
      return slotDate === today.toDateString();
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
    if (!tickets) return { total: 0, open: 0, inProgress: 0, closed: 0 };
    
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'New').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      closed: tickets.filter(t => t.status === 'Closed').length
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
        {userRole === 'consultant' && (
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
        )}
      </div>

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
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={ticket.status === 'Closed' ? 'default' : 'secondary'}>
                        {ticket.status}
                      </Badge>
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