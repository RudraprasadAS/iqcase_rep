
import { supabase } from '@/integrations/supabase/client';
import { 
  createNotification, 
  createCaseAssignmentNotification, 
  createTaskAssignmentNotification 
} from './notificationUtils';
import { notifyExternalUserOfCaseUpdate } from './externalNotificationUtils';

export const notifyOnCaseAssignment = async (
  caseId: string, 
  caseTitle: string, 
  assignedUserId: string, 
  assignedByUserId: string
) => {
  try {
    console.log('🔔 Processing case assignment notification:', {
      caseId,
      caseTitle,
      assignedUserId,
      assignedByUserId
    });

    // Create notification for the assigned user
    await createCaseAssignmentNotification(
      assignedUserId,
      caseTitle,
      caseId,
      assignedByUserId
    );

    // Also notify external users if applicable
    await notifyExternalUserOfCaseUpdate(
      caseId,
      caseTitle,
      'status_change',
      'assigned',
      `Case has been assigned to a team member`,
      assignedByUserId
    );

    console.log('🔔 Case assignment notifications sent successfully');
  } catch (error) {
    console.error('🔔 Error sending case assignment notifications:', error);
  }
};

export const notifyOnTaskAssignment = async (
  taskName: string,
  caseId: string,
  assignedUserId: string,
  createdByUserId: string
) => {
  try {
    console.log('🔔 Processing task assignment notification:', {
      taskName,
      caseId,
      assignedUserId,
      createdByUserId
    });

    await createTaskAssignmentNotification(
      assignedUserId,
      taskName,
      caseId,
      createdByUserId
    );

    console.log('🔔 Task assignment notification sent successfully');
  } catch (error) {
    console.error('🔔 Error sending task assignment notification:', error);
  }
};

export const notifyOnWatcherAdded = async (
  caseId: string,
  caseTitle: string,
  watcherUserId: string,
  addedByUserId: string
) => {
  try {
    console.log('🔔 Processing watcher added notification:', {
      caseId,
      caseTitle,
      watcherUserId,
      addedByUserId
    });

    await createNotification({
      userId: watcherUserId,
      title: 'Added as Watcher',
      message: `You have been added as a watcher on case "${caseTitle}"`,
      type: 'watcher_added',
      caseId: caseId
    });

    console.log('🔔 Watcher added notification sent successfully');
  } catch (error) {
    console.error('🔔 Error sending watcher added notification:', error);
  }
};

export const notifyOnStatusChange = async (
  caseId: string,
  caseTitle: string,
  newStatus: string,
  changedByUserId: string
) => {
  try {
    console.log('🔔 Processing status change notification:', {
      caseId,
      caseTitle,
      newStatus,
      changedByUserId
    });

    // Get all watchers and assigned users for this case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        case_watchers!inner(user_id),
        assigned_to_user:users!cases_assigned_to_fkey(id)
      `)
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('🔔 Error fetching case for status change notification:', caseError);
      return;
    }

    // Notify assigned user if different from the one making the change
    if (caseData.assigned_to && caseData.assigned_to !== changedByUserId) {
      await createNotification({
        userId: caseData.assigned_to,
        title: 'Case Status Updated',
        message: `Case "${caseTitle}" status has been changed to: ${newStatus}`,
        type: 'case_status_change',
        caseId: caseId
      });
    }

    // Notify all watchers except the one making the change
    for (const watcher of caseData.case_watchers || []) {
      if (watcher.user_id !== changedByUserId) {
        await createNotification({
          userId: watcher.user_id,
          title: 'Case Status Updated',
          message: `Case "${caseTitle}" status has been changed to: ${newStatus}`,
          type: 'case_status_change',
          caseId: caseId
        });
      }
    }

    // Notify external user (case submitter) if applicable
    await notifyExternalUserOfCaseUpdate(
      caseId,
      caseTitle,
      'status_change',
      newStatus,
      undefined,
      changedByUserId
    );

    console.log('🔔 Status change notifications sent successfully');
  } catch (error) {
    console.error('🔔 Error sending status change notifications:', error);
  }
};

export const notifyOnNewMessage = async (
  caseId: string,
  caseTitle: string,
  message: string,
  senderUserId: string,
  isInternal: boolean = false
) => {
  try {
    console.log('🔔 Processing new message notification:', {
      caseId,
      caseTitle,
      senderUserId,
      isInternal
    });

    // Get case details including watchers and assigned user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        case_watchers!inner(user_id),
        assigned_to_user:users!cases_assigned_to_fkey(id),
        submitted_by_user:users!cases_submitted_by_fkey(id, user_type)
      `)
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('🔔 Error fetching case for message notification:', caseError);
      return;
    }

    // Notify assigned user if different from sender
    if (caseData.assigned_to && caseData.assigned_to !== senderUserId) {
      await createNotification({
        userId: caseData.assigned_to,
        title: 'New Message on Case',
        message: `New message on case "${caseTitle}": ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        type: 'new_message',
        caseId: caseId
      });
    }

    // Notify all watchers except sender
    for (const watcher of caseData.case_watchers || []) {
      if (watcher.user_id !== senderUserId) {
        await createNotification({
          userId: watcher.user_id,
          title: 'New Message on Watched Case',
          message: `New message on case "${caseTitle}": ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
          type: 'new_message',
          caseId: caseId
        });
      }
    }

    // If this is not an internal message, notify external user (submitter)
    if (!isInternal) {
      await notifyExternalUserOfCaseUpdate(
        caseId,
        caseTitle,
        'message_added',
        undefined,
        message,
        senderUserId
      );
    }

    console.log('🔔 New message notifications sent successfully');
  } catch (error) {
    console.error('🔔 Error sending new message notifications:', error);
  }
};
