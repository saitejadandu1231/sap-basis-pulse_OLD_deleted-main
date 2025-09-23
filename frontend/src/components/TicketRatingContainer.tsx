import React from 'react';
import { useTicketRatings } from '@/hooks/useSupport';
import RatingDisplay from './RatingDisplay';
import CompactRatingForm from './CompactRatingForm';
import { Button } from '@/components/ui/button';
import { Star, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TicketRatingContainerProps {
  orderId: string;
  consultantId: string;
  createdByUserId: string;
  ticketStatus: string;
  onRatingSubmitted?: () => void;
}

const TicketRatingContainer: React.FC<TicketRatingContainerProps> = ({
  orderId,
  consultantId,
  createdByUserId,
  ticketStatus,
  onRatingSubmitted
}) => {
  const { user } = useAuth();
  const { data: ratings, isLoading } = useTicketRatings(orderId);
  const [showRatingForm, setShowRatingForm] = React.useState(false);

  console.log('TicketRatingContainer props:', {
    orderId,
    consultantId,
    createdByUserId,
    ticketStatus,
    userRole: user?.role,
    userId: user?.id
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading ratings...</div>;
  }

  const canRate = ticketStatus === 'Closed' || ticketStatus === 'TopicClosed';
  const userHasRated = ratings?.some((rating: any) => rating.ratedByUserId === user?.id);

  const getRatingTarget = () => {
    // Only customers can rate consultants
    if (user?.role === 'customer') {
      return {
        ratedUserId: consultantId,
        ratingForRole: 'consultant' as const
      };
    }
    // Consultants cannot rate customers
    return null;
  };

  const ratingTarget = getRatingTarget();

  return (
    <div className="space-y-3">
      {ratings && ratings.length > 0 && (
        <RatingDisplay 
          ratings={ratings} 
          userRole={user?.role as 'customer' | 'consultant' | 'admin'} 
        />
      )}

      {canRate && !userHasRated && ratingTarget && (
        <div className="space-y-2">
          {!showRatingForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRatingForm(true)}
              className="w-full"
            >
              <Star className="w-3 h-3 mr-1" />
              Rate Consultant
            </Button>
          ) : (
            <CompactRatingForm
              orderId={orderId}
              ratedUserId={ratingTarget.ratedUserId}
              ratingForRole={ratingTarget.ratingForRole}
              onSuccess={() => {
                setShowRatingForm(false);
                onRatingSubmitted?.();
              }}
              onCancel={() => setShowRatingForm(false)}
            />
          )}
        </div>
      )}

      {!canRate && user?.role === 'customer' && (
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
          Customer ratings are available after ticket is closed
        </div>
      )}

      {canRate && userHasRated && (
        <div className="text-xs text-green-600 text-center p-2 bg-green-50 rounded">
          ✓ You have already rated this ticket
        </div>
      )}
    </div>
  );
};

export default TicketRatingContainer;