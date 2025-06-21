import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { triggerCaseMessageNotification } from '@/utils/notificationTriggers';

interface Message {
  id: string;
  case_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  users?: {
    name: string;
    email: string;
  };
}

interface CaseMessagesProps {
  caseId: string;
}

const CaseMessages = ({ caseId }: CaseMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (caseId && internalUserId) {
      fetchMessages();
    }
  }, [caseId, internalUserId]);

  const fetchInternalUserId = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('User lookup error:', userError);
        return;
      }

      setInternalUserId(userData.id);
    } catch (error) {
      console.error('Error fetching internal user ID:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('case_messages')
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !internalUserId) return;

    try {
      const { error } = await supabase
        .from('case_messages')
        .insert({
          case_id: caseId,
          message: newMessage.trim(),
          sender_id: internalUserId,
          message_type: 'text'
        });

      if (error) throw error;

      // Trigger message notification
      console.log('🔔 Triggering case message notification');
      await triggerCaseMessageNotification(
        caseId,
        `Case #${caseId}`, // You might want to pass the actual case title here
        newMessage.trim(),
        internalUserId
      );
      console.log('🔔 Case message notification triggered successfully');

      setNewMessage('');
      fetchMessages();
      
      toast({
        title: "Success",
        description: "Message sent successfully"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${message.users?.email}`} />
                <AvatarFallback>{message.users?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{message.users?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </p>
                </div>
                <p className="text-sm text-gray-800">{message.message}</p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No messages yet. Be the first to send one!
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseMessages;
