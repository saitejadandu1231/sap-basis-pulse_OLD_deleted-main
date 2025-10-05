import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateTicketStatus } from '@/hooks/useSupport';
import { useStatusOptions } from '@/hooks/useStatus';
import { toast } from 'sonner';

interface CompactTicketStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate?: (newStatus: string) => void;
  allowedStatusOptions?: Array<{value: string; label: string; color: string}>;
  userRole?: string;
}

const CompactTicketStatusUpdater: React.FC<CompactTicketStatusUpdaterProps> = ({
  orderId,
  currentStatus,
  onStatusUpdate,
  allowedStatusOptions,
  userRole
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus);
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

    try {
      await updateStatus.mutateAsync({
        orderId,
        status: selectedStatus as any
      });

      toast.success('Ticket status updated successfully');
      onStatusUpdate?.(selectedStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
      <div className="text-sm font-medium min-w-0">
        Update Status:
      </div>
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
      <Button 
        onClick={handleStatusUpdate}
        disabled={updateStatus.isPending || selectedStatus === currentStatus}
        size="sm"
      >
        {updateStatus.isPending ? 'Updating...' : 'Update'}
      </Button>
    </div>
  );
};

export default CompactTicketStatusUpdater;