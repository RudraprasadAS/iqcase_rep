import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Paperclip, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  is_internal: boolean;
  users?: { name: string; email: string };
}

interface CaseMessagesProps {
  messages: Message[];
  caseId: string;
  onMessagesUpdated: () => void;
}

const CaseMessages = ({ messages, caseId, onMessagesUpdated }: CaseMessagesProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${caseId}/messages/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('case-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('case-attachments')
          .getPublicUrl(fileName);

        const { error: attachmentError } = await supabase
          .from('case_attachments')
          .insert({
            case_id: caseId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            uploaded_by: null, // Will be set by the backend
            is_private: false
          });

        if (attachmentError) throw attachmentError;
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        toast({
          title: 'Warning',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive'
        });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    setSendingMessage(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        console.error('Auth error:', authError);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (userError) {
        console.error('User lookup error:', userError);
        return;
      }

      const { error } = await supabase
        .from('case_messages')
        .insert({
          case_id: caseId,
          message: newMessage.trim(),
          sender_id: userData?.id,
          is_internal: false
        });

      if (error) {
        console.error('Message send error:', error);
        throw error;
      }

      // Upload files if any
      if (files.length > 0) {
        await uploadFiles();
      }

      setNewMessage('');
      setFiles([]);
      onMessagesUpdated();
      toast({
        title: "Message sent successfully"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const publicMessages = messages.filter(message => !message.is_internal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Case Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {publicMessages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {(message.users?.name || message.sender_id).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium">
                    {message.users?.name || message.users?.email || message.sender_id}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {formatDateTime(message.created_at)}
                  </span>
                </div>
                <div className="mt-1 text-sm bg-muted rounded-lg p-3">
                  {message.message}
                </div>
              </div>
            </div>
          ))}
          {publicMessages.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No messages yet
            </div>
          )}
        </div>
        <div className="border-t pt-4 space-y-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="mb-2"
            rows={3}
          />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="message-files" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach Files
                  </span>
                </Button>
              </label>
              <Input
                id="message-files"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={sendingMessage}
              />
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleSendMessage} 
            size="sm"
            disabled={sendingMessage || !newMessage.trim()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {sendingMessage ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseMessages;
