
import { useState, useEffect } from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FeedbackWidgetProps {
  caseId?: string;
  caseTitle?: string;
  context?: 'general' | 'case' | 'portal';
  onSubmit?: () => void;
  onCancel?: () => void;
}

const FeedbackWidget = ({ 
  caseId, 
  caseTitle,
  context = 'case', 
  onSubmit, 
  onCancel 
}: FeedbackWidgetProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [resolvedSatisfaction, setResolvedSatisfaction] = useState<boolean | null>(null);
  const [staffScore, setStaffScore] = useState<string>('');
  const [wouldUseAgain, setWouldUseAgain] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user has already submitted feedback for this case
  useEffect(() => {
    const checkExistingFeedback = async () => {
      if (!user || !caseId || caseId === 'general-feedback') return;

      try {
        // Get internal user ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (userError || !userData) {
          console.error('Error fetching user data:', userError);
          return;
        }

        // Check for existing feedback
        const { data: feedback, error } = await supabase
          .from('case_feedback')
          .select(`
            id,
            rating,
            comment,
            resolved_satisfaction,
            staff_score,
            would_use_again,
            context
          `)
          .eq('case_id', caseId)
          .eq('submitted_by', userData.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking existing feedback:', error);
          return;
        }

        if (feedback) {
          setExistingFeedback(feedback);
          setHasSubmitted(true);
          // Pre-populate form with existing feedback
          setRating(feedback.rating || 0);
          setComment(feedback.comment || '');
          setResolvedSatisfaction(feedback.resolved_satisfaction);
          setStaffScore(feedback.staff_score || '');
          setWouldUseAgain(feedback.would_use_again);
        }
      } catch (error) {
        console.error('Error in checkExistingFeedback:', error);
      }
    };

    checkExistingFeedback();
  }, [user, caseId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit feedback.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Failed to get user information');
      }

      // For general feedback, skip for now
      if (caseId === 'general-feedback') {
        toast({
          title: "Thank you!",
          description: "Your feedback has been recorded.",
        });
        onSubmit?.();
        return;
      }

      const feedbackData = {
        case_id: caseId,
        submitted_by: userData.id,
        rating,
        comment: comment.trim() || null,
        resolved_satisfaction: resolvedSatisfaction,
        staff_score: staffScore || null,
        would_use_again: wouldUseAgain,
        context: context
      };

      let result;
      if (hasSubmitted) {
        // Update existing feedback
        result = await supabase
          .from('case_feedback')
          .update(feedbackData)
          .eq('id', existingFeedback.id);
      } else {
        // Insert new feedback
        result = await supabase
          .from('case_feedback')
          .insert(feedbackData);
      }

      if (result.error) throw result.error;

      toast({
        title: hasSubmitted ? "Feedback Updated" : "Feedback Submitted",
        description: "Thank you for your feedback!"
      });

      // Reset form if it was a new submission
      if (!hasSubmitted) {
        setRating(0);
        setComment('');
        setResolvedSatisfaction(null);
        setStaffScore('');
        setWouldUseAgain(null);
      }
      
      setHasSubmitted(true);
      onSubmit?.();

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-8 w-8 cursor-pointer transition-colors ${
          i < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300 hover:text-yellow-400'
        }`}
        onClick={() => setRating(i + 1)}
      />
    ));
  };

  const generateCaseNumber = (id: string) => {
    if (id === 'general-feedback') return 'General Portal';
    const year = new Date().getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `#${year}-${shortId}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          We'd love your feedback on {caseId === 'general-feedback' ? 'our portal' : `Case ${generateCaseNumber(caseId || '')}`}
          {hasSubmitted && <span className="text-sm text-green-600">(Updated)</span>}
        </CardTitle>
        {caseTitle && (
          <p className="text-sm text-muted-foreground">{caseTitle}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Rating */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            How satisfied are you with the resolution?
          </label>
          <div className="flex items-center gap-2">
            {renderStars()}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                ({rating} out of 5)
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Any comments or suggestions?
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Resolved to Satisfaction */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Was your issue resolved to your satisfaction?
          </label>
          <RadioGroup
            value={resolvedSatisfaction?.toString() || ''}
            onValueChange={(value) => setResolvedSatisfaction(value === 'true')}
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="satisfied-yes" />
                <Label htmlFor="satisfied-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="satisfied-no" />
                <Label htmlFor="satisfied-no">No</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Staff Professionalism */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            How would you rate our team's professionalism?
          </label>
          <Select value={staffScore} onValueChange={setStaffScore}>
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Would Use Again */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Would you use our service again?
          </label>
          <RadioGroup
            value={wouldUseAgain?.toString() || ''}
            onValueChange={(value) => setWouldUseAgain(value === 'true')}
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="use-again-yes" />
                <Label htmlFor="use-again-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="use-again-no" />
                <Label htmlFor="use-again-no">No</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting 
              ? 'Submitting...' 
              : hasSubmitted 
                ? 'Update Feedback' 
                : 'Submit Feedback'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackWidget;
