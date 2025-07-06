
import { supabase } from '@/integrations/supabase/client';
import { NotificationResult } from './types';

export const createMentionNotification = async (
  mentionedUserId: string,
  mentionerUserId: string,
  caseId: string,
  sourceId: string,
  sourceType: string,
  contextMessage: string
): Promise<NotificationResult> => {
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
