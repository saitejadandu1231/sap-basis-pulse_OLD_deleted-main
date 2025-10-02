import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp } from 'lucide-react';
import { useSubmitTicketRating } from '@/hooks/useSupport';
import { toast } from 'sonner';

interface CompactRatingFormProps {
  orderId: string;
  ratedUserId: string;
  ratingForRole: 'customer' | 'consultant';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CompactRatingForm: React.FC<CompactRatingFormProps> = ({
  orderId,
  ratedUserId,
  ratingForRole,
  onSuccess,
  onCancel
}) => {
  const [resolutionQuality, setResolutionQuality] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [communicationProfessionalism, setCommunicationProfessionalism] = useState(0);
  const [comments, setComments] = useState('');

  const createRating = useSubmitTicketRating();

  const handleStarClick = (rating: number, setter: (value: number) => void) => {
    setter(rating);
  };

  const renderStars = (currentRating: number, setter: (value: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 cursor-pointer transition-colors ${
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

    console.log('Submitting rating with data:', {
      orderId,
      ratedUserId,
      ratingForRole,
      resolutionQuality,
      responseTime,
      communicationProfessionalism,
      comments: comments.trim() || undefined
    });

    try {
      await createRating.mutateAsync({
        orderId,
        ratedUserId,
        ratingForRole,
        resolutionQuality,
        responseTime,
        communicationProfessionalism,
        comments: comments.trim() || ''
      });

      toast.success('Rating submitted successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <ThumbsUp className="w-4 h-4" />
        <span className="font-medium text-sm">
          Rate Consultant
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Resolution Quality</Label>
            {renderStars(resolutionQuality, setResolutionQuality)}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Response Time</Label>
            {renderStars(responseTime, setResponseTime)}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Communication</Label>
            {renderStars(communicationProfessionalism, setCommunicationProfessionalism)}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="comments" className="text-xs">Comments (Optional)</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value.slice(0, 100))}
            placeholder="Share your experience..."
            className="resize-none text-sm"
            rows={2}
            maxLength={100}
          />
          <div className="text-xs text-muted-foreground text-right">
            {comments.length}/100 characters
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            type="submit" 
            size="sm"
            disabled={createRating.isPending || !resolutionQuality || !responseTime || !communicationProfessionalism}
            className="flex-1"
          >
            {createRating.isPending ? 'Submitting...' : 'Submit Rating'}
          </Button>
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={onCancel}
              disabled={createRating.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CompactRatingForm;