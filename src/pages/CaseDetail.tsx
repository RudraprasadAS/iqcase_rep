
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Edit, MessageSquare, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  tags?: string[];
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  is_internal: boolean;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  created_at: string;
  uploaded_by?: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description?: string;
  duration_minutes?: number;
  travel_minutes?: number;
  performed_by: string;
  created_at: string;
}

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCaseData();
      fetchMessages();
      fetchAttachments();
      fetchActivities();
    }
  }, [id]);

  const fetchCaseData = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
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
        .select('*')
        .eq('case_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
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
        .eq('case_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('case_activities')
        .select('*')
        .eq('case_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('case_messages')
        .insert({
          case_id: id,
          message: newMessage,
          sender_id: 'current-user-id', // This should be the actual user ID from auth
          is_internal: false
        });

      if (error) throw error;
      
      setNewMessage('');
      fetchMessages();
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
    }
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'outline';
      case 'closed':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
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

  return (
    <>
      <Helmet>
        <title>Case {generateCaseNumber(caseData.id, caseData.created_at)} - IQCase</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/cases')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                Case {generateCaseNumber(caseData.id, caseData.created_at)}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={getStatusBadgeVariant(caseData.status)}>
                  {caseData.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(caseData.priority)}>
                  {caseData.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Case
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Core Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <div className="mt-1">
                      <Badge variant={getPriorityBadgeVariant(caseData.priority)}>
                        {caseData.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(caseData.status)}>
                        {caseData.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
                    <div className="mt-1">{caseData.submitted_by}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                    <div className="mt-1">{caseData.assigned_to || 'Unassigned'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <div className="mt-1">{formatDate(caseData.created_at)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                    <div className="mt-1">{caseData.sla_due_at ? formatDate(caseData.sla_due_at) : 'Not set'}</div>
                  </div>
                  {caseData.location && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <div className="mt-1">{caseData.location}</div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <div className="mt-1 font-medium">{caseData.title}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div className="mt-1">{caseData.description || 'No description provided'}</div>
                </div>
                {caseData.tags && caseData.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tags</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {caseData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Communication & Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="messages" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="activities">Activities</TabsTrigger>
                    <TabsTrigger value="updates">Updates</TabsTrigger>
                  </TabsList>
                  <TabsContent value="messages" className="space-y-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messages.map((message) => (
                        <div key={message.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {message.sender_id.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm">
                              <span className="font-medium">
                                {message.sender_id}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                {formatDateTime(message.created_at)}
                              </span>
                              {message.is_internal && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Internal
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 text-sm bg-muted rounded-lg p-3">
                              {message.message}
                            </div>
                          </div>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          No messages yet
                        </div>
                      )}
                    </div>
                    <div className="border-t pt-4">
                      <Textarea
                        placeholder="Write a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="mb-2"
                      />
                      <Button onClick={handleSendMessage} size="sm">
                        Send Message
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="activities" className="space-y-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {activities.map((activity) => (
                        <div key={activity.id} className="border-l-2 border-muted pl-4">
                          <div className="text-sm font-medium">{activity.activity_type}</div>
                          {activity.description && (
                            <div className="text-sm text-muted-foreground">{activity.description}</div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(activity.created_at)} by {activity.performed_by}
                            {activity.duration_minutes && (
                              <span className="ml-2">({activity.duration_minutes} min)</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {activities.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          No activities yet
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="updates">
                    <div className="text-sm text-muted-foreground">Last updated: {formatDateTime(caseData.updated_at)}</div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Attachments ({attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>{attachment.file_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(attachment.created_at)}
                    </div>
                  </div>
                ))}
                {attachments.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No attachments
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Activities</span>
                  <span>{activities.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Time</span>
                  <span>
                    {activities.reduce((total, activity) => total + (activity.duration_minutes || 0), 0)} minutes
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Last Updated</span>
                  <span>{formatDateTime(caseData.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default CaseDetail;
