import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  resolved_satisfaction: boolean | null;
  staff_score: string | null;
  would_use_again: boolean | null;
  submitted_at: string;
  users?: {
    name: string;
    email: string;
  };
}

interface CaseFeedbackProps {
  caseId: string;
  caseTitle?: string;
  caseStatus: string;
}

const CaseFeedback = ({ caseId, caseTitle, caseStatus }: CaseFeedbackProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [canSubmitFeedback, setCanSubmitFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const isCaseClosed = caseStatus === 'closed' || caseStatus === 'resolved';

  useEffect(() => {
    if (caseId) {
      fetchFeedback();
      checkFeedbackEligibility();
    }
  }, [caseId, user]);

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
      
      console.log('Case feedback loaded:', data?.length || 0);
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feedback',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkFeedbackEligibility = async () => {
    if (!user || !isCaseClosed) {
      setCanSubmitFeedback(false);
      return;
    }

    try {
      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, user_type')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        return;
      }

      // Check if user is related to this case (submitted it or assigned to it)
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('submitted_by, assigned_to')
        .eq('id', caseId)
        .single();

      if (caseError || !caseData) {
        console.error('Error fetching case data:', caseError);
        return;
      }

      const isEligible = 
        caseData.submitted_by === userData.id || 
        caseData.assigned_to === userData.id ||
        userData.user_type === 'internal';

      setCanSubmitFeedback(isEligible);
      
    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
    }
  };

  const renderStars = (currentRating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < currentRating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStaffScoreColor = (score: string | null) => {
    switch (score) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return <div>Loading feedback...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Case Feedback ({feedback.length})
            </CardTitle>
            
            {canSubmitFeedback && !showFeedbackForm && (
              <Button 
                onClick={() => setShowFeedbackForm(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Give Feedback
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Feedback Form */}
          {showFeedbackForm && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <FeedbackWidget
                caseId={caseId}
                caseTitle={caseTitle}
                context="case"
                onSubmit={() => {
                  setShowFeedbackForm(false);
                  fetchFeedback();
                }}
                onCancel={() => setShowFeedbackForm(false)}
              />
            </div>
          )}

          {/* Display existing feedback */}
          {feedback.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {isCaseClosed 
                ? 'No feedback submitted yet' 
                : 'Feedback will be available when case is closed'
              }
              {canSubmitFeedback && isCaseClosed && (
                <div className="mt-4">
                  <Button 
                    onClick={() => setShowFeedbackForm(true)}
                    variant="outline"
                  >
                    Be the first to give feedback
                  </Button>
                </div>
              )}
            </div>
          ) : (
            feedback.map((fb) => (
              <div key={fb.id} className="border rounded-lg p-4 space-y-3">
                {/* Header with rating and date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {renderStars(fb.rating)}
                    <span className="font-medium text-sm">
                      {fb.rating}/5 stars
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(fb.submitted_at)}
                  </div>
                </div>

                {/* Comment */}
                {fb.comment && (
                  <div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {fb.comment}
                    </p>
                  </div>
                )}

                {/* Additional feedback details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {fb.resolved_satisfaction !== null && (
                    <div>
                      <span className="font-medium">Resolved to satisfaction: </span>
                      <span className={fb.resolved_satisfaction ? 'text-green-600' : 'text-red-600'}>
                        {fb.resolved_satisfaction ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  
                  {fb.staff_score && (
                    <div>
                      <span className="font-medium">Staff rating: </span>
                      <span className={getStaffScoreColor(fb.staff_score)}>
                        {fb.staff_score.charAt(0).toUpperCase() + fb.staff_score.slice(1)}
                      </span>
                    </div>
                  )}
                  
                  {fb.would_use_again !== null && (
                    <div>
                      <span className="font-medium">Would use again: </span>
                      <span className={fb.would_use_again ? 'text-green-600' : 'text-red-600'}>
                        {fb.would_use_again ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Submitted by */}
                {fb.users && (
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    Submitted by {fb.users.name || fb.users.email}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default CaseFeedback;
