import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStatusHistory } from '@/hooks/useStatus';
import { Clock, User, MessageSquare, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface StatusHistoryProps {
  orderId: string;
  className?: string;
}

const StatusHistory: React.FC<StatusHistoryProps> = ({ orderId, className }) => {
  const { data: statusHistory, isLoading } = useStatusHistory(orderId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Status History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Status History</span>
          </CardTitle>
          <CardDescription>Track all status changes for this ticket</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Status History</span>
        </CardTitle>
        <CardDescription>
          {statusHistory.length} status change{statusHistory.length !== 1 ? 's' : ''} recorded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusHistory.map((change, index) => (
            <div key={change.id} className="flex items-start space-x-3">
              {/* Timeline indicator */}
              <div className="relative">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                {index < statusHistory.length - 1 && (
                  <div className="absolute top-4 left-1 w-px h-6 bg-border"></div>
                )}
              </div>
              
              {/* Change details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {change.fromStatus}
                  </Badge>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <Badge variant="secondary" className="text-xs">
                    {change.toStatus}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
                  <User className="w-3 h-3" />
                  <span>{change.changedBy}</span>
                  <span>•</span>
                  <time title={format(new Date(change.changedAt), 'PPpp')}>
                    {formatDistanceToNow(new Date(change.changedAt), { addSuffix: true })}
                  </time>
                </div>
                
                {change.comment && (
                  <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                    <div className="flex items-start space-x-1">
                      <MessageSquare className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                      <p className="text-muted-foreground">{change.comment}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusHistory;