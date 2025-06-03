
import { useAuth } from './useAuth';
import { createCaseAssignmentNotification, createCaseStatusChangeNotification } from '@/utils/notificationUtils';
import { supabase } from '@/integrations/supabase/client';

export const useCaseNotifications = () => {
  const { user } = useAuth();

  const notifyOnCaseAssignment = async (assignedUserId: string, caseTitle: string, caseId: string) => {
    if (!user) return;

    try {
      // Get the internal user ID for the assigned user
      const { data: assignedUserData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', assignedUserId)
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
          await createCaseAssignmentNotification(
            assignedUserData.id,
            caseTitle,
            caseId,
            currentUserData.id
          );
        }
      }
    } catch (error) {
      console.error('Error creating case assignment notification:', error);
    }
  };

  const notifyOnStatusChange = async (caseId: string, caseTitle: string, newStatus: string, notifyUserId?: string) => {
    if (!notifyUserId) return;

    try {
      // Get the internal user ID for the user to notify
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', notifyUserId)
        .single();

      if (userError) {
        console.error('Error fetching user to notify:', userError);
        return;
      }

      if (userData) {
        await createCaseStatusChangeNotification(
          userData.id,
          caseTitle,
          newStatus,
          caseId
        );
      }
    } catch (error) {
      console.error('Error creating case status change notification:', error);
    }
  };

  return {
    notifyOnCaseAssignment,
    notifyOnStatusChange
  };
};
