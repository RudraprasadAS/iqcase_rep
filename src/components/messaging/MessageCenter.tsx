
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Paperclip, X, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  case_id: string;
  message: string;
  sender_id: string;
  is_internal: boolean;
  created_at: string;
  users: { name: string } | null;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  created_at: string;
}

interface MessageCenterProps {
  caseId: string;
  isInternal?: boolean;
}

const MessageCenter = ({ caseId, isInternal = false }: MessageCenterProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (caseId) {
      fetchMessages();
      fetchAttachments();
    }
  }, [caseId]);

  const fetchInternalUserId = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('User lookup error:', userError);
        return;
      }

      if (userData) {
        setInternalUserId(userData.id);
      }
    } catch (error) {
      console.error('Error fetching internal user ID:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('case_messages')
        .select(`
          *,
          users!case_messages_sender_id_fkey(name)
        `)
        .eq('case_id', caseId)
        .eq('is_internal', isInternal)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Messages fetch error:', error);
        throw error;
      }

      console.log('Messages fetched:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('case_attachments')
        .select('*')
        .eq('case_id', caseId)
        .eq('is_private', isInternal)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Attachments fetch error:', error);
        throw error;
      }

      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
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
        
        console.log('Uploading message file:', fileName);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('case-attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw uploadError;
        }

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
            uploaded_by: internalUserId,
            is_private: isInternal
          });

        if (attachmentError) {
          console.error('Attachment record error:', attachmentError);
          throw attachmentError;
        }

        console.log('Message attachment uploaded successfully');
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !internalUserId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('case_messages')
        .insert({
          case_id: caseId,
          message: newMessage.trim(),
          sender_id: internalUserId,
          is_internal: isInternal
        });

      if (error) {
        console.error('Message send error:', error);
        throw error;
      }

      // Upload files if any
      if (files.length > 0) {
        await uploadFiles();
        await fetchAttachments();
      }

      setNewMessage('');
      setFiles([]);
      fetchMessages();
      
      toast({
        title: 'Success',
        description: 'Message sent successfully'
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadAttachment = (attachment: Attachment) => {
    window.open(attachment.file_url, '_blank');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {isInternal ? 'Internal Messages' : 'Case Messages'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No messages yet</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {message.users?.name || 'Unknown User'}
                    </span>
                    <div className="flex items-center gap-2">
                      {message.is_internal && (
                        <Badge variant="secondary" className="text-xs">Internal</Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm">{message.message}</p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Type your ${isInternal ? 'internal ' : ''}message...`}
              rows={3}
              disabled={loading || !internalUserId}
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
                  disabled={loading}
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
              onClick={sendMessage}
              disabled={!newMessage.trim() || loading || !internalUserId}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Message Attachments ({attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{attachment.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAttachment(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MessageCenter;
