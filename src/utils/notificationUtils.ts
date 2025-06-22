
import { supabase } from '@/integrations/supabase/client';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  caseId?: string;
  sourceId?: string;
  sourceType?: string;
  metadata?: Record<string, any>;
}

// Helper function to determine if user is external/citizen
const isExternalUser = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_type, role_id, roles(name)')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('🔔 Error checking user type:', error);
      return false;
    }

    // User is external if user_type is 'external' or role is 'citizen'
    return data.user_type === 'external' || data.roles?.name === 'citizen';
  } catch (error) {
    console.error('🔔 Exception checking user type:', error);
    return false;
  }
};

export const createTaskAssignmentNotification = async (
  assignedUserId: string,
  taskName: string,
  caseId: string,
  createdByUserId: string
) => {
  try {
    console.log('🔔 Creating task assignment notification:', {
      assignedUserId: assignedUserId,
      taskName: taskName,
      caseId: caseId,
      createdByUserId: createdByUserId
    });

    // Verify the assigned user exists and get their details
    const { data: assignedUserData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, user_type, role_id, roles(name)')
      .eq('id', assignedUserId)
      .single();

    if (userError || !assignedUserData) {
      console.error('🔔 Error fetching assigned user:', userError);
      return { success: false, error: userError || 'User not found' };
    }

    console.log('🔔 Assigned user data:', assignedUserData);

    // Check if user is external - external users shouldn't get task assignment notifications
    const isExternal = assignedUserData.user_type === 'external' || assignedUserData.roles?.name === 'citizen';
    if (isExternal) {
      console.log('🔔 Skipping task assignment notification for external user');
      return { success: true, message: 'External users do not receive task assignment notifications' };
    }

    // Get creator details for a more descriptive message
    const { data: creatorData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', createdByUserId)
      .single();

    const creatorName = creatorData?.name || 'A colleague';
    const message = `${creatorName} assigned you a new task: "${taskName}"`;
    
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
      console.error('🔔 Error creating task assignment notification:', error);
      return { success: false, error };
    }

    console.log('🔔 Task assignment notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('🔔 Exception creating task assignment notification:', error);
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
) => {
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

export const createMentionNotification = async (
  mentionedUserId: string,
  mentionerUserId: string,
  caseId: string,
  sourceId: string,
  sourceType: string,
  contextMessage: string
) => {
  try {
    console.log('🔔 Creating mention notification:', {
      userId: mentionedUserId,
      mentionerUserId: mentionerUserId,
      title: 'You were mentioned',
      type: 'mention',
      caseId: caseId,
      sourceId: sourceId,
      sourceType: sourceType
    });

    // Get the mentioner's name
    const { data: mentionerData, error: mentionerError } = await supabase
      .from('users')
      .select('name')
      .eq('id', mentionerUserId)
      .single();

    if (mentionerError) {
      console.error('🔔 Error fetching mentioner data:', mentionerError);
      return { success: false, error: mentionerError };
    }

    const mentionerName = mentionerData?.name || 'A colleague';
    const message = `${mentionerName} mentioned you in a message: "${contextMessage.substring(0, 100)}${contextMessage.length > 100 ? '...' : ''}"`;
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: mentionedUserId,
        title: 'You were mentioned',
        message: message,
        notification_type: 'mention',
        case_id: caseId,
        is_read: false
      })
      .select('*')
      .single();

    if (error) {
      console.error('🔔 Error creating mention notification:', error);
      return { success: false, error };
    }

    console.log('🔔 Mention notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('🔔 Exception creating mention notification:', error);
    return { success: false, error };
  }
};

// Create notification for external users (citizens) about case updates
export const createExternalUserNotification = async (
  userId: string,
  title: string,
  message: string,
  caseId: string,
  notificationType: string = 'case_update'
) => {
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

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    console.log('🔔 Creating general notification:', params);

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
      console.error('🔔 Error creating general notification:', error);
      return { success: false, error };
    }

    console.log('🔔 General notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('🔔 Exception creating general notification:', error);
    return { success: false, error };
  }
};
