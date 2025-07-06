import { supabase } from '@/integrations/supabase/client';
import { createMentionNotification } from './notifications/notificationService';

interface User {
  id: string;
  name: string;
  email: string;
}

export interface MentionData {
  userId: string;
  userName: string;
  originalText: string;
  startPosition: number;
  endPosition: number;
}

// Extract @mentions from text - enhanced to handle email patterns
export const extractMentions = (text: string): string[] => {
  // Match @username or @email patterns
  const mentionRegex = /@([\w\.-]+@[\w\.-]+|[\w]+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};

// Fetch users that match the mention query
export const searchUsersByMention = async (query: string): Promise<User[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .or(`name.ilike.%${query}%, email.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(10);
    
    if (error) {
      console.error('Error searching users for mentions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception searching users for mentions:', error);
    return [];
  }
};

// Enhanced process @mentions in text and create notifications
export const processMentionsAndNotify = async (
  text: string,
  caseId: string,
  sourceId: string,
  sourceType: string,
  senderId: string
): Promise<string> => {
  try {
    console.log('🔍 Processing mentions in text:', text);
    
    // Get all possible mentions in the text
    const mentionNames = extractMentions(text);
    if (!mentionNames.length) {
      console.log('🔍 No mentions found in text');
      return text;
    }
    
    console.log('🔍 Found potential mentions:', mentionNames);
    
    // Fetch all users to match against mentions
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('is_active', true);
      
    if (error || !users) {
      console.error('Error fetching users for mention processing:', error);
      return text;
    }
    
    console.log('🔍 Available users for matching:', users.length);
    
    // Track users we've already notified in this message to avoid duplicates
    const notifiedUsers = new Set<string>();
    let processedText = text;
    
    // For each potential mention, check if it matches a user and notify them
    for (const mentionPattern of mentionNames) {
      console.log('🔍 Processing mention pattern:', mentionPattern);
      
      // Find users whose names or emails match the mention
      const matchedUsers = users.filter(user => {
        // Check if it's an exact email match
        if (mentionPattern.includes('@') && mentionPattern.includes('.')) {
          return user.email.toLowerCase() === mentionPattern.toLowerCase();
        }
        
        // Check if it's a name match (first name, last name, or username)
        const firstName = user.name.split(' ')[0].toLowerCase();
        const lastName = user.name.split(' ').slice(1).join(' ').toLowerCase();
        const username = user.email.split('@')[0].toLowerCase();
        
        const pattern = mentionPattern.toLowerCase();
        return firstName === pattern || 
               lastName === pattern || 
               username === pattern ||
               user.name.toLowerCase().includes(pattern);
      });
      
      console.log('🔍 Matched users for pattern:', mentionPattern, matchedUsers);
      
      if (matchedUsers.length > 0) {
        // We'll use the first matched user (could be improved to handle ambiguity)
        const user = matchedUsers[0];
        
        // Skip if this is the sender mentioning themselves or already notified
        if (user.id === senderId || notifiedUsers.has(user.id)) {
          console.log('🔍 Skipping notification for user (self or already notified):', user.email);
          continue;
        }
        
        console.log('🔔 Creating mention notification for user:', user.email);
        
        // Replace @mention with formatted version in the text
        const mentionRegex = new RegExp(`@${mentionPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        processedText = processedText.replace(mentionRegex, `@${user.name.split(' ')[0]}`);
        
        // Create a notification for the mentioned user
        try {
          const result = await createMentionNotification(
            user.id,
            senderId,
            caseId,
            sourceId,
            sourceType,
            text
          );
          
          if (result.success) {
            console.log('🔔 Mention notification created successfully for:', user.email);
            notifiedUsers.add(user.id);
          } else {
            console.error('🔔 Failed to create mention notification:', result.error);
          }
        } catch (notificationError) {
          console.error('🔔 Error creating mention notification:', notificationError);
        }
      } else {
        console.log('🔍 No matching users found for mention pattern:', mentionPattern);
      }
    }
    
    console.log('🔔 Mention processing complete. Notified users:', notifiedUsers.size);
    return processedText;
  } catch (error) {
    console.error('Error processing mentions:', error);
    return text;
  }
};
