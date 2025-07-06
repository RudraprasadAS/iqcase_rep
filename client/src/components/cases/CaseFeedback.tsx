import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  resolved_satisfaction: boolean | null;
  staff_score: string | null;
  would_use_again: boolean | null;
  submitted_at: string;
  context: string | null;
  users?: {
    name: string;
    email: string;
  };
}

interface CaseFeedbackProps {
  caseId: string;
  caseTitle?: string;
  caseStatus: string;
  isInternal?: boolean;
}

const CaseFeedback = ({ caseId, caseTitle, caseStatus, isInternal = true }: CaseFeedbackProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [canSubmitFeedback, setCanSubmitFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  const isCaseClosed = caseStatus === 'closed' || caseStatus === 'resolved';

  useEffect(() => {
    if (caseId) {
      fetchFeedback();
    }
  }, [caseId]);

  // Separate effect for checking feedback eligibility when user loads
  useEffect(() => {
    if (caseId && !isInternal && !isLoading) {
      console.log('🔍 Auth loading finished, checking feedback eligibility...');
      checkFeedbackEligibility();
    }
  }, [caseId, user, isInternal, caseStatus, isLoading]);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('case_feedback')
        .select(`
          id,
          rating,
          comment,
          resolved_satisfaction,
          staff_score,
          would_use_again,
          submitted_at,
          context,
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
    console.log('🔍 Checking feedback eligibility for case:', caseId);
    console.log('🔍 Case status:', caseStatus, 'Is case closed/resolved:', isCaseClosed);
    console.log('🔍 Current user:', user);
    console.log('🔍 Auth loading:', isLoading);
    
    if (isLoading) {
      console.log('❌ Still loading auth, waiting...');
      return;
    }

    if (!user) {
      console.log('❌ Not eligible - no user logged in');
      setCanSubmitFeedback(false);
      return;
    }

    if (!isCaseClosed) {
      console.log('❌ Not eligible - case is not closed or resolved, current status:', caseStatus);
      setCanSubmitFeedback(false);
      return;
    }

    try {
      // Get current authenticated user (double check)
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        console.error('❌ Auth error or no authenticated user:', authError);
        setCanSubmitFeedback(false);
        return;
      }

      console.log('✅ Authenticated user ID:', authData.user.id);

      // Get internal user record linked to auth user
      console.log('🔍 Looking up user in users table with auth_user_id:', authData.user.id);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, user_type, email, name')
        .eq('auth_user_id', authData.user.id)
        .single();

      console.log('🔍 User lookup result:', { userData, userError });

      if (userError) {
        console.error('❌ Error fetching internal user data:', userError);
        console.log('🔍 Trying to check if any users exist with this auth_user_id...');
        
        // Let's see if there are any users with this auth_user_id
        const { data: allUsersCheck, error: allUsersError } = await supabase
          .from('users')
          .select('id, user_type, email, name, auth_user_id')
          .eq('auth_user_id', authData.user.id);
        
        console.log('🔍 All users check result:', { allUsersCheck, allUsersError });
        
        setCanSubmitFeedback(false);
        return;
      }

      if (!userData) {
        console.error('❌ No internal user data found');
        setCanSubmitFeedback(false);
        return;
      }

      console.log('✅ Internal user data:', userData);

      // Only external/citizen users should be able to submit feedback
      if (userData.user_type !== 'external' && userData.user_type !== 'public') {
        console.log('❌ User is internal, cannot submit feedback. User type:', userData.user_type);
        setCanSubmitFeedback(false);
        return;
      }

      // Check if user submitted this case
      console.log('🔍 Checking if user submitted case:', caseId);
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('submitted_by, title')
        .eq('id', caseId)
        .single();

      console.log('🔍 Case lookup result:', { caseData, caseError });

      if (caseError || !caseData) {
        console.error('❌ Error fetching case data:', caseError);
        setCanSubmitFeedback(false);
        return;
      }

      console.log('✅ Case data - submitted_by:', caseData.submitted_by, 'current user ID:', userData.id);

      if (caseData.submitted_by !== userData.id) {
        console.log('❌ User did not submit this case, cannot provide feedback');
        setCanSubmitFeedback(false);
        return;
      }

      // Check if user has already submitted feedback for this case
      console.log('🔍 Checking for existing feedback...');
      const { data: existingFeedback, error: feedbackError } = await supabase
        .from('case_feedback')
        .select('id')
        .eq('case_id', caseId)
        .eq('submitted_by', userData.id)
        .maybeSingle();

      console.log('🔍 Existing feedback check:', { existingFeedback, feedbackError });

      if (feedbackError) {
        console.error('❌ Error checking existing feedback:', feedbackError);
        setCanSubmitFeedback(false);
        return;
      }

      const hasAlreadySubmittedFeedback = !!existingFeedback;
      const canSubmit = !hasAlreadySubmittedFeedback;
      
      console.log('🎯 Final eligibility check:');
      console.log('   - Is external/public user:', userData.user_type === 'external' || userData.user_type === 'public');
      console.log('   - Case is closed/resolved:', isCaseClosed);
      console.log('   - User submitted case:', caseData.submitted_by === userData.id);
      console.log('   - Already has feedback:', hasAlreadySubmittedFeedback);
      console.log('   - Can submit feedback:', canSubmit);
      
      setCanSubmitFeedback(canSubmit);
      
    } catch (error) {
      console.error('❌ Error in feedback eligibility check:', error);
      setCanSubmitFeedback(false);
    }
  };

  const handleFeedbackSubmit = () => {
    setShowFeedbackDialog(false);
    fetchFeedback();
    setCanSubmitFeedback(false);
    toast({
      title: 'Thank you!',
      description: 'Your feedback has been submitted successfully.',
    });
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
              {isInternal ? 'Customer Feedback' : 'Case Feedback'} ({feedback.length})
            </CardTitle>
            
            {/* Show feedback button for eligible external users */}
            {!isInternal && canSubmitFeedback && (
              <Button 
                onClick={() => setShowFeedbackDialog(true)}
                size="sm"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Give Feedback
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Show feedback prompt for external users who can submit feedback */}
          {!isInternal && canSubmitFeedback && feedback.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-center text-blue-800 mb-3">
                  <MessageSquare className="h-6 w-6 mr-2" />
                  <span className="font-medium text-lg">Your feedback matters!</span>
                </div>
                <p className="text-blue-700 mb-4">
                  Your case has been {caseStatus}. Help us improve by sharing your experience.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => setShowFeedbackDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Provide Feedback
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setCanSubmitFeedback(false)}
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Show existing feedback or empty state */}
          {(feedback.length > 0 || (!canSubmitFeedback && feedback.length === 0)) && (
            <>
              {feedback.length === 0 ? (
                <div className="text-center py-8">
                  {isInternal ? (
                    <div className="text-muted-foreground">
                      No customer feedback received yet
                    </div>
                  ) : isCaseClosed && !canSubmitFeedback ? (
                    <div className="text-muted-foreground">
                      Feedback already submitted or not available
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      Feedback will be available when case is closed
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

                    {/* Submitted by - only show in internal view */}
                    {isInternal && fb.users && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        Submitted by {fb.users.name || fb.users.email}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Feedback Dialog Popup */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Share Your Feedback
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFeedbackDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            <FeedbackWidget
              caseId={caseId}
              caseTitle={caseTitle}
              context="case"
              onSubmit={handleFeedbackSubmit}
              onCancel={() => setShowFeedbackDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CaseFeedback;
