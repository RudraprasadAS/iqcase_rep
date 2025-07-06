
import { supabase } from '@/integrations/supabase/client';
import { CreateNotificationParams, NotificationResult } from './types';

export const createNotification = async (params: CreateNotificationParams): Promise<NotificationResult> => {
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
