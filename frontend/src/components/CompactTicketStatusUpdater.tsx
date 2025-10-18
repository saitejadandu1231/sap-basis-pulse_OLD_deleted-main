import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateTicketStatus } from '@/hooks/useSupport';
import { useStatusOptions } from '@/hooks/useStatus';
import { Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface CompactTicketStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate?: (newStatus: string) => void;
  allowedStatusOptions?: Array<{value: string; label: string; color: string}>;
  userRole?: string;
  consultantHourlyRate?: number | null;
}

const CompactTicketStatusUpdater: React.FC<CompactTicketStatusUpdaterProps> = ({
  orderId,
  currentStatus,
  onStatusUpdate,
  allowedStatusOptions,
  userRole,
  consultantHourlyRate
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus);
  const [hoursWorked, setHoursWorked] = React.useState<string>('');
  const updateStatus = useUpdateTicketStatus();
  const { data: statusOptionsData, isLoading: statusLoading } = useStatusOptions();

  // Transform full API data for status info lookup
  const allStatusOptions = statusOptionsData?.map(option => ({
    value: option.statusCode,
    label: option.statusName,
    color: `bg-${option.colorCode?.replace('bg-', '').replace('-500', '-100')} text-${option.colorCode?.replace('bg-', '').replace('-500', '-800')}` || 'bg-gray-100 text-gray-800'
  })) || [];

  // Use provided filtered status options for dropdown or fallback to all options
  const statusOptions = allowedStatusOptions || allStatusOptions;

  // Check if hours worked is required for the selected status
  const isCompletionStatus = selectedStatus === 'Completed' || selectedStatus === 'Closed' || selectedStatus === 'TopicClosed';
  const isTransitioningToCompletion = isCompletionStatus && currentStatus !== selectedStatus && userRole === 'consultant';

  // Show loading state while fetching status options
  if (statusLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  // If no status options available, show current status only
  if (!statusOptions || statusOptions.length === 0) {
    return <span className="text-sm font-medium">{currentStatus}</span>;
  }

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) {
      toast.info('Status is already set to the selected value');
      return;
    }

    // Validate hours worked for completion statuses
    if (isTransitioningToCompletion) {
      const hours = parseFloat(hoursWorked);
      if (!hoursWorked || isNaN(hours) || hours <= 0) {
        toast.error('Please enter valid hours worked');
        return;
      }
      if (hours > 24) {
        toast.error('Hours worked cannot exceed 24 hours per ticket');
        return;
      }
    }

    try {
      await updateStatus.mutateAsync({
        orderId,
        status: selectedStatus as any,
        hoursWorked: isTransitioningToCompletion ? parseFloat(hoursWorked) : undefined
      });

      toast.success('Ticket status updated successfully');
      onStatusUpdate?.(selectedStatus);
      
      // Reset hours worked after successful update
      if (isTransitioningToCompletion) {
        setHoursWorked('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Update Status:</div>
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hours Worked Input for Completion Status */}
      {isTransitioningToCompletion && (
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
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-blue-600">
              Enter the total hours spent working on this ticket
            </p>
          </div>
          {/* Hours input field for completion statuses */}
        </div>
      )}

      <Button 
        onClick={handleStatusUpdate}
        disabled={updateStatus.isPending || selectedStatus === currentStatus || (isTransitioningToCompletion && (!hoursWorked || parseFloat(hoursWorked) <= 0))}
        size="sm"
        className="w-full"
      >
        {updateStatus.isPending ? 'Updating...' : 'Update Status'}
      </Button>
    </div>
  );
};

export default CompactTicketStatusUpdater;