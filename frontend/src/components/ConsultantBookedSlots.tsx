import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConsultantBookedSlots } from "@/hooks/useConsultantAvailability";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, User, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface BookedSlot {
  id: string;
  consultantId: string;
  slotStartTime: string;
  slotEndTime: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  supportTypeName: string;
  supportCategoryName: string;
  priority: string;
  description: string;
  status: string;
  createdAt: string;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'in-progress':
    case 'inprogress':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return <AlertCircle className="w-3 h-3" />;
    case 'in-progress':
    case 'inprogress':
      return <Clock className="w-3 h-3" />;
    case 'completed':
      return <CheckCircle className="w-3 h-3" />;
    case 'cancelled':
      return <XCircle className="w-3 h-3" />;
    default:
      return <AlertCircle className="w-3 h-3" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ConsultantBookedSlots = () => {
  const { user } = useAuth();
  const { data: bookedSlots, isLoading, error } = useConsultantBookedSlots(user?.id);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-yuktor-500" />
            <span>My Booked Slots</span>
          </CardTitle>
          <CardDescription>Your upcoming scheduled consultations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="text-sm text-muted-foreground">Loading your booked slots...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-yuktor-500" />
            <span>My Booked Slots</span>
          </CardTitle>
          <CardDescription>Your upcoming scheduled consultations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-red-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">Failed to load booked slots</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-yuktor-500" />
          <span>My Booked Slots</span>
        </CardTitle>
        <CardDescription>
          Your upcoming scheduled consultations ({bookedSlots?.length || 0})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!bookedSlots || bookedSlots.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No booked slots found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your scheduled consultations will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {bookedSlots.map((slot: BookedSlot) => (
              <div
                key={slot.id}
                className="border rounded-lg p-4 hover:bg-background/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className={getStatusColor(slot.status)}>
                        {getStatusIcon(slot.status)}
                        <span className="ml-1 capitalize">{slot.status}</span>
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(slot.priority)}>
                        {slot.priority} Priority
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{slot.orderNumber}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {format(parseISO(slot.slotStartTime), 'MMM dd')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(parseISO(slot.slotStartTime), 'h:mm a')} - 
                        {format(parseISO(slot.slotEndTime), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{slot.customerName || slot.customerEmail}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <strong>Type:</strong> {slot.supportTypeName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Category:</strong> {slot.supportCategoryName}
                    </p>
                  </div>
                </div>

                {slot.description && (
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>Description:</strong> {slot.description.length > 100 
                        ? `${slot.description.substring(0, 100)}...` 
                        : slot.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsultantBookedSlots;