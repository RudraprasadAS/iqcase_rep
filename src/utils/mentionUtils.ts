
import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './notificationUtils';

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

// Extract @mentions from text
export const extractMentions = (text: string): string[] => {
  // Match @username pattern
  const mentionRegex = /@(\w+)/g;
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
      .eq('user_type', 'internal')
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

// Process @mentions in text and create notifications
export const processMentionsAndNotify = async (
  text: string,
  caseId: string,
  sourceId: string,
  sourceType: string,
  senderId: string
): Promise<string> => {
  try {
    // Get all possible mentions in the text
    const mentionNames = extractMentions(text);
    if (!mentionNames.length) return text;
    
    // Fetch all internal users to match against mentions
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('user_type', 'internal')
      .eq('is_active', true);
      
    if (error || !users) {
      console.error('Error fetching users for mention processing:', error);
      return text;
    }
    
    // Track users we've already notified in this message to avoid duplicates
    const notifiedUsers = new Set<string>();
    let processedText = text;
    
    // For each potential mention, check if it matches a user and notify them
    for (const mentionName of mentionNames) {
      // Find users whose names match the mention (case insensitive)
      const matchedUsers = users.filter(user => {
        // Extract first name or username from full name
        const firstName = user.name.split(' ')[0].toLowerCase();
        const username = user.email.split('@')[0].toLowerCase();
        return firstName === mentionName.toLowerCase() || username === mentionName.toLowerCase();
      });
      
      if (matchedUsers.length > 0) {
        // We'll use the first matched user (could be improved to handle ambiguity)
        const user = matchedUsers[0];
        
        // Skip if this is the sender mentioning themselves or already notified
        if (user.id === senderId || notifiedUsers.has(user.id)) continue;
        
        // Replace @mention with formatted version in the text
        const mentionRegex = new RegExp(`@${mentionName}\\b`, 'g');
        processedText = processedText.replace(mentionRegex, `@${user.name.split(' ')[0]}`);
        
        // Create a notification for the mentioned user
        await createNotification({
          userId: user.id,
          title: 'You were mentioned in a case',
          message: `You were mentioned in case #${caseId.slice(0, 8)}`,
          type: 'mention',
          caseId: caseId
        });
        
        // Mark this user as notified
        notifiedUsers.add(user.id);
      }
    }
    
    return processedText;
  } catch (error) {
    console.error('Error processing mentions:', error);
    return text;
  }
};
