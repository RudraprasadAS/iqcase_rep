
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  notifyOnCaseAssignment,
  notifyOnTaskAssignment, 
  notifyOnWatcherAdded,
  notifyOnStatusChange,
  notifyOnNewMessage
} from '@/utils/caseNotificationService';

export const useNotificationService = () => {
  const { user } = useAuth();

  const getCurrentInternalUserId = async () => {
    if (!user) return null;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching internal user ID:', error);
        return null;
      }

      return userData.id;
    } catch (error) {
      console.error('Exception fetching internal user ID:', error);
      return null;
    }
  };

  const notifyCaseAssignment = async (caseId: string, caseTitle: string, assignedUserId: string) => {
    const currentUserId = await getCurrentInternalUserId();
    if (!currentUserId) {
      console.error('🔔 No current user ID for case assignment notification');
      return;
    }

    console.log('🔔 Triggering case assignment notification:', {
      caseId,
      caseTitle,
      assignedUserId,
      currentUserId
    });

    await notifyOnCaseAssignment(caseId, caseTitle, assignedUserId, currentUserId);
  };

  const notifyTaskAssignment = async (taskName: string, caseId: string, assignedUserId: string) => {
    const currentUserId = await getCurrentInternalUserId();
    if (!currentUserId) return;

    await notifyOnTaskAssignment(taskName, caseId, assignedUserId, currentUserId);
  };

  const notifyWatcherAdded = async (caseId: string, caseTitle: string, watcherUserId: string) => {
    const currentUserId = await getCurrentInternalUserId();
    if (!currentUserId) return;

    await notifyOnWatcherAdded(caseId, caseTitle, watcherUserId, currentUserId);
  };

  const notifyStatusChange = async (caseId: string, caseTitle: string, newStatus: string) => {
    const currentUserId = await getCurrentInternalUserId();
    if (!currentUserId) return;

    await notifyOnStatusChange(caseId, caseTitle, newStatus, currentUserId);
  };

  const notifyNewMessage = async (caseId: string, caseTitle: string, message: string, isInternal: boolean = false) => {
    const currentUserId = await getCurrentInternalUserId();
    if (!currentUserId) return;

    await notifyOnNewMessage(caseId, caseTitle, message, currentUserId, isInternal);
  };

  return {
    notifyCaseAssignment,
    notifyTaskAssignment,
    notifyWatcherAdded,
    notifyStatusChange,
    notifyNewMessage
  };
};
