
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecentTickets, useTicketRatings } from "@/hooks/useSupport";
import { Clock, Ticket, Settings, Star, MessageSquare, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CompactTicketStatusUpdater from "./CompactTicketStatusUpdater";
import TicketRatingContainer from "./TicketRatingContainer";
import { useCreateConversation, useConversationByOrder } from "@/services/messagingHooks";
import { useMessagingEnabled } from "@/hooks/useFeatureFlags";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const RecentTickets = () => {
  const { data: tickets, isLoading, error } = useRecentTickets();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const createConversation = useCreateConversation();
  const { isEnabled: messagingEnabled } = useMessagingEnabled();

  // Debug logging
  useEffect(() => {
    console.log('RecentTickets Debug:', {
      messagingEnabled,
      userRole: user?.role,
      ticketsCount: tickets?.length,
      tickets: tickets?.map(t => ({
        id: t.id,
        hasConversation: t.hasConversation,
        conversationId: t.conversationId,
        unreadMessageCount: t.unreadMessageCount
      }))
    });
  }, [messagingEnabled, user?.role, tickets]);

  // Debug logging
  console.log('RecentTickets Debug:', { 
    userRole: user?.role, 
    messagingEnabled, 
    ticketsCount: tickets?.length,
    tickets: tickets?.map(t => ({ 
      id: t.id, 
      hasConversation: t.hasConversation, 
      conversationId: t.conversationId 
    }))
  });

  const toggleTicketExpansion = (ticketId: string) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedTickets(newExpanded);
  };

  const handleStartConversation = async (ticket: any) => {
    try {
      const subject = `Support: ${ticket.srIdentifier || 'SR-' + ticket.id.substring(0, 8)} - ${ticket.supportTypeName || 'Support Request'}`;
      const initialMessage = `Hi, I need assistance with my support request:\n\nTicket ID: ${ticket.srIdentifier || 'SR-' + ticket.id.substring(0, 8)}\nType: ${ticket.supportTypeName || 'N/A'}\nStatus: ${ticket.status}\n\nDescription: ${ticket.description}\n\nPlease let me know how we can proceed. Thank you!`;
      
      const conversation = await createConversation.mutateAsync({
        orderId: ticket.id,
        subject,
        initialMessage
      });
      toast.success('Conversation started successfully');
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (error) {
      toast.error('Failed to start conversation');
      console.error('Error starting conversation:', error);
    }
  };

  const handleViewConversation = (conversationId: string) => {
    navigate(`/messages?conversation=${conversationId}`);
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ticket className="w-5 h-5" />
            <span>Recent Support Tickets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">Loading tickets...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ticket className="w-5 h-5" />
            <span>Recent Support Tickets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Unable to load tickets
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ticket className="w-5 h-5" />
            <span>Recent Support Tickets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No support tickets found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Ticket className="w-5 h-5" />
          <span>Recent Support Tickets</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const isExpanded = expandedTickets.has(ticket.id);
            const canUpdateStatus = user?.role === 'consultant' || user?.role === 'admin';
            
            return (
              <div key={ticket.id} className="border border-muted/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {ticket.srIdentifier || 'SR-' + ticket.id.substring(0, 8)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      ticket.status === 'New' ? 'secondary' :
                      ticket.status === 'In Progress' ? 'default' :
                      ticket.status === 'Closed' ? 'outline' : 
                      ticket.status === 'PendingCustomerAction' ? 'destructive' :
                      ticket.status === 'TopicClosed' ? 'outline' :
                      ticket.status === 'ReOpened' ? 'secondary' : 'secondary'
                    }>
                      {ticket.status === 'PendingCustomerAction' ? 'Pending Customer' : ticket.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {canUpdateStatus && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTicketExpansion(ticket.id)}
                          className="h-6 w-6 p-0"
                          title="Manage ticket"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTicketExpansion(ticket.id)}
                        className="h-6 w-6 p-0"
                        title="View ratings"
                      >
                        <Star className="w-3 h-3" />
                      </Button>
                      {/* Conversation button - only show if messaging is enabled */}
                      {messagingEnabled && (
                        ticket.hasConversation ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewConversation(ticket.conversationId!)}
                            className="h-6 w-6 p-0 relative"
                            title="View conversation"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {ticket.unreadMessageCount > 0 && (
                              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center">
                                {ticket.unreadMessageCount > 9 ? '9+' : ticket.unreadMessageCount}
                              </Badge>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartConversation(ticket)}
                            className="h-6 w-6 p-0"
                            title="Start conversation"
                            disabled={createConversation.isPending}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {ticket.supportTypeName || 'Unknown Type'}
                </div>
                
                <div className="text-sm">
                  {ticket.description.length > 100 
                    ? `${ticket.description.substring(0, 100)}...` 
                    : ticket.description}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                  {user?.role === 'consultant' && ticket.consultantName && (
                    <div className="text-xs text-muted-foreground">
                      Assigned to: {ticket.consultantName}
                    </div>
                  )}
                </div>
                
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-muted/20 space-y-4">
                    {canUpdateStatus && (
                      <CompactTicketStatusUpdater
                        orderId={ticket.id}
                        currentStatus={ticket.status}
                        onStatusUpdate={(newStatus) => {
                          // Optionally close the expanded view after update
                          setExpandedTickets(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(ticket.id);
                            return newSet;
                          });
                        }}
                      />
                    )}
                    
                    <TicketRatingContainer
                      orderId={ticket.id}
                      consultantId={ticket.consultantId}
                      createdByUserId={ticket.createdByUserId}
                      ticketStatus={ticket.status}
                      onRatingSubmitted={() => {
                        // Optional: refresh the ticket data
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTickets;
