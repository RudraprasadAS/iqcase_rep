
import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  caseId?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    console.log('🔔 Creating notification:', params);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        notification_type: params.type || 'general',
        case_id: params.caseId || null,
        is_read: false
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('🔔 Error creating notification:', error);
      return { success: false, error };
    }
    
    console.log('🔔 Notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('🔔 Exception creating notification:', error);
    return { success: false, error };
  }
};

export const createTaskAssignmentNotification = async (
  assignedUserId: string,
  taskName: string,
  caseId: string,
  createdByUserId: string
) => {
  console.log('🔔 Creating task assignment notification:', {
    assignedUserId,
    taskName,
    caseId,
    createdByUserId
  });

  // Get creator name
  const { data: creatorData } = await supabase
    .from('users')
    .select('name')
    .eq('id', createdByUserId)
    .single();

  const creatorName = creatorData?.name || 'A colleague';
  const message = `${creatorName} assigned you a new task: "${taskName}"`;

  return createNotification({
    userId: assignedUserId,
    title: 'New Task Assigned',
    message: message,
    type: 'task_assignment',
    caseId: caseId
  });
};

export const createWatcherAddedNotification = async (
  userId: string,
  caseTitle: string,
  caseId: string
) => {
  console.log('🔔 Creating watcher added notification:', {
    userId,
    caseTitle,
    caseId
  });

  const message = `You have been added as a watcher to case: ${caseTitle}`;

  return createNotification({
    userId: userId,
    title: 'Added as Watcher',
    message: message,
    type: 'watcher_added',
    caseId: caseId
  });
};

export const createCaseAssignmentNotification = async (
  assignedUserId: string,
  caseTitle: string,
  caseId: string,
  createdByUserId: string
) => {
  console.log('🔔 Creating case assignment notification:', {
    assignedUserId,
    caseTitle,
    caseId
  });

  const message = `You have been assigned a new case: "${caseTitle}"`;

  return createNotification({
    userId: assignedUserId,
    title: 'New Case Assigned',
    message: message,
    type: 'case_assignment',
    caseId: caseId
  });
};
