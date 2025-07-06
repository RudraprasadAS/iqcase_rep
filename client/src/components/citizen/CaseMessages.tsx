import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Paperclip, X, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import AttachmentViewer from '@/components/attachments/AttachmentViewer';

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  is_internal: boolean;
  users?: { name: string; email: string };
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  created_at: string;
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
  const [messageAttachments, setMessageAttachments] = useState<Attachment[]>([]);
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    fileName: string;
    fileUrl: string;
    fileType?: string;
  }>({
    isOpen: false,
    fileName: '',
    fileUrl: '',
    fileType: undefined
  });
  const { toast } = useToast();

  // Fetch attachments for citizen portal - only public ones
  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('case_attachments')
        .select('*')
        .eq('case_id', caseId)
        .eq('is_private', false) // Only public attachments for citizens
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching attachments:', error);
        return;
      }

      setMessageAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  // Fetch attachments when component mounts
  useState(() => {
    fetchAttachments();
  });

  const getMessageAttachments = (messageId: string, messageCreatedAt: string) => {
    // Get attachments created within 2 minutes of the message
    const messageTime = new Date(messageCreatedAt).getTime();
    return messageAttachments.filter(attachment => {
      const attachmentTime = new Date(attachment.created_at).getTime();
      const timeDiff = Math.abs(attachmentTime - messageTime);
      return timeDiff <= 2 * 60 * 1000; // 2 minutes in milliseconds
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewAttachment = (attachment: Attachment) => {
    setViewerState({
      isOpen: true,
      fileName: attachment.file_name,
      fileUrl: attachment.file_url,
      fileType: attachment.file_type
    });
  };

  const closeViewer = () => {
    setViewerState({
      isOpen: false,
      fileName: '',
      fileUrl: '',
      fileType: undefined
    });
  };

  const downloadAttachment = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.file_url;
    link.download = attachment.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            is_private: false // Public attachments for citizen portal
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
        await fetchAttachments(); // Refresh attachments
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

  // Filter messages to only show non-internal messages and exclude messages from citizens in internal context
  const publicMessages = messages.filter(message => 
    !message.is_internal && 
    message.users?.name !== undefined // Ensure we have user info
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Case Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {publicMessages.map((message) => {
              const attachments = getMessageAttachments(message.id, message.created_at);
              return (
                <div key={message.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(message.users?.name || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">
                        {message.users?.name || 'Support Staff'}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {formatDateTime(message.created_at)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm bg-muted rounded-lg p-3">
                      {message.message}
                    </div>
                    
                    {/* Display attachments with view and download buttons */}
                    {attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs text-gray-500 font-medium">Attachments:</div>
                        {attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate" title={attachment.file_name}>{attachment.file_name}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewAttachment(attachment)}
                                className="h-6 px-2"
                                title="View file"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadAttachment(attachment)}
                                className="h-6 px-2"
                                title="Download file"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded min-w-0">
                      <span className="text-sm truncate flex-1" title={file.name}>{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0 ml-2"
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

      <AttachmentViewer
        isOpen={viewerState.isOpen}
        onClose={closeViewer}
        fileName={viewerState.fileName}
        fileUrl={viewerState.fileUrl}
        fileType={viewerState.fileType}
      />
    </>
  );
};

export default CaseMessages;
