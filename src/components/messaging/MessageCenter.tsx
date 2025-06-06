import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Paperclip, X, Download, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AttachmentViewer from '@/components/attachments/AttachmentViewer';
import { logMessageAdded } from '@/utils/activityLogger';
import { processMentionsAndNotify } from '@/utils/mentionUtils';

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
  const [messageAttachments, setMessageAttachments] = useState<Attachment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
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

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (caseId) {
      fetchMessages();
      fetchMessageAttachments();
    }
  }, [caseId, isInternal]);

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

  const fetchMessageAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('case_attachments')
        .select('*')
        .eq('case_id', caseId)
        .eq('is_private', isInternal)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Message attachments fetch error:', error);
        throw error;
      }

      setMessageAttachments(data || []);
    } catch (error) {
      console.error('Error fetching message attachments:', error);
    }
  };

  const getMessageAttachments = (messageId: string, messageCreatedAt: string) => {
    // Get attachments created within 5 minutes of the message
    const messageTime = new Date(messageCreatedAt).getTime();
    return messageAttachments.filter(attachment => {
      const attachmentTime = new Date(attachment.created_at).getTime();
      const timeDiff = Math.abs(attachmentTime - messageTime);
      return timeDiff <= 5 * 60 * 1000; // 5 minutes in milliseconds
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
      // Process mentions in the message and create notifications
      let processedMessage = newMessage.trim();
      if (isInternal) {
        console.log('🔔 Processing mentions for internal message');
        processedMessage = await processMentionsAndNotify(
          newMessage.trim(),
          caseId,
          '', // sourceId - will be filled after message is created
          'message',
          internalUserId
        );
      }

      const { data: messageData, error } = await supabase
        .from('case_messages')
        .insert({
          case_id: caseId,
          message: processedMessage,
          sender_id: internalUserId,
          is_internal: isInternal
        })
        .select('*')
        .single();

      if (error) {
        console.error('Message send error:', error);
        throw error;
      }

      console.log('🔔 Message created successfully:', messageData);

      // Log the message activity
      await logMessageAdded(caseId, processedMessage, isInternal, internalUserId);

      // Upload files if any
      if (files.length > 0) {
        await uploadFiles();
        await fetchMessageAttachments();
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

  const [mentionUsers, setMentionUsers] = useState<{ id: string; name: string }[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('id, name');
      if (!error && data) setMentionUsers(data);
    };
    if (isInternal) fetchUsers();
  }, [isInternal]);

  useEffect(() => {
    if (!mentionQuery.trim()) {
      setShowMentions(false);
      return;
    }
    setShowMentions(true);
  }, [mentionQuery]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex((prev) => (prev + 1) % mentionUsers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex((prev) => (prev - 1 + mentionUsers.length) % mentionUsers.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = mentionUsers[mentionIndex];
      const mentionTag = `@${selected.name}`;
      setNewMessage((prev) => prev.replace(/@[^\s]*$/, mentionTag + ' '));
      setMentionQuery('');
      setShowMentions(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    const match = value.match(/@([^\s]*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery('');
      setShowMentions(false);
    }
  };

  return (
    <>
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
                messages.map((message) => {
                  const attachments = getMessageAttachments(message.id, message.created_at);
                  return (
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
                      <p className="text-sm mb-2">{message.message}</p>
                      
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
                  );
                })
              )}
            </div>

            <div className="space-y-2">
              <Textarea
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleTextareaKeyDown}

                placeholder={`Type your ${isInternal ? 'internal ' : ''}message...`}
                rows={3}
                disabled={loading || !internalUserId}
              />
              {showMentions && mentionUsers.length > 0 && (
              
              <div className="border rounded shadow bg-white mt-1 max-h-48 overflow-y-auto">
                {mentionUsers
                  .filter((u) =>
                    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
                  )
                  .map((user, index) => (
                    <div
                      key={user.id}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                        index === mentionIndex ? 'bg-gray-100 font-semibold' : ''
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const mentionTag = `@${user.name}`;
                        setNewMessage((prev) =>
                          prev.replace(/@[^\s]*$/, mentionTag + ' ')
                        );
                        setMentionQuery('');
                        setShowMentions(false);
                      }}
                    >
                      {user.name}
                    </div>
                  ))}
              </div>
            )}

              {/* File upload for both internal and external messages */}
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

        {/* Show message media separately with view and download buttons */}
        {messageAttachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Message Media ({messageAttachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {messageAttachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={attachment.file_name}>{attachment.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewAttachment(attachment)}
                        className="h-8 px-2"
                        title="View file"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAttachment(attachment)}
                        className="h-8 px-2"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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

export default MessageCenter;
