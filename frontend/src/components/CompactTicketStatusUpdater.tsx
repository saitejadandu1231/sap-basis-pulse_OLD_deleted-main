import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateTicketStatus } from '@/hooks/useSupport';
import { toast } from 'sonner';
import { useCreatePaymentOrderOnClose } from '@/hooks/usePayments';

interface CompactTicketStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate?: (newStatus: string) => void;
}

const statusOptions = [
  { value: 'New', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'InProgress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PendingCustomerAction', label: 'Pending Customer Action', color: 'bg-orange-100 text-orange-800' },
  { value: 'TopicClosed', label: 'Topic Closed', color: 'bg-green-100 text-green-800' },
  { value: 'Closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
  { value: 'ReOpened', label: 'Re-Opened', color: 'bg-purple-100 text-purple-800' }
];

const CompactTicketStatusUpdater: React.FC<CompactTicketStatusUpdaterProps> = ({
  orderId,
  currentStatus,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus);
  const updateStatus = useUpdateTicketStatus();
  const createOrderOnClose = useCreatePaymentOrderOnClose();

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

      // If ticket closed, create payment order
      if (selectedStatus === 'Closed' || selectedStatus === 'TopicClosed') {
        try {
          await createOrderOnClose.mutateAsync({ orderId });
          toast.success('Created payment order for this ticket. Customer will be asked to pay.');
        } catch (err) {
          console.error('Failed to create payment order on close:', err);
          toast.error('Status updated but failed to create payment order.');
        }
      }

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