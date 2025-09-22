import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Rating {
  id: string;
  orderId: string;
  ratedByUserId: string;
  ratedUserId: string;
  ratingForRole: 'customer' | 'consultant';
  communicationProfessionalism: number;
  resolutionQuality: number;
  responseTime: number;
  comments?: string;
}

interface RatingDisplayProps {
  ratings: Rating[];
  userRole: 'customer' | 'consultant' | 'admin';
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({ ratings, userRole }) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const calculateAverage = (ratings: Rating[], field: 'communicationProfessionalism' | 'resolutionQuality' | 'responseTime') => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + (rating[field] || 0), 0);
    return sum / ratings.length;
  };

  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center p-4 border border-muted/20 rounded-lg">
        No ratings available yet
      </div>
    );
  }

  const customerRatings = ratings.filter(r => r.ratingForRole === 'customer');
  const consultantRatings = ratings.filter(r => r.ratingForRole === 'consultant');

  return (
    <div className="space-y-4">
      {consultantRatings.length > 0 ? (
        <div className="border border-muted/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline">Customer Ratings for Consultant</Badge>
            <span className="text-sm text-muted-foreground">({consultantRatings.length})</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <div className="text-sm font-medium mb-1">Communication</div>
              {renderStars(Math.round(calculateAverage(consultantRatings, 'communicationProfessionalism')))}
              <div className="text-xs text-muted-foreground">
                {calculateAverage(consultantRatings, 'communicationProfessionalism').toFixed(1)}/5
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium mb-1">Resolution</div>
              {renderStars(Math.round(calculateAverage(consultantRatings, 'resolutionQuality')))}
              <div className="text-xs text-muted-foreground">
                {calculateAverage(consultantRatings, 'resolutionQuality').toFixed(1)}/5
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium mb-1">Response Time</div>
              {renderStars(Math.round(calculateAverage(consultantRatings, 'responseTime')))}
              <div className="text-xs text-muted-foreground">
                {calculateAverage(consultantRatings, 'responseTime').toFixed(1)}/5
              </div>
            </div>
          </div>
          
          {consultantRatings.some(r => r.comments) && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium">
                <MessageSquare className="w-3 h-3" />
                Customer Comments
              </div>
              {consultantRatings
                .filter(r => r.comments)
                .map((rating, index) => (
                  <div key={rating.id} className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                    {rating.comments}
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center p-4 border border-muted/20 rounded-lg">
          No customer ratings available yet
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;