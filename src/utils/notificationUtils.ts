
import { supabase } from '@/integrations/supabase/client';

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  caseId?: string
) => {
  try {
    console.log('Creating notification:', { userId, title, type, caseId });

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        notification_type: type,
        case_id: caseId,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }

    console.log('Notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception creating notification:', error);
    return { success: false, error };
  }
};

export const createTaskAssignmentNotification = async (
  assignedUserId: string,
  taskName: string,
  caseId: string,
  createdByUserId: string
) => {
  // Don't create notification if user is assigning task to themselves
  if (assignedUserId === createdByUserId) {
    console.log('Skipping notification - user assigned task to themselves');
    return { success: true, skipped: true };
  }

  return await createNotification(
    assignedUserId,
    'New Task Assigned',
    `You have been assigned a new task: ${taskName}`,
    'task_assignment',
    caseId
  );
};

export const createCaseAssignmentNotification = async (
  assignedUserId: string,
  caseTitle: string,
  caseId: string,
  assignedByUserId: string
) => {
  // Don't create notification if user is assigning case to themselves
  if (assignedUserId === assignedByUserId) {
    console.log('Skipping notification - user assigned case to themselves');
    return { success: true, skipped: true };
  }

  return await createNotification(
    assignedUserId,
    'Case Assigned',
    `You have been assigned to case: ${caseTitle}`,
    'case_assignment',
    caseId
  );
};

export const createCaseStatusChangeNotification = async (
  userId: string,
  caseTitle: string,
  newStatus: string,
  caseId: string
) => {
  return await createNotification(
    userId,
    'Case Status Updated',
    `Case "${caseTitle}" status changed to: ${newStatus}`,
    'case_status_change',
    caseId
  );
};

export const createNewMessageNotification = async (
  userId: string,
  caseTitle: string,
  senderName: string,
  caseId: string
) => {
  return await createNotification(
    userId,
    'New Message',
    `New message from ${senderName} in case: ${caseTitle}`,
    'new_message',
    caseId
  );
};
