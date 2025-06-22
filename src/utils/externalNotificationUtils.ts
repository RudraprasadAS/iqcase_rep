
import { supabase } from '@/integrations/supabase/client';
import { createExternalUserNotification } from './notificationUtils';

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
        submitted_by_user:users!cases_submitted_by_fkey(id, name, email, user_type, role_id, roles(name))
      `)
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('🔔 Error fetching case for notification:', caseError);
      return;
    }

    console.log('🔔 Case data:', caseData);

    // Check if the submitter is an external user (citizen)
    const submitterUser = caseData.submitted_by_user;
    const isExternalSubmitter = submitterUser?.user_type === 'external' || submitterUser?.roles?.name === 'citizen';
    
    if (!isExternalSubmitter) {
      console.log('🔔 Submitter is not external user, skipping notification. User type:', submitterUser?.user_type, 'Role:', submitterUser?.roles?.name);
      return;
    }

    console.log('🔔 Submitter is external user, creating notification');

    const submitterId = caseData.submitted_by;

    // Create appropriate notification based on update type
    switch (updateType) {
      case 'status_change':
        if (newStatus) {
          // Special handling for case closure or resolution
          if (newStatus === 'closed' || newStatus === 'resolved') {
            await createExternalUserNotification(
              submitterId,
              `Case ${newStatus === 'closed' ? 'Closed' : 'Resolved'} - Feedback Requested`,
              `Your case "${caseTitle}" has been ${newStatus}. We would appreciate your feedback on our service.`,
              caseId,
              'case_closed'
            );
          } else {
            await createExternalUserNotification(
              submitterId,
              'Case Status Updated',
              `Your case "${caseTitle}" status has been updated to: ${newStatus}`,
              caseId,
              'case_status_change'
            );
          }
        }
        break;

      case 'message_added':
        await createExternalUserNotification(
          submitterId,
          'New Message on Your Case',
          `A new message has been added to your case "${caseTitle}": ${message?.substring(0, 100)}${message && message.length > 100 ? '...' : ''}`,
          caseId,
          'new_message'
        );
        break;

      case 'case_closed':
        await createExternalUserNotification(
          submitterId,
          'Case Closed - Feedback Requested',
          `Your case "${caseTitle}" has been closed. We would appreciate your feedback on our service.`,
          caseId,
          'case_closed'
        );
        break;

      default:
        console.log('🔔 Unknown update type:', updateType);
    }

    console.log('🔔 External user notification sent successfully');
  } catch (error) {
    console.error('🔔 Error sending external user notification:', error);
  }
};
