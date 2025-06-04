import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, ArrowLeft, MessageSquare, MapPin, FileText, FileImage, Send, Download, Paperclip, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '@/components/cases/StatusBadge';
import PriorityBadge from '@/components/cases/PriorityBadge';
import CaseFeedback from '@/components/cases/CaseFeedback';
import CaseUpdates from '@/components/cases/CaseUpdates';
import { formatDistanceToNow } from 'date-fns';
import { useHtmlToPdf } from '@/hooks/useHtmlToPdf';

interface CaseData {
  id: string;
  title: string;
  status: string;
  priority: string;
  category_id?: string;
  submitted_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  sla_due_at?: string;
  location?: string;
  // Joined user data
  submitted_by_user?: { name: string; email: string };
  assigned_to_user?: { name: string; email: string };
  category?: { name: string };
}

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
  uploaded_by?: string;
}

const CitizenCaseDetail = () => {
  const { id: caseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { exportElementToPDF, isExporting } = useHtmlToPdf();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (caseId) {
      fetchCaseData();
      fetchMessages();
      fetchAttachments();
    }
  }, [caseId]);

  const fetchCaseData = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          submitted_by_user:users!cases_submitted_by_fkey(name, email),
          assigned_to_user:users!cases_assigned_to_fkey(name, email),
          category:case_categories!cases_category_id_fkey(name)
        `)
        .eq('id', caseId)
        .single();

      if (error) {
        console.error('Case fetch error:', error);
        throw error;
      }

      setCaseData(data);
    } catch (error) {
      console.error('Error fetching case:', error);
      toast({
        title: "Error",
        description: "Failed to fetch case details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('case_messages')
        .select(`
          *,
          users!case_messages_sender_id_fkey(name, email)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Messages fetch error:', error);
        throw error;
      }

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
      // Get current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        console.error('Auth error:', authError);
        return;
      }

      // Get internal user ID
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

      setNewMessage('');
      await fetchMessages();
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

  const downloadAttachment = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `#${year}-${shortId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    if (!caseId) {
      toast({
        title: "Error",
        description: "Case ID is missing",
        variant: "destructive"
      });
      return;
    }

    for (const file of files) {
      const filePath = `case-attachments/${caseId}/${file.name}`;
      try {
        const { data, error } = await supabase.storage
          .from('case-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('File upload error:', error);
          toast({
            title: "Error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
        } else {
          // Get the public URL using the getPublicUrl method
          const { data: urlData } = supabase.storage
            .from('case-attachments')
            .getPublicUrl(filePath);
          
          await saveAttachmentToDatabase(file.name, urlData.publicUrl, file.type);
          toast({
            title: "File uploaded",
            description: `${file.name} uploaded successfully`
          });
        }
      } catch (error) {
        console.error('File upload error:', error);
        toast({
          title: "Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }
  };

  const saveAttachmentToDatabase = async (fileName: string, fileUrl: string, fileType?: string) => {
    try {
      // Get current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        console.error('Auth error:', authError);
        return;
      }

      // Get internal user ID
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
        .from('case_attachments')
        .insert({
          case_id: caseId,
          file_name: fileName,
          file_url: fileUrl,
          file_type: fileType,
          uploaded_by: userData?.id
        });

      if (error) {
        console.error('Attachment save error:', error);
        throw error;
      }

      await fetchAttachments();
    } catch (error) {
      console.error('Error saving attachment to database:', error);
      toast({
        title: "Error",
        description: "Failed to save attachment details",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = () => {
    if (caseId && caseData) {
      const caseNumber = generateCaseNumber(caseData.id, caseData.created_at);
      exportElementToPDF('printable-case-content', `Case_Report_${caseNumber}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading case details...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Case not found</div>
      </div>
    );
  }

  const isCaseClosed = caseData.status === 'closed' || caseData.status === 'resolved';

  return (
    <>
      <Helmet>
        <title>Case {generateCaseNumber(caseData.id, caseData.created_at)} - Citizen Portal</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/cases')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{caseData.title}</h1>
              <p className="text-sm text-muted-foreground">
                Case {generateCaseNumber(caseData.id, caseData.created_at)}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <StatusBadge status={caseData.status} />
                <PriorityBadge priority={caseData.priority} />
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            {isExporting ? 'Generating PDF...' : 'Download Case Report (PDF)'}
          </Button>
        </div>

        {/* Printable content wrapper */}
        <div id="printable-case-content" className="space-y-6">
          {/* PDF Header - only visible in PDF */}
          <div className="hidden print:block bg-gray-900 text-white p-6 rounded-lg mb-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Case Management Report</h1>
              <p className="text-lg mt-2">Case {generateCaseNumber(caseData.id, caseData.created_at)}</p>
              <p className="text-sm mt-2">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {isCaseClosed && (
            <Card className="border-2 bg-green-50 border-green-200">
              <CardContent className="py-4">
                <div className="flex items-center text-green-800">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <div>
                    <span className="font-medium">Your case has been {caseData.status}!</span>
                    <p className="text-sm text-green-700 mt-1">
                      We'd love to hear about your experience. Please scroll down to provide feedback.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Core Case Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Core Case Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Case Number</label>
                      <div className="mt-1">{generateCaseNumber(caseData.id, caseData.created_at)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1"><StatusBadge status={caseData.status} /></div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Priority</label>
                      <div className="mt-1"><PriorityBadge priority={caseData.priority} /></div>
                    </div>
                    {caseData.category && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Category</label>
                        <div className="mt-1">{caseData.category.name}</div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <div className="mt-1">{formatDate(caseData.created_at)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <div className="mt-1">{formatDate(caseData.updated_at)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
                      <div className="mt-1">{caseData.submitted_by_user?.name || caseData.submitted_by_user?.email || 'You'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                      <div className="mt-1">{caseData.assigned_to_user?.name || 'Unassigned'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{caseData.description || 'No description provided'}</p>
                  {caseData.location && (
                    <div className="mt-4 flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">{caseData.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Case Updates */}
              <CaseUpdates caseId={caseData.id} isInternal={false} />

              {/* Case Feedback */}
              <CaseFeedback 
                caseId={caseData.id} 
                caseTitle={caseData.title}
                caseStatus={caseData.status} 
                isInternal={false}
              />

              {/* Hide interactive elements in PDF */}
              <div className="print:hidden">
                {attachments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Paperclip className="h-5 w-5 mr-2" />
                        Attachments ({attachments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {attachment.file_type?.startsWith('image/') ? (
                              <FileImage className="h-5 w-5 text-blue-500" />
                            ) : (
                              <FileText className="h-5 w-5 text-gray-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{attachment.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {attachment.file_type}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadAttachment(attachment.file_url, attachment.file_name)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Case Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messages.filter(message => !message.is_internal).map((message) => (
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
                      {messages.filter(message => !message.is_internal).length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          No messages yet
                        </div>
                      )}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex gap-2 mb-2">
                        <Button
                          onClick={handleFileUpload}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Paperclip className="h-4 w-4" />
                          Attach Files
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="mb-2"
                        rows={3}
                      />
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
              </div>
            </div>

            <div className="space-y-6 print:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>Case Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {caseData.category && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Category</label>
                        <div className="mt-1">{caseData.category.name}</div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
                      <div className="mt-1">{caseData.submitted_by_user?.name || caseData.submitted_by_user?.email || 'You'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                      <div className="mt-1">{caseData.assigned_to_user?.name || 'Unassigned'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <div className="mt-1">{formatDate(caseData.created_at)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <div className="mt-1">{formatDate(caseData.updated_at)}</div>
                    </div>
                    {caseData.sla_due_at && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">SLA Due</label>
                        <div className="mt-1">{formatDateTime(caseData.sla_due_at)}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CitizenCaseDetail;
