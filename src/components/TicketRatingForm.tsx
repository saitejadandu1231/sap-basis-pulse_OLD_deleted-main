
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useCreateTicketRating } from '@/hooks/useSupport';
import { toast } from 'sonner';

interface TicketRatingFormProps {
  orderId: string;
  ratedUserId: string;
  ratingForRole: 'customer' | 'consultant';
  onSuccess?: () => void;
}

const TicketRatingForm: React.FC<TicketRatingFormProps> = ({
  orderId,
  ratedUserId,
  ratingForRole,
  onSuccess
}) => {
  const [resolutionQuality, setResolutionQuality] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [communicationProfessionalism, setCommunicationProfessionalism] = useState(0);
  const [comments, setComments] = useState('');

  const createRating = useCreateTicketRating();

  const handleStarClick = (rating: number, setter: (value: number) => void) => {
    setter(rating);
  };

  const renderStars = (currentRating: number, setter: (value: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= currentRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            onClick={() => handleStarClick(star, setter)}
          />
        ))}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resolutionQuality || !responseTime || !communicationProfessionalism) {
      toast.error('Please provide ratings for all categories');
      return;
    }

    try {
      await createRating.mutateAsync({
        orderId,
        ratedUserId,
        ratingForRole,
        resolutionQuality,
        responseTime,
        communicationProfessionalism,
        comments: comments.trim() || undefined
      });

      toast.success('Rating submitted successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Rate {ratingForRole === 'consultant' ? 'Consultant' : 'Customer'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Resolution Quality</Label>
            {renderStars(resolutionQuality, setResolutionQuality)}
          </div>

          <div className="space-y-2">
            <Label>Response Time</Label>
            {renderStars(responseTime, setResponseTime)}
          </div>

          <div className="space-y-2">
            <Label>Communication & Professionalism</Label>
            {renderStars(communicationProfessionalism, setCommunicationProfessionalism)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value.slice(0, 100))}
              placeholder="Share your experience..."
              className="resize-none"
              maxLength={100}
            />
            <div className="text-sm text-gray-500 text-right">
              {comments.length}/100 characters
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={createRating.isPending || !resolutionQuality || !responseTime || !communicationProfessionalism}
          >
            {createRating.isPending ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TicketRatingForm;
