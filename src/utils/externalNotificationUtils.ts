
import { supabase } from '@/integrations/supabase/client';
import { createCaseStatusChangeNotification, createNotification } from './notificationUtils';

export const notifyExternalUserOfCaseUpdate = async (
  caseId: string,
  caseTitle: string,
  updateType: 'status_change' | 'message_added' | 'case_closed' | 'task_assigned' | 'case_related' | 'case_assigned',
  newStatus?: string,
  message?: string,
  updatedByUserId?: string,
  taskName?: string,
  relatedCaseId?: string
) => {
  try {
    console.log('🔔 Notifying external user of case update:', {
      caseId,
      updateType,
      newStatus,
      message,
      taskName,
      relatedCaseId
    });

    // Get the case details and submitter
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        submitted_by_user:users!cases_submitted_by_fkey(name, email, user_type),
        assigned_to_user:users!cases_assigned_to_fkey(name, email, user_type)
      `)
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('🔔 Error fetching case for notification:', caseError);
      return;
    }

    // Collect all users to notify (avoid duplicates)
    const usersToNotify = new Set<string>();

    // Always notify the submitter if they're external
    if (caseData.submitted_by_user?.user_type === 'external') {
      usersToNotify.add(caseData.submitted_by);
    }

    // Notify assigned user if they're external and different from submitter
    if (caseData.assigned_to && 
        caseData.assigned_to_user?.user_type === 'external' && 
        caseData.assigned_to !== caseData.submitted_by) {
      usersToNotify.add(caseData.assigned_to);
    }

    // Get case watchers who are external
    const { data: watchers } = await supabase
      .from('case_watchers')
      .select('user_id, users!case_watchers_user_id_fkey(user_type)')
      .eq('case_id', caseId);

    if (watchers) {
      watchers.forEach(watcher => {
        if (watcher.users?.user_type === 'external') {
          usersToNotify.add(watcher.user_id);
        }
      });
    }

    // Create notifications for each user
    for (const userId of usersToNotify) {
      switch (updateType) {
        case 'case_assigned':
          await createNotification({
            userId: userId,
            title: 'Case Assigned',
            message: `Your case "${caseTitle}" has been assigned to a team member for handling.`,
            type: 'case_assignment',
            caseId: caseId
          });
          break;

        case 'status_change':
          if (newStatus) {
            if (newStatus === 'closed' || newStatus === 'resolved') {
              await createNotification({
                userId: userId,
                title: `Case ${newStatus === 'closed' ? 'Closed' : 'Resolved'} - Feedback Requested`,
                message: `Your case "${caseTitle}" has been ${newStatus}. We would appreciate your feedback on our service.`,
                type: 'case_closed',
                caseId: caseId
              });
            } else {
              await createCaseStatusChangeNotification(
                userId,
                caseTitle,
                newStatus,
                caseId
              );
            }
          }
          break;

        case 'message_added':
          await createNotification({
            userId: userId,
            title: 'New Message on Your Case',
            message: `A new message has been added to your case "${caseTitle}": ${message?.substring(0, 100)}${message && message.length > 100 ? '...' : ''}`,
            type: 'new_message',
            caseId: caseId
          });
          break;

        case 'task_assigned':
          if (taskName) {
            await createNotification({
              userId: userId,
              title: 'New Task Added to Your Case',
              message: `A new task "${taskName}" has been added to your case "${caseTitle}".`,
              type: 'task_assignment',
              caseId: caseId
            });
          }
          break;

        case 'case_related':
          if (relatedCaseId) {
            await createNotification({
              userId: userId,
              title: 'Case Linked to Related Case',
              message: `Your case "${caseTitle}" has been linked to another case for better coordination.`,
              type: 'case_related',
              caseId: caseId
            });
          }
          break;

        case 'case_closed':
          await createNotification({
            userId: userId,
            title: 'Case Closed - Feedback Requested',
            message: `Your case "${caseTitle}" has been closed. We would appreciate your feedback on our service.`,
            type: 'case_closed',
            caseId: caseId
          });
          break;

        default:
          console.log('🔔 Unknown update type:', updateType);
      }
    }

    console.log('🔔 External user notifications sent successfully to', usersToNotify.size, 'users');
  } catch (error) {
    console.error('🔔 Error sending external user notification:', error);
  }
};

// Notify internal users about case updates
export const notifyInternalUsersOfCaseUpdate = async (
  caseId: string,
  caseTitle: string,
  updateType: 'message_added' | 'task_assigned' | 'case_related' | 'status_change' | 'case_assigned',
  updatedByUserId: string,
  message?: string,
  taskName?: string,
  assignedUserId?: string,
  newStatus?: string
) => {
  try {
    console.log('🔔 Notifying internal users of case update:', {
      caseId,
      updateType,
      updatedByUserId,
      message,
      taskName,
      assignedUserId,
      newStatus
    });

    // Get case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        submitted_by_user:users!cases_submitted_by_fkey(name, email, user_type),
        assigned_to_user:users!cases_assigned_to_fkey(name, email, user_type)
      `)
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('🔔 Error fetching case for internal notification:', caseError);
      return;
    }

    // Collect internal users to notify
    const usersToNotify = new Set<string>();

    // Notify case owner (assigned user) if internal and not the one making the update
    if (caseData.assigned_to && 
        caseData.assigned_to_user?.user_type === 'internal' && 
        caseData.assigned_to !== updatedByUserId) {
      usersToNotify.add(caseData.assigned_to);
    }

    // Notify case submitter if internal and not the one making the update
    if (caseData.submitted_by && 
        caseData.submitted_by_user?.user_type === 'internal' && 
        caseData.submitted_by !== updatedByUserId) {
      usersToNotify.add(caseData.submitted_by);
    }

    // For case and task assignments, notify the assigned user specifically
    if ((updateType === 'case_assigned' || updateType === 'task_assigned') && 
        assignedUserId && assignedUserId !== updatedByUserId) {
      usersToNotify.add(assignedUserId);
    }

    // Get internal case watchers
    const { data: watchers } = await supabase
      .from('case_watchers')
      .select('user_id, users!case_watchers_user_id_fkey(user_type)')
      .eq('case_id', caseId);

    if (watchers) {
      watchers.forEach(watcher => {
        if (watcher.users?.user_type === 'internal' && watcher.user_id !== updatedByUserId) {
          usersToNotify.add(watcher.user_id);
        }
      });
    }

    // Get users who have tasks on this case
    const { data: taskUsers } = await supabase
      .from('case_tasks')
      .select('assigned_to, users!case_tasks_assigned_to_fkey(user_type)')
      .eq('case_id', caseId)
      .neq('status', 'completed');

    if (taskUsers) {
      taskUsers.forEach(task => {
        if (task.assigned_to && 
            task.users?.user_type === 'internal' && 
            task.assigned_to !== updatedByUserId) {
          usersToNotify.add(task.assigned_to);
        }
      });
    }

    // Create notifications for each internal user
    for (const userId of usersToNotify) {
      switch (updateType) {
        case 'case_assigned':
          await createNotification({
            userId: userId,
            title: userId === assignedUserId ? 'New Case Assigned to You' : 'Case Assignment Updated',
            message: userId === assignedUserId 
              ? `You have been assigned to case: "${caseTitle}"`
              : `Case "${caseTitle}" has been assigned to a team member`,
            type: 'case_assignment',
            caseId: caseId
          });
          break;

        case 'message_added':
          await createNotification({
            userId: userId,
            title: 'New Message on Case',
            message: `A new message was added to case "${caseTitle}": ${message?.substring(0, 100)}${message && message.length > 100 ? '...' : ''}`,
            type: 'new_message',
            caseId: caseId
          });
          break;

        case 'task_assigned':
          if (taskName) {
            await createNotification({
              userId: userId,
              title: userId === assignedUserId ? 'New Task Assigned to You' : 'New Task Added to Case',
              message: userId === assignedUserId 
                ? `You have been assigned a new task: "${taskName}" on case "${caseTitle}"`
                : `A new task "${taskName}" has been added to case "${caseTitle}"`,
              type: 'task_assignment',
              caseId: caseId
            });
          }
          break;

        case 'case_related':
          await createNotification({
            userId: userId,
            title: 'Case Linked to Related Case',
            message: `Case "${caseTitle}" has been linked to a related case.`,
            type: 'case_related',
            caseId: caseId
          });
          break;

        case 'status_change':
          if (newStatus) {
            await createCaseStatusChangeNotification(
              userId,
              caseTitle,
              newStatus,
              caseId
            );
          }
          break;
      }
    }

    console.log('🔔 Internal user notifications sent successfully to', usersToNotify.size, 'users');
  } catch (error) {
    console.error('🔔 Error sending internal user notifications:', error);
  }
};
