
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRecentTickets } from "@/hooks/useSupport";
import { Clock, Ticket } from "lucide-react";

const RecentTickets = () => {
  const { data: tickets, isLoading, error } = useRecentTickets();

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
          {tickets.map((ticket) => (
            <div key={ticket.id} className="border border-muted/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {ticket.srIdentifier || 'SR-' + ticket.id.substring(0, 8)}
                </div>
                <Badge variant={
                  ticket.status === 'New' ? 'secondary' :
                  ticket.status === 'InProgress' ? 'default' :
                  ticket.status === 'Closed' ? 'outline' : 'secondary'
                }>
                  {ticket.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {ticket.supportTypeName || 'Unknown Type'}
              </div>
              <div className="text-sm">
                {ticket.description.length > 100 
                  ? `${ticket.description.substring(0, 100)}...` 
                  : ticket.description}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTickets;
