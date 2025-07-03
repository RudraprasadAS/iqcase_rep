import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './notificationService';

// Create notifications for all users who should be notified about case activities
export const notifyRelevantUsers = async (
  caseId: string,
  activityType: string,
  message: string,
  performedBy: string,
  excludeUserId?: string
) => {
  try {
    console.log('🔔 Creating activity notifications for case:', caseId, 'activity:', activityType);

    // Get case data and related users
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        id,
        title,
        submitted_by,
        assigned_to,
        users!cases_submitted_by_fkey(id, name, user_type),
        assigned_user:users!cases_assigned_to_fkey(id, name, user_type)
      `)
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('🔔 Error fetching case data:', caseError);
      return;
    }

    // Get watchers
    const { data: watchers, error: watchersError } = await supabase
      .from('case_watchers')
      .select(`
        user_id,
        users!case_watchers_user_id_fkey(id, name, user_type)
      `)
      .eq('case_id', caseId);

    if (watchersError) {
      console.error('🔔 Error fetching watchers:', watchersError);
    }

    // Get users with tasks on this case
    const { data: taskUsers, error: taskError } = await supabase
      .from('case_tasks')
      .select(`
        assigned_to,
        users!case_tasks_assigned_to_fkey(id, name, user_type)
      `)
      .eq('case_id', caseId)
      .not('assigned_to', 'is', null);

    if (taskError) {
      console.error('🔔 Error fetching task users:', taskError);
    }

    // Collect all relevant users
    const relevantUsers = new Set<string>();

    // Add case submitter (if internal user)
    if (caseData.users?.user_type === 'internal' && caseData.submitted_by !== excludeUserId) {
      relevantUsers.add(caseData.submitted_by);
    }

    // Add assigned user
    if (caseData.assigned_to && caseData.assigned_to !== excludeUserId) {
      relevantUsers.add(caseData.assigned_to);
    }

    // Add watchers (internal users only)
    watchers?.forEach(watcher => {
      if (watcher.users?.user_type === 'internal' && watcher.user_id !== excludeUserId) {
        relevantUsers.add(watcher.user_id);
      }
    });

    // Add task assignees (internal users only)
    taskUsers?.forEach(taskUser => {
      if (taskUser.users?.user_type === 'internal' && taskUser.assigned_to !== excludeUserId) {
        relevantUsers.add(taskUser.assigned_to);
      }
    });

    // Create notifications for all relevant users
    const notificationPromises = Array.from(relevantUsers).map(userId =>
      createNotification({
        userId,
        title: getNotificationTitle(activityType),
        message: `${message} on case "${caseData.title}"`,
        type: getNotificationType(activityType),
        caseId
      })
    );

    await Promise.all(notificationPromises);
    console.log('🔔 Activity notifications created for', relevantUsers.size, 'users');

  } catch (error) {
    console.error('🔔 Error creating activity notifications:', error);
  }
};

const getNotificationTitle = (activityType: string): string => {
  switch (activityType) {
    case 'message_added':
      return 'New Message';
    case 'task_created':
      return 'New Task Created';
    case 'task_completed':
      return 'Task Completed';
    case 'status_changed':
      return 'Case Status Updated';
    case 'case_assigned':
      return 'Case Assignment Changed';
    case 'attachment_added':
      return 'New Attachment';
    case 'case_note_added':
      return 'New Note Added';
    case 'watcher_added':
      return 'New Watcher Added';
    default:
      return 'Case Activity';
  }
};

const getNotificationType = (activityType: string): string => {
  switch (activityType) {
    case 'message_added':
      return 'new_message';
    case 'task_created':
    case 'task_completed':
      return 'task_update';
    case 'status_changed':
      return 'case_status_change';
    case 'case_assigned':
      return 'case_assignment';
    case 'attachment_added':
      return 'attachment';
    case 'case_note_added':
      return 'note';
    case 'watcher_added':
      return 'watcher_added';
    default:
      return 'case_update';
  }
};