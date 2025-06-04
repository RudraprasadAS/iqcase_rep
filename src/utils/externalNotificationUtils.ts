
import { supabase } from '@/integrations/supabase/client';
import { createCaseStatusChangeNotification, createNotification } from './notificationUtils';

export const notifyExternalUserOfCaseUpdate = async (
  caseId: string,
  caseTitle: string,
  updateType: 'status_change' | 'message_added' | 'case_closed',
  newStatus?: string,
  message?: string,
  updatedByUserId?: string
) => {
  try {
    console.log('🔔 Notifying external user of case update:', {
      caseId,
      updateType,
      newStatus,
      message
    });

    // Get the case details and submitter
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        submitted_by_user:users!cases_submitted_by_fkey(name, email, user_type)
      `)
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('🔔 Error fetching case for notification:', caseError);
      return;
    }

    // Only notify if the submitter is an external user (citizen)
    if (caseData.submitted_by_user?.user_type !== 'external') {
      console.log('🔔 Submitter is not external user, skipping notification');
      return;
    }

    const submitterId = caseData.submitted_by;

    // Create appropriate notification based on update type
    switch (updateType) {
      case 'status_change':
        if (newStatus) {
          await createCaseStatusChangeNotification(
            submitterId,
            caseTitle,
            newStatus,
            caseId
          );
        }
        break;

      case 'message_added':
        await createNotification({
          userId: submitterId,
          title: 'New Message on Your Case',
          message: `A new message has been added to your case "${caseTitle}": ${message?.substring(0, 100)}${message && message.length > 100 ? '...' : ''}`,
          type: 'new_message',
          caseId: caseId
        });
        break;

      case 'case_closed':
        await createNotification({
          userId: submitterId,
          title: 'Case Closed - Feedback Requested',
          message: `Your case "${caseTitle}" has been closed. We would appreciate your feedback on our service.`,
          type: 'case_closed',
          caseId: caseId
        });
        break;

      default:
        console.log('🔔 Unknown update type:', updateType);
    }

    console.log('🔔 External user notification sent successfully');
  } catch (error) {
    console.error('🔔 Error sending external user notification:', error);
  }
};
