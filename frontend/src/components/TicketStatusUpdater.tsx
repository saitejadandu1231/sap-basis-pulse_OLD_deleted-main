import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useUpdateTicketStatus } from '@/hooks/useSupport';
import { useStatusOptions } from '@/hooks/useStatus';
import { toast } from 'sonner';
import { ArrowRight, MessageSquare, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface TicketStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate?: (newStatus: string) => void;
  allowedStatusOptions?: Array<{value: string; label: string; color: string; textColor: string; bgColor: string; description: string}>;
  userRole?: string;
  consultantHourlyRate?: number | null;
}

const TicketStatusUpdater: React.FC<TicketStatusUpdaterProps> = ({
  orderId,
  currentStatus,
  onStatusUpdate,
  allowedStatusOptions,
  userRole,
  consultantHourlyRate
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus);
  const [comment, setComment] = React.useState('');
  const [hoursWorked, setHoursWorked] = React.useState<string>('');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const updateStatus = useUpdateTicketStatus();
  const { data: statusOptionsData, isLoading: statusLoading } = useStatusOptions();

  // Transform full API data for status info lookup
  const allStatusOptions = statusOptionsData?.map(option => ({
    value: option.statusCode,
    label: option.statusName,
    color: option.colorCode || 'bg-gray-500',
    textColor: 'text-white',
    bgColor: option.colorCode || 'bg-gray-500',
    description: option.description || ''
  })) || [];

  // Use provided filtered status options for dropdown or fallback to all options
  const statusOptions = allowedStatusOptions || allStatusOptions;

  // Check if hours worked is required for the selected status
  const isCompletionStatus = selectedStatus === 'Completed' || selectedStatus === 'Closed' || selectedStatus === 'TopicClosed';
  const isHoursRequired = isCompletionStatus && userRole === 'consultant';
  
  // Parse hours value for validation
  const hoursValue = parseFloat(hoursWorked) || 0;

  // Show loading state while fetching status options
  if (statusLoading) {
    return <div className="p-4 text-center">Loading status options...</div>;
  }

  // If no status options available, show appropriate message
  if (!statusOptions || statusOptions.length === 0) {
    // Check if it's a consultant trying to modify a closed ticket
    const isTicketClosed = currentStatus === 'Closed' || 
                          currentStatus === 'TopicClosed' || 
                          currentStatus === 'Paid';
    
    if (userRole === 'consultant' && isTicketClosed) {
      return (
        <div className="p-6 text-center space-y-3">
          <div className="flex justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Ticket is Closed</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              This ticket has been marked as closed. Only the customer can reopen it if further assistance is needed.
            </p>
          </div>
        </div>
      );
    }
    
    return <div className="p-4 text-center text-red-500">Unable to load status options</div>;
  }

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus && !comment.trim()) {
      toast.info('Please change the status or add a comment');
      return;
    }

    // Validate hours worked if required
    if (isHoursRequired) {
      if (!hoursWorked.trim()) {
        toast.error('Hours worked is required when closing a ticket');
        return;
      }
      
      const hours = parseFloat(hoursWorked);
      if (isNaN(hours) || hours <= 0) {
        toast.error('Please enter a valid number of hours worked (greater than 0)');
        return;
      }
      
      if (hours > 100) {
        toast.error('Hours worked cannot exceed 100 hours per ticket');
        return;
      }
    }

    try {
      await updateStatus.mutateAsync({
        orderId,
        status: selectedStatus as any,
        comment: comment.trim() || undefined,
        hoursWorked: isHoursRequired ? parseFloat(hoursWorked) : undefined
      });

      toast.success('Ticket status updated successfully');
      setComment(''); // Clear comment after successful update
      setHoursWorked(''); // Clear hours after successful update
      onStatusUpdate?.(selectedStatus);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update ticket status');
    }
  };

  const getCurrentStatusInfo = () => {
    // Use full status options to find current status info (for display)
    return allStatusOptions.find(opt => opt.value === currentStatus) || allStatusOptions[0] || statusOptions[0];
  };

  const getSelectedStatusInfo = () => {
    // Use full status options to find selected status info (for display)
    return allStatusOptions.find(opt => opt.value === selectedStatus) || allStatusOptions[0] || statusOptions[0];
  };

  const isStatusChanged = selectedStatus !== currentStatus;
  const hasComment = comment.trim().length > 0;
  const hasValidHours = !isHoursRequired || (hoursWorked.trim() && parseFloat(hoursWorked) > 0);
  const canUpdate = (isStatusChanged || hasComment) && hasValidHours;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      {/* Status Change Section */}
      <div className="space-y-4">
        {/* Current vs New Status Display */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/50 rounded-lg space-y-3 sm:space-y-0">
          <div className="flex flex-col items-center space-y-2 min-w-0">
            <Label className="text-xs font-medium text-muted-foreground">Current Status</Label>
            <Badge 
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
            <SelectContent className="z-[10000]">
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

      {/* Hours Worked Section - Only show for consultants when closing tickets */}
      {isHoursRequired && (
        <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">Hours Worked</Label>
            <span className="text-xs text-red-500">*Required</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  placeholder="e.g., 2.5"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                hours
              </div>
            </div>
            
            {consultantHourlyRate && hoursValue > 0 && (
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span className="font-medium">₹{consultantHourlyRate.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Hours:</span>
                  <span className="font-medium">{hoursValue.toFixed(1)}</span>
                </div>
              </div>
            )}
            
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Enter the actual number of hours you worked on this ticket. This will be used to calculate the final amount for the customer.
            </p>
          </div>
        </div>
      )}

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
