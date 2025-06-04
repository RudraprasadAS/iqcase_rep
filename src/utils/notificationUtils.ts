
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
    console.log('🔔 Current auth state:', await supabase.auth.getUser());

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

export const createCaseAssignmentNotification = async (
  assignedUserId: string,
  caseTitle: string,
  caseId: string,
  createdByUserId: string
) => {
  try {
    console.log('🔔 Creating case assignment notification:', {
      userId: assignedUserId,
      title: 'New Case Assigned',
      type: 'case_assignment',
      caseId: caseId
    });

    const message = `You have been assigned a new case: "${caseTitle}"`;
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: assignedUserId,
        title: 'New Case Assigned',
        message: message,
        notification_type: 'case_assignment',
        case_id: caseId,
        is_read: false
      })
      .select('*')
      .single();

    if (error) {
      console.error('🔔 Error creating case assignment notification:', error);
      return { success: false, error };
    }

    console.log('🔔 Case assignment notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('🔔 Exception creating case assignment notification:', error);
    return { success: false, error };
  }
};

export const createCaseStatusChangeNotification = async (
  userId: string,
  caseTitle: string,
  newStatus: string,
  caseId: string
) => {
  try {
    console.log('🔔 Creating case status change notification:', {
      userId: userId,
      title: 'Case Status Updated',
      type: 'case_status_change',
      caseId: caseId,
      newStatus: newStatus
    });

    const message = `Case "${caseTitle}" status has been updated to: ${newStatus}`;
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Case Status Updated',
        message: message,
        notification_type: 'case_status_change',
        case_id: caseId,
        is_read: false
      })
      .select('*')
      .single();

    if (error) {
      console.error('🔔 Error creating case status change notification:', error);
      return { success: false, error };
    }

    console.log('🔔 Case status change notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('🔔 Exception creating case status change notification:', error);
    return { success: false, error };
  }
};

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    console.log('🔔 Creating notification:', params);
    console.log('🔔 Current auth state for notification:', await supabase.auth.getUser());

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
