
import { supabase } from '@/integrations/supabase/client';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  caseId?: string;
}

export const createTaskAssignmentNotification = async (
  assignedUserId: string,
  taskName: string,
  caseId: string,
  createdByUserId: string
) => {
  try {
    console.log('🔔 Creating notification:', {
      userId: assignedUserId,
      title: 'New Task Assigned',
      type: 'task_assignment',
      caseId: caseId
    });

    const message = `You have been assigned a new task: "${taskName}"`;
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: assignedUserId,
        title: 'New Task Assigned',
        message: message,
        notification_type: 'task_assignment',
        case_id: caseId,
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
