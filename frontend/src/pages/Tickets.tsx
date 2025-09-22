import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRecentTickets, useUpdateTicketStatus, useTicketRatings } from '@/hooks/useSupport';
import PageLayout from '@/components/layout/PageLayout';
import TicketStatusUpdater from '@/components/TicketStatusUpdater';
import TicketRatingContainer from '@/components/TicketRatingContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Plus, Settings, User, Calendar, ChevronDown, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { toast } from 'sonner';

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
                : 'text-gray-300'
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
  const { userRole } = useAuth();
  const { data: tickets, isLoading, refetch } = useRecentTickets();
  const { data: featureFlags } = useFeatureFlags();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const updateTicketStatus = useUpdateTicketStatus();

  const statusOptions = [
    { value: 'New', label: 'New', color: 'bg-blue-500' },
    { value: 'InProgress', label: 'In Progress', color: 'bg-yellow-500' },
    { value: 'PendingCustomerAction', label: 'Pending Customer', color: 'bg-orange-500' },
    { value: 'TopicClosed', label: 'Topic Closed', color: 'bg-green-500' },
    { value: 'Closed', label: 'Closed', color: 'bg-gray-500' },
    { value: 'ReOpened', label: 'Re-Opened', color: 'bg-purple-500' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Closed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'InProgress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Closed':
        return 'default' as const;
      case 'InProgress':
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
    if (userRole === 'consultant' || userRole === 'admin') {
      setSelectedTicket(ticket);
      setIsDialogOpen(true);
    }
  };

  const handleStatusUpdate = (ticketId: string, newStatus: string) => {
    // Refresh tickets after status update
    refetch();
    setIsDialogOpen(false);
  };

  const handleQuickStatusUpdate = async (ticketId: string, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) {
      return;
    }

    try {
      await updateTicketStatus.mutateAsync({
        orderId: ticketId,
        status: newStatus as any
      });
      toast.success('Status updated successfully');
      refetch();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const canManageTicket = (ticket: any) => {
    return userRole === 'admin' || 
           (userRole === 'consultant' && ticket.consultantId === userRole); // You might need to add consultant ID check
  };

  return (
    <PageLayout
      title={userRole === 'admin' ? 'All Tickets' : 'My Tickets'}
      description={userRole === 'admin' ? 'Manage all support requests' : 'View and manage your support tickets'}
      actions={
        userRole === 'customer' ? (
          <Button onClick={() => navigate('/support')}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        ) : null
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{ticket.srIdentifier || `SR-${ticket.id.substring(0, 8)}`}</span>
                      {(userRole === 'consultant' || userRole === 'admin') && (
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      {/* Quick Status Update for Consultants/Admins */}
                      {(userRole === 'consultant' || userRole === 'admin') ? (
                        <Select 
                          value={ticket.status} 
                          onValueChange={(newStatus) => handleQuickStatusUpdate(ticket.id, newStatus, ticket.status)}
                        >
                          <SelectTrigger className="w-auto h-6 text-xs border-none bg-transparent p-0">
                            <Badge variant={getStatusVariant(ticket.status)} className="text-xs cursor-pointer hover:bg-opacity-80">
                              {ticket.status.replace(/([A-Z])/g, ' $1').trim()}
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Badge>
                          </SelectTrigger>
                          <SelectContent className="min-w-[200px]">
                            {statusOptions.map((option) => (
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
                        <Badge variant={getStatusVariant(ticket.status)} className="text-xs">
                          {ticket.status.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      )}
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
                <CardContent>
                  <div className="space-y-3">
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
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    )}
                    
                    {/* Rating Display */}
                    {(ticket.status === 'Closed' || ticket.status === 'TopicClosed') && (
                      <div className="space-y-2">
                        <TicketRatingPreview ticketId={ticket.id} />
                        {userRole === 'customer' && (
                          <div className="flex items-center space-x-1 text-xs text-purple-600 bg-purple-50 rounded px-2 py-1">
                            <Star className="w-3 h-3" />
                            <span>Click "View & Rate" to rate your consultant</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {featureFlags?.messagingEnabled && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/messages?orderId=${ticket.id}`);
                          }}
                          className="flex-1"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      )}
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTicketClick(ticket);
                        }}
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {userRole === 'customer' ? 'View & Rate' : 'Details'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tickets found</h3>
            <p className="text-muted-foreground mb-6">
              {userRole === 'customer' 
                ? "You haven't created any support tickets yet."
                : "No tickets are currently assigned to you."
              }
            </p>
            {userRole === 'customer' && (
              <Button onClick={() => navigate('/support')}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first ticket
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Ticket Management Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
        <Tabs defaultValue="details" className="w-full">
          <TabsList className={`grid w-full ${userRole === 'customer' ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <TabsTrigger value="details">Ticket Details</TabsTrigger>
            {(userRole === 'consultant' || userRole === 'admin') && (
              <TabsTrigger value="status">Status Management</TabsTrigger>
            )}
            <TabsTrigger value="ratings">
              {userRole === 'customer' ? 'Rate Consultant' : 'Ratings & Feedback'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Ticket Details */}
            <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{selectedTicket.srIdentifier || `SR-${selectedTicket.id.substring(0, 8)}`}</span>
              <Badge variant={getStatusVariant(selectedTicket.status)}>
            {selectedTicket.status.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            </CardTitle>
            <CardDescription>{selectedTicket.supportTypeName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
            <span className="font-medium text-muted-foreground">Created:</span>
            <p>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
              <div>
            <span className="font-medium text-muted-foreground">Priority:</span>
            <p>{selectedTicket.priority || 'Normal'}</p>
              </div>
              <div>
            <span className="font-medium text-muted-foreground">Customer:</span>
            <p>{selectedTicket.customerName || 'Unknown'}</p>
              </div>
              <div>
            <span className="font-medium text-muted-foreground">Consultant:</span>
            <p>{selectedTicket.consultantName || 'Unassigned'}</p>
              </div>
            </div>
            
            {selectedTicket.description && (
              <div>
            <span className="font-medium text-muted-foreground">Description:</span>
            <p className="mt-1 text-sm bg-muted/20 rounded p-3">{selectedTicket.description}</p>
              </div>
            )}
          </CardContent>
            </Card>
          </TabsContent>
          
          {(userRole === 'consultant' || userRole === 'admin') && (
            <TabsContent value="status" className="space-y-6 mt-6">
              {/* Status Management */}
              <TicketStatusUpdater
            orderId={selectedTicket.id}
            currentStatus={selectedTicket.status}
            onStatusUpdate={(newStatus) => handleStatusUpdate(selectedTicket.id, newStatus)}
              />
            </TabsContent>
          )}
          
          <TabsContent value="ratings" className="space-y-6 mt-6">
            {/* Rating Management */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>{userRole === 'customer' ? 'Rate Your Consultant' : 'Ratings & Feedback'}</span>
            </CardTitle>
            <CardDescription>
              {userRole === 'customer' 
                ? 'Share your experience and rate your consultant\'s performance'
                : 'View and manage customer ratings for consultant performance'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          <div className="flex justify-between pt-6 border-t">
            <div className="flex space-x-2">
              {featureFlags?.messagingEnabled && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    navigate(`/messages?orderId=${selectedTicket.id}`);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Open Messages
                </Button>
              )}
              
              {selectedTicket && (selectedTicket.status === 'Closed' || selectedTicket.status === 'TopicClosed') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Focus on ratings tab  
                    const ratingsTab = document.querySelector('[data-value="ratings"]') as HTMLButtonElement;
                    ratingsTab?.click();
                  }}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              )}
            </div>
            
            <Button 
              variant="secondary" 
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </Tabs>
        )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Tickets;