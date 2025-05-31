
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  submitted_at: string;
  users?: {
    name: string;
    email: string;
  };
}

interface CaseFeedbackProps {
  caseId: string;
  caseStatus: string;
}

const CaseFeedback = ({ caseId, caseStatus }: CaseFeedbackProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const isCaseClosed = caseStatus === 'closed' || caseStatus === 'resolved';

  useEffect(() => {
    fetchFeedback();
    checkUserFeedback();
  }, [caseId]);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('case_feedback')
        .select(`
          *,
          users:submitted_by (
            name,
            email
          )
        `)
        .eq('case_id', caseId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserFeedback = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('case_feedback')
        .select('id')
        .eq('case_id', caseId)
        .eq('submitted_by', user.id);

      if (error) throw error;
      setHasSubmitted((data || []).length > 0);
    } catch (error) {
      console.error('Error checking user feedback:', error);
    }
  };

  const submitFeedback = async () => {
    if (!user || rating === 0) return;

    try {
      const { error } = await supabase
        .from('case_feedback')
        .insert({
          case_id: caseId,
          submitted_by: user.id,
          rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      await fetchFeedback();
      await checkUserFeedback();
      setRating(0);
      setComment('');
      
      toast({
        title: "Success",
        description: "Feedback submitted successfully"
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive"
      });
    }
  };

  const renderStars = (currentRating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < currentRating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive ? () => setRating(i + 1) : undefined}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div>Loading feedback...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Case Feedback ({feedback.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Submit feedback form - only show if case is closed and user hasn't submitted */}
        {isCaseClosed && !hasSubmitted && user && (
          <div className="p-4 border rounded-lg bg-blue-50">
            <h4 className="font-medium mb-3">How would you rate the resolution of this case?</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-1">
                {renderStars(rating, true)}
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating > 0 && `${rating}/5 stars`}
                </span>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Additional comments (optional)..."
                rows={3}
              />
              <Button 
                onClick={submitFeedback} 
                disabled={rating === 0}
                size="sm"
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        )}

        {/* Display existing feedback */}
        {feedback.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            {isCaseClosed ? 'No feedback yet' : 'Feedback will be available when case is closed'}
          </div>
        ) : (
          feedback.map((fb) => (
            <div key={fb.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  {renderStars(fb.rating)}
                  <span className="ml-2 text-sm font-medium">
                    {fb.rating}/5 stars
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(fb.submitted_at)}
                </div>
              </div>
              {fb.comment && (
                <p className="text-sm text-muted-foreground">{fb.comment}</p>
              )}
              {fb.users && (
                <div className="text-xs text-muted-foreground mt-2">
                  By {fb.users.name}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default CaseFeedback;
