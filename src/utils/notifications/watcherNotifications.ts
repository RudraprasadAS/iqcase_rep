
import { supabase } from '@/integrations/supabase/client';
import { NotificationResult } from './types';

export const createWatcherAddedNotification = async (
  userId: string,
  caseTitle: string,
  caseId: string
): Promise<NotificationResult> => {
  try {
    console.log('🔔 Creating watcher added notification:', {
      userId,
      title: 'Added as Watcher',
      type: 'watcher_added',
      caseId
    });
    
    const message = `You have been added as a watcher to case: ${caseTitle}`;
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Added as Watcher',
        message: message,
        notification_type: 'watcher_added',
        case_id: caseId,
        is_read: false
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('🔔 Error creating watcher notification:', error);
      return { success: false, error };
    }
    
    console.log('🔔 Watcher notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('🔔 Exception creating watcher notification:', error);
    return { success: false, error };
  }
};
