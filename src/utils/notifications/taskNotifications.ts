
import { supabase } from '@/integrations/supabase/client';
import { NotificationResult } from './types';
import { testNotificationCreation } from './helpers';

export const createTaskAssignmentNotification = async (
  assignedUserId: string,
  taskName: string,
  caseId: string,
  createdByUserId: string
): Promise<NotificationResult> => {
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
