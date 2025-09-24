import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRecentTickets, useUpdateTicketStatus, useTicketRatings } from '@/hooks/useSupport';
import { useStatusOptions } from '@/hooks/useStatus';
import PageLayout from '@/components/layout/PageLayout';
import TicketStatusUpdater from '@/components/TicketStatusUpdater';
import TicketRatingContainer from '@/components/TicketRatingContainer';
import StatusHistory from '@/components/StatusHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Plus, Settings, User, Calendar, ChevronDown, Star, TrendingUp, ChevronUp, ChevronRight, Eye } from 'lucide-react';
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
  const { data: tickets, isLoading, refetch } = useRecentTickets();
  const { data: featureFlags } = useFeatureFlags();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState({ open: false, ticketId: '', newStatus: '', oldStatus: '' });
  const [statusComment, setStatusComment] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const updateTicketStatus = useUpdateTicketStatus();
  const { data: statusOptionsData } = useStatusOptions();

  // Transform API data to match component expectations with fallback to hardcoded options
  const statusOptions = statusOptionsData?.map(option => ({
    value: option.statusCode,
    label: option.statusName,
    color: option.colorCode
  })) || [
    { value: 'New', label: 'New', color: 'bg-blue-500' },
    { value: 'InProgress', label: 'In Progress', color: 'bg-yellow-500' },
    { value: 'PendingCustomerAction', label: 'Pending Customer', color: 'bg-orange-500' },
    { value: 'TopicClosed', label: 'Topic Closed', color: 'bg-green-500' },
    { value: 'Closed', label: 'Closed', color: 'bg-muted' },
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

    // Open comment dialog for status change
    setStatusChangeDialog({ open: true, ticketId, newStatus, oldStatus: currentStatus });
    setStatusComment('');
  };

  const confirmStatusChange = async () => {
    const { ticketId, newStatus } = statusChangeDialog;
    
    try {
      await updateTicketStatus.mutateAsync({
        orderId: ticketId,
        status: newStatus as any,
        comment: statusComment.trim() || undefined
      });
      toast.success('Status updated successfully');
      refetch();
      setStatusChangeDialog({ open: false, ticketId: '', newStatus: '', oldStatus: '' });
      setStatusComment('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const canManageTicket = (ticket: any) => {
    return userRole === 'admin' || 
           (userRole === 'consultant' && ticket.consultantId === user?.id); // Fixed incorrect comparison
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
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      {/* Quick Status Update for Consultants/Admins */}
                      {(userRole === 'consultant' || userRole === 'admin') ? (
                        <Select 
                          value={ticket.status} 
                          onValueChange={(newStatus) => handleQuickStatusUpdate(ticket.id, newStatus, ticket.status)}
                        >
                          <SelectTrigger className="w-auto h-6 text-xs border-none bg-transparent p-0 focus:ring-0 focus:ring-offset-0">
                            <Badge variant={getStatusVariant(ticket.status)} className="text-xs cursor-pointer hover:bg-opacity-80">
                              {ticket.status.replace(/([A-Z])/g, ' $1').trim()}
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
                        <Eye className="w-4 h-4 mr-2" />
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
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
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
          <TabsList className={`grid w-full text-xs sm:text-sm overflow-x-auto ${userRole === 'customer' ? 'grid-cols-3' : 'grid-cols-4'}`}>
            <TabsTrigger value="details" className="min-w-0 px-2 sm:px-4">
              <span className="truncate">
                <span className="hidden sm:inline">Ticket </span>Details
              </span>
            </TabsTrigger>
            <TabsTrigger value="history" className="min-w-0 px-2 sm:px-4">
              <span className="truncate">
                <span className="hidden sm:inline">Status </span>History
              </span>
            </TabsTrigger>
            {(userRole === 'consultant' || userRole === 'admin') && (
              <TabsTrigger value="status" className="min-w-0 px-2 sm:px-4">
                <span className="truncate">
                  <span className="hidden sm:inline">Status </span>Manage
                </span>
              </TabsTrigger>
            )}
            <TabsTrigger value="ratings" className="min-w-0 px-2 sm:px-4">
              <span className="truncate">
                {userRole === 'customer' ? (
                  <><span className="hidden sm:inline">Rate </span>Consultant</>
                ) : (
                  <><span className="hidden sm:inline">Ratings & </span>Feedback</>
                )}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
            {/* Ticket Details */}
            <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <span className="break-all sm:break-normal">{selectedTicket.srIdentifier || `SR-${selectedTicket.id.substring(0, 8)}`}</span>
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
          </TabsContent>
          
          <TabsContent value="history" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
            {/* Status History */}
            <StatusHistory orderId={selectedTicket.id} />
          </TabsContent>
          
          {(userRole === 'consultant' || userRole === 'admin') && (
            <TabsContent value="status" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
              {/* Status Management */}
              <TicketStatusUpdater
            orderId={selectedTicket.id}
            currentStatus={selectedTicket.status}
            onStatusUpdate={(newStatus) => handleStatusUpdate(selectedTicket.id, newStatus)}
              />
            </TabsContent>
          )}
          
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
                  <MessageSquare className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Open </span>Messages
                </Button>
              )}
              
              {selectedTicket && (selectedTicket.status === 'Closed' || selectedTicket.status === 'TopicClosed') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Focus on ratings tab  
                    const ratingsTab = document.querySelector('[data-value="ratings"]') as HTMLButtonElement;
                    ratingsTab?.click();
                  }}
                  className="w-full sm:w-auto"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">View </span>Analytics
                </Button>
              )}
            </div>
            
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
      <Dialog open={statusChangeDialog.open} onOpenChange={(open) => !open && setStatusChangeDialog({ open: false, ticketId: '', newStatus: '', oldStatus: '' })}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Ticket Status</DialogTitle>
            <DialogDescription>
              Changing status from <Badge variant="outline" className="mx-1">{statusChangeDialog.oldStatus}</Badge> 
              to <Badge variant="outline" className="mx-1">{statusChangeDialog.newStatus}</Badge>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
                onClick={() => setStatusChangeDialog({ open: false, ticketId: '', newStatus: '', oldStatus: '' })}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmStatusChange}
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