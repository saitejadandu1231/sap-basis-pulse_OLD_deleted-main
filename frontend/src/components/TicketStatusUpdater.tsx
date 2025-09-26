import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useUpdateTicketStatus } from '@/hooks/useSupport';
import { useCreatePaymentOrderOnClose } from '@/hooks/usePayments';
import { toast } from 'sonner';
import { ArrowRight, MessageSquare, CheckCircle } from 'lucide-react';

interface TicketStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate?: (newStatus: string) => void;
}

const statusOptions = [
  { 
    value: 'New', 
    label: 'New', 
    color: 'bg-blue-500', 
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    description: 'Just submitted'
  },
  { 
    value: 'InProgress', 
    label: 'In Progress', 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    description: 'Being worked on'
  },
  { 
    value: 'PendingCustomerAction', 
    label: 'Pending Customer Action', 
    color: 'bg-orange-500', 
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    description: 'Waiting for customer'
  },
  { 
    value: 'TopicClosed', 
    label: 'Topic Closed', 
    color: 'bg-green-500', 
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    description: 'Issue resolved'
  },
  { 
    value: 'Closed', 
    label: 'Closed', 
    color: 'bg-muted', 
    textColor: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    description: 'Ticket closed'
  },
  { 
    value: 'ReOpened', 
    label: 'Re-Opened', 
    color: 'bg-purple-500', 
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    description: 'Reopened for review'
  }
];

const TicketStatusUpdater: React.FC<TicketStatusUpdaterProps> = ({
  orderId,
  currentStatus,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus);
  const [comment, setComment] = React.useState('');
  const updateStatus = useUpdateTicketStatus();
  const createOrderOnClose = useCreatePaymentOrderOnClose();

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus && !comment.trim()) {
      toast.info('Please change the status or add a comment');
      return;
    }

    try {
      await updateStatus.mutateAsync({
        orderId,
        status: selectedStatus as any,
        comment: comment.trim() || undefined
      });

      // If consultant closed the ticket, trigger create-order-on-close
      if ((selectedStatus === 'Closed' || selectedStatus === 'TopicClosed') && createOrderOnClose) {
        try {
          await createOrderOnClose.mutateAsync({ orderId });
          toast.success('Created payment order for this ticket. Customer will be asked to pay.');
        } catch (err) {
          console.error('Failed to create payment order on close:', err);
          toast.error('Status updated but failed to create payment order. Please retry from admin panel.');
        }
      }

      toast.success('Ticket status updated successfully');
      setComment(''); // Clear comment after successful update
      onStatusUpdate?.(selectedStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const getCurrentStatusInfo = () => {
    return statusOptions.find(opt => opt.value === currentStatus) || statusOptions[0];
  };

  const getSelectedStatusInfo = () => {
    return statusOptions.find(opt => opt.value === selectedStatus) || statusOptions[0];
  };

  const isStatusChanged = selectedStatus !== currentStatus;
  const hasComment = comment.trim().length > 0;
  const canUpdate = isStatusChanged || hasComment;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      {/* Status Change Section */}
      <div className="space-y-4">
        {/* Current vs New Status Display */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/50 rounded-lg space-y-3 sm:space-y-0">
          <div className="flex flex-col items-center space-y-2 min-w-0">
            <Label className="text-xs font-medium text-muted-foreground">Current Status</Label>
            <Badge 
              variant="secondary" 
              className={`${getCurrentStatusInfo().bgColor} ${getCurrentStatusInfo().textColor} border-0 font-medium px-3 py-1 text-center w-full sm:w-auto`}
            >
              {getCurrentStatusInfo().label}
            </Badge>
          </div>
          
          {isStatusChanged && (
            <div className="flex items-center justify-center px-4 sm:px-4">
              <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90 sm:rotate-0" />
            </div>
          )}
          
          {isStatusChanged && (
            <div className="flex flex-col items-center space-y-2 min-w-0">
              <Label className="text-xs font-medium text-muted-foreground">New Status</Label>
              <Badge 
                className={`${getSelectedStatusInfo().bgColor} ${getSelectedStatusInfo().textColor} border-0 font-medium px-3 py-1 text-center w-full sm:w-auto`}
              >
                {getSelectedStatusInfo().label}
              </Badge>
            </div>
          )}
        </div>

        {/* Status Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select New Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Choose a status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="py-3">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-3 h-3 rounded-full ${option.color}`} />
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comment Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Add Comment</Label>
          <span className="text-xs text-muted-foreground">(Optional)</span>
        </div>
        
        {/* Quick Comment Templates */}
        {isStatusChanged && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Quick Templates</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 text-xs justify-start truncate w-full"
                onClick={() => setComment("Investigation completed, issue has been resolved. Please verify the fix.")}
              >
                Investigation completed
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 text-xs justify-start truncate w-full"
                onClick={() => setComment("Waiting for customer confirmation before proceeding with the next steps.")}
              >
                Waiting for customer conf.
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 text-xs justify-start truncate w-full"
                onClick={() => setComment("Issue resolved, monitoring the system to ensure stability.")}
              >
                Issue resolved, monitoring
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 text-xs justify-start truncate w-full"
                onClick={() => setComment("Requires system maintenance window to implement the fix safely.")}
              >
                Requires system maintenance
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 text-xs justify-start truncate w-full"
                onClick={() => setComment("Escalating to specialist team for advanced technical analysis.")}
              >
                Escalating to specialist
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 text-xs justify-start truncate w-full"
                onClick={() => setComment("Working on your request. Will update you with progress soon.")}
              >
                Working on request
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Textarea
            placeholder="Explain why you're changing the status... (e.g., 'Waiting for system maintenance window' or 'Issue resolved after applying patch')"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] w-full"
          />
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
            <p className="text-xs text-muted-foreground">
              This comment will be visible to both you and the customer in the ticket history
            </p>
            <span className="text-xs text-muted-foreground/70">
              {comment.length}/1000 characters
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button 
        onClick={handleStatusUpdate}
        disabled={updateStatus.isPending || !canUpdate}
        className="w-full h-11 font-medium"
        size="lg"
      >
        {updateStatus.isPending ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Updating...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>
              {isStatusChanged && hasComment ? 'Update Status & Add Comment' :
               isStatusChanged ? 'Update Status' :
               hasComment ? 'Add Comment' : 'No Changes to Save'}
            </span>
          </div>
        )}
      </Button>
    </div>
  );
};

export default TicketStatusUpdater;
