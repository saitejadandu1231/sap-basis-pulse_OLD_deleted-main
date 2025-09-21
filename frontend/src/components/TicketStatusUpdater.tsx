
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateTicketStatus } from '@/hooks/useSupport';
import { toast } from 'sonner';

interface TicketStatusUpdaterProps {
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

const TicketStatusUpdater: React.FC<TicketStatusUpdaterProps> = ({
  orderId,
  currentStatus,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus);
  const updateStatus = useUpdateTicketStatus();

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

  const getCurrentStatusDisplay = () => {
    const status = statusOptions.find(opt => opt.value === currentStatus);
    return status ? status.label : currentStatus;
  };

  const getCurrentStatusColor = () => {
    const status = statusOptions.find(opt => opt.value === currentStatus);
    return status ? status.color : 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Ticket Status
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCurrentStatusColor()}`}>
            {getCurrentStatusDisplay()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Update Status</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${option.color.split(' ')[0]}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleStatusUpdate}
          disabled={updateStatus.isPending || selectedStatus === currentStatus}
          className="w-full"
        >
          {updateStatus.isPending ? 'Updating...' : 'Update Status'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TicketStatusUpdater;
