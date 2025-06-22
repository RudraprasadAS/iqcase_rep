
import { supabase } from '@/integrations/supabase/client';
import { NotificationResult } from './types';
import { isExternalUser } from './helpers';

export const createCaseAssignmentNotification = async (
  assignedUserId: string,
  caseTitle: string,
  caseId: string,
  createdByUserId: string
): Promise<NotificationResult> => {
  try {
    console.log('🔔 Creating case assignment notification:', {
      userId: assignedUserId,
      title: 'New Case Assigned',
      type: 'case_assignment',
      caseId: caseId
    });
    
    // Check if user is external - external users shouldn't get case assignment notifications
    const isExternal = await isExternalUser(assignedUserId);
    if (isExternal) {
      console.log('🔔 Skipping case assignment notification for external user');
      return { success: true, message: 'External users do not receive case assignment notifications' };
    }
    
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
): Promise<NotificationResult> => {
  try {
    console.log('🔔 Creating case status change notification:', {
      userId: userId,
      title: 'Case Status Updated',
      type: 'case_status_change',
      caseId: caseId,
      newStatus: newStatus
    });
    
    // Always notify users about status changes, both internal and external
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

export const createExternalUserNotification = async (
  userId: string,
  title: string,
  message: string,
  caseId: string,
  notificationType: string = 'case_update'
): Promise<NotificationResult> => {
  try {
    console.log('🔔 Creating external user notification:', {
      userId,
      title,
      type: notificationType,
      caseId
    });
    
    // Verify this is actually an external user
    const isExternal = await isExternalUser(userId);
    if (!isExternal) {
      console.log('🔔 User is not external, using regular notification flow');
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: title,
        message: message,
        notification_type: notificationType,
        case_id: caseId,
        is_read: false
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('🔔 Error creating external user notification:', error);
      return { success: false, error };
    }
    
    console.log('🔔 External user notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('🔔 Exception creating external user notification:', error);
    return { success: false, error };
  }
};
