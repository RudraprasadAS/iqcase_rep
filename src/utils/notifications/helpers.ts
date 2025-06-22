
import { supabase } from '@/integrations/supabase/client';

// Helper function to determine if user is external/citizen
export const isExternalUser = async (userId: string): Promise<boolean> => {
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
