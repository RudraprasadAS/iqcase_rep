
import { useAuth } from './useAuth';
import { createCaseAssignmentNotification, createCaseStatusChangeNotification, createTaskAssignmentNotification } from '@/utils/notificationUtils';
import { supabase } from '@/integrations/supabase/client';

export const useCaseNotifications = () => {
  const { user } = useAuth();

  const notifyOnCaseAssignment = async (assignedUserId: string, caseTitle: string, caseId: string) => {
    if (!user) return;

    try {
      console.log('🔔 Processing case assignment notification:', { assignedUserId, caseTitle, caseId });

      // Get the internal user ID for the assigned user
      const { data: assignedUserData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', assignedUserId) // assuming assignedUserId is already the internal user ID
        .single();

      if (userError) {
        console.error('Error fetching assigned user:', userError);
        return;
      }

      if (assignedUserData) {
        // Get the current user's internal ID
        const { data: currentUserData, error: currentUserError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (currentUserError) {
          console.error('Error fetching current user:', currentUserError);
          return;
        }

        if (currentUserData) {
          const result = await createCaseAssignmentNotification(
            assignedUserData.id,
            caseTitle,
            caseId,
            currentUserData.id
          );
          
          if (result.success) {
            console.log('🔔 Case assignment notification sent successfully');
          } else {
            console.error('🔔 Failed to send case assignment notification:', result.error);
          }
        }
      }
    } catch (error) {
      console.error('Error creating case assignment notification:', error);
    }
  };

  const notifyOnTaskAssignment = async (assignedUserId: string, taskName: string, caseId: string) => {
    if (!user) return;

    try {
      console.log('🔔 Processing task assignment notification:', { assignedUserId, taskName, caseId });

      // Get the current user's internal ID
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (currentUserError) {
        console.error('Error fetching current user:', currentUserError);
        return;
      }

      if (currentUserData) {
        const result = await createTaskAssignmentNotification(
          assignedUserId,
          taskName,
          caseId,
          currentUserData.id
        );
        
        if (result.success) {
          console.log('🔔 Task assignment notification sent successfully');
        } else {
          console.error('🔔 Failed to send task assignment notification:', result.error);
        }
      }
    } catch (error) {
      console.error('Error creating task assignment notification:', error);
    }
  };

  const notifyOnStatusChange = async (caseId: string, caseTitle: string, newStatus: string, notifyUserId?: string) => {
    if (!notifyUserId) return;

    try {
      console.log('🔔 Processing status change notification:', { caseId, caseTitle, newStatus, notifyUserId });

      const result = await createCaseStatusChangeNotification(
        notifyUserId,
        caseTitle,
        newStatus,
        caseId
      );
      
      if (result.success) {
        console.log('🔔 Status change notification sent successfully');
      } else {
        console.error('🔔 Failed to send status change notification:', result.error);
      }
    } catch (error) {
      console.error('Error creating case status change notification:', error);
    }
  };

  return {
    notifyOnCaseAssignment,
    notifyOnTaskAssignment,
    notifyOnStatusChange
  };
};
