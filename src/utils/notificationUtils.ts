
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
    console.log('🔔 CHECKING USER TYPE for userId:', userId);

    const { data, error } = await supabase
      .from('users')
      .select('user_type, role_id, roles(name)')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('🔔 ERROR checking user type:', error);
      return false;
    }

    console.log('🔔 USER DATA:', data);

    // User is external if user_type is 'external' or role is 'citizen'
    const isExternal = data.user_type === 'external' || data.roles?.name === 'citizen';
    console.log('🔔 IS EXTERNAL:', isExternal);
    return isExternal;
  } catch (error) {
    console.error('🔔 EXCEPTION checking user type:', error);
    return false;
  }
};

// Test notification creation function
export const testNotificationCreation = async () => {
  console.log('🔔 TESTING NOTIFICATION CREATION DIRECTLY...');

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('🔔 AUTH ERROR:', authError);
      return { success: false, error: 'No authenticated user' };
    }

    console.log('🔔 AUTH USER:', user.id, user.email);

    // Get internal user
    const { data: internalUser, error: userError } = await supabase
      .from('users')
      .select('id, name, email, user_type, role_id, roles(name)')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !internalUser) {
      console.error('🔔 INTERNAL USER ERROR:', userError);
      return { success: false, error: 'No internal user found' };
    }

    console.log('🔔 INTERNAL USER:', internalUser);

    // Try to insert a test notification
    const testData = {
      user_id: internalUser.id,
      title: 'Test Notification',
      message: 'This is a test notification to debug the system',
      notification_type: 'test',
      is_read: false
    };

    console.log('🔔 INSERTING TEST NOTIFICATION:', testData);

    const { data, error } = await supabase
      .from('notifications')
      .insert(testData)
      .select('*')
      .single();

    if (error) {
      console.error('🔔 INSERTION ERROR:', error);
      console.error('🔔 ERROR CODE:', error.code);
      console.error('🔔 ERROR MESSAGE:', error.message);
      console.error('🔔 ERROR DETAILS:', error.details);
      console.error('🔔 ERROR HINT:', error.hint);
      return { success: false, error };
    }

    console.log('🔔 TEST NOTIFICATION CREATED:', data);
    return { success: true, data };

  } catch (error) {
    console.error('🔔 EXCEPTION in testNotificationCreation:', error);
    return { success: false, error };
  }
};

export const createTaskAssignmentNotification = async (
  assignedUserId: string,
  taskName: string,
  caseId: string,
  createdByUserId: string
) => {
  try {
    console.log('🔔 =================');
    console.log('🔔 TASK ASSIGNMENT NOTIFICATION START');
    console.log('🔔 assignedUserId:', assignedUserId);
    console.log('🔔 taskName:', taskName);
    console.log('🔔 caseId:', caseId);
    console.log('🔔 createdByUserId:', createdByUserId);
    console.log('🔔 =================');

    // First, test basic notification creation
    console.log('🔔 STEP 1: Testing basic notification creation...');
    const testResult = await testNotificationCreation();
    console.log('🔔 TEST RESULT:', testResult);

    // Step 2: Verify the assigned user exists and get their details
    console.log('🔔 STEP 2: Fetching assigned user details...');
    const { data: assignedUserData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, user_type, role_id, roles(name)')
      .eq('id', assignedUserId)
      .single();

    if (userError || !assignedUserData) {
      console.error('🔔 Error fetching assigned user:', userError);
      return { success: false, error: userError };
    }

    console.log('🔔 Assigned user data retrieved:', assignedUserData);

    // Step 3: Check if user is external - external users shouldn't get task assignment notifications
    console.log('🔔 STEP 3: Checking if user is external...');
    const isExternal = assignedUserData.user_type === 'external' || assignedUserData.roles?.name === 'citizen';
    console.log('🔔 User external status:', { 
      user_type: assignedUserData.user_type, 
      role_name: assignedUserData.roles?.name,
      isExternal: isExternal 
    });
    
    if (isExternal) {
      console.log('🔔 Skipping task assignment notification for external user');
      return { success: true, message: 'External users do not receive task assignment notifications' };
    }

    // Step 4: Get creator details for a more descriptive message
    console.log('🔔 STEP 4: Fetching creator details...');
    const { data: creatorData, error: creatorError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', createdByUserId)
      .single();

    if (creatorError) {
      console.error('🔔 Error fetching creator data:', creatorError);
    }

    const creatorName = creatorData?.name || 'A colleague';
    const message = `${creatorName} assigned you a new task: "${taskName}"`;

    console.log('🔔 STEP 5: Creating notification with message:', message);

    // Step 6: Insert the notification
    console.log('🔔 STEP 6: Inserting notification into database...');
    const notificationData = {
      user_id: assignedUserId,
      title: 'New Task Assigned',
      message: message,
      notification_type: 'task_assignment',
      case_id: caseId,
      is_read: false
    };
    
    console.log('🔔 Notification data to insert:', notificationData);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select('*')
      .single();
      
    if (error) {
      console.error('🔔 DATABASE ERROR creating notification:', error);
      console.error('🔔 Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return { success: false, error };
    }
    
    if (!data) {
      console.error('🔔 ERROR: No data returned from notification insert');
      return { success: false, error: 'No data returned from insert' };
    }
    
    console.log('🔔 SUCCESS: Task assignment notification created:', data);
    return { success: true, data };
  } catch (error) {
    console.error('🔔 EXCEPTION in createTaskAssignmentNotification:', error);
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
