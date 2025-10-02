import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateTicketStatus } from '@/hooks/useSupport';
import { useStatusOptions } from '@/hooks/useStatus';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CompactTicketStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate?: (newStatus: string) => void;
}

const CompactTicketStatusUpdater: React.FC<CompactTicketStatusUpdaterProps> = ({
  orderId,
  currentStatus,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus);
  const updateStatus = useUpdateTicketStatus();
  const { userRole } = useAuth();
  const { data: statusOptionsData } = useStatusOptions();

  // Transform API data to match component expectations
  const statusOptions = statusOptionsData?.map(option => ({
    value: option.statusCode,
    label: option.statusName,
    color: option.colorCode
  })) || [];

  // Check if consultant can change status
  const canConsultantChangeStatus = !(currentStatus === 'Closed' || currentStatus === 'TopicClosed') || userRole !== 'consultant';

  // Filter status options based on business rules
  const getFilteredStatusOptions = () => {
    let filtered = statusOptions.filter(option => {
      // Business rule: Once a consultant closes a ticket, they cannot change status until customer reopens it
      if ((currentStatus === 'Closed' || currentStatus === 'TopicClosed') && userRole === 'consultant') {
        return false; // Filter out all options for consultants on closed tickets
      }
      return true;
    });

    // For disabled state, include the current status so it can be displayed
    if ((currentStatus === 'Closed' || currentStatus === 'TopicClosed') && userRole === 'consultant') {
      const currentOption = statusOptions.find(option => option.value === currentStatus);
      if (currentOption) {
        filtered = [currentOption];
      }
    }

    return filtered;
  };

  const filteredStatusOptions = getFilteredStatusOptions();

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
      {!canConsultantChangeStatus ? (
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} disabled>
            <SelectTrigger className="w-48 opacity-50 cursor-not-allowed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${option.color}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            disabled
            size="sm"
            className="opacity-50 cursor-not-allowed"
          >
            Update
          </Button>
        </div>
      ) : (
        <>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {filteredStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${option.color}`} />
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
        </>
      )}
    </div>
  );
};

export default CompactTicketStatusUpdater;