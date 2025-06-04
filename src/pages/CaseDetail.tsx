import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, MessageSquare, Clock, FileText, AlertTriangle, Sparkles, Send, Download, Paperclip, RefreshCw, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SLABadge from '@/components/cases/SLABadge';
import StatusBadge from '@/components/cases/StatusBadge';
import PriorityBadge from '@/components/cases/PriorityBadge';
import CaseEditDialog from '@/components/cases/CaseEditDialog';
import CaseAIAssistant from '@/components/cases/CaseAIAssistant';
import { useAuth } from '@/hooks/useAuth';
import RelatedCases from '@/components/cases/RelatedCases';
import CaseWatchers from '@/components/cases/CaseWatchers';
import CaseTasks from '@/components/cases/CaseTasks';
import CaseFeedback from '@/components/cases/CaseFeedback';
import InternalNotes from '@/components/cases/InternalNotes';
import CaseNotes from '@/components/cases/CaseNotes';
import CaseUpdates from '@/components/cases/CaseUpdates';
import { formatDistanceToNow } from 'date-fns';
import { logMessageAdded } from '@/utils/activityLogger';
import { useCaseExport } from '@/hooks/useCaseExport';

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

interface Activity {
  id: string;
  activity_type: string;
  description?: string;
  duration_minutes?: number;
  travel_minutes?: number;
  performed_by: string;
  created_at: string;
  users?: { name: string; email: string };
}

const CaseDetail = () => {
  const { id: caseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { exportCaseToPDF, isExporting } = useCaseExport();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [refreshingActivities, setRefreshingActivities] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (caseId && internalUserId) {
      fetchCaseData();
      fetchMessages();
      fetchAttachments();
      fetchActivities();
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

      console.log('Case data fetched:', data);
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Attachments fetch error:', error);
        throw error;
      }

      console.log('Attachments fetched:', data);
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const fetchActivities = async () => {
    if (!caseId) return;
    
    setRefreshingActivities(true);

    try {
      console.log('📋 Fetching activities for case:', caseId);
      const { data, error } = await supabase
        .from('case_activities')
        .select(`
          *,
          users!case_activities_performed_by_fkey(name, email)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Activities fetch error:', error);
        throw error;
      }

      console.log('📋 Activities fetched:', data?.length || 0, 'items', data);
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setRefreshingActivities(false);
    }
  };

  // Enhanced real-time subscription for both case updates and activities
  useEffect(() => {
    if (!caseId) return;

    console.log('📋 Setting up ENHANCED real-time subscription for case activities and updates:', caseId);

    // Subscribe to case activities changes
    const activitiesChannel = supabase
      .channel(`case_activities_realtime_${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'case_activities',
          filter: `case_id=eq.${caseId}`
        },
        (payload) => {
          console.log('📋 🔔 Real-time activity change detected:', payload);
          // Immediate refresh on any change
          setTimeout(() => {
            console.log('📋 🔄 Triggering activity refresh due to real-time update');
            fetchActivities();
          }, 100); // Small delay to ensure data is committed
        }
      )
      .subscribe((status) => {
        console.log('📋 Activities subscription status:', status);
      });

    // Subscribe to case data changes
    const caseChannel = supabase
      .channel(`case_data_realtime_${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cases',
          filter: `id=eq.${caseId}`
        },
        (payload) => {
          console.log('🔔 Real-time case data change detected:', payload);
          // Immediate refresh of case data
          setTimeout(() => {
            console.log('🔄 Triggering case data refresh due to real-time update');
            fetchCaseData();
          }, 100); // Small delay to ensure data is committed
        }
      )
      .subscribe((status) => {
        console.log('Case data subscription status:', status);
      });

    // Also set up a periodic refresh as backup
    const intervalId = setInterval(() => {
      console.log('📋 🔄 Periodic activity and case refresh');
      fetchActivities();
      fetchCaseData();
    }, 5000); // Refresh every 5 seconds

    return () => {
      console.log('📋 Cleaning up enhanced activities and case subscriptions and interval');
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(caseChannel);
      clearInterval(intervalId);
    };
  }, [caseId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !internalUserId) {
      toast({
        title: "Error",
        description: "Please enter a message and ensure you're logged in",
        variant: "destructive"
      });
      return;
    }

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('case_messages')
        .insert({
          case_id: caseId,
          message: newMessage.trim(),
          sender_id: internalUserId,
          is_internal: false
        });

      if (error) {
        console.error('Message send error:', error);
        throw error;
      }
      
      setNewMessage('');
      await fetchMessages();
      
      // Log activity using the centralized logger
      await logMessageAdded(caseId!, newMessage.trim(), false, internalUserId);
      
      await fetchActivities();
      
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

  const generateAIResponse = async () => {
    if (!caseData) return;

    setGeneratingAI(true);
    try {
      const recentMessages = messages.slice(-5);
      const conversationContext = recentMessages.map(msg => 
        `${msg.users?.name || 'User'}: ${msg.message}`
      ).join('\n');

      const caseContext = `
Case: ${caseData.title}
Status: ${caseData.status}
Priority: ${caseData.priority}
Description: ${caseData.description || 'No description'}

Recent conversation:
${conversationContext}
      `;

      const { data, error } = await supabase.functions.invoke('generate-case-response', {
        body: {
          caseContext,
          prompt: "Generate a helpful, professional response for this case based on the context provided. The response should be solution-oriented and actionable."
        }
      });

      if (error) throw error;

      setNewMessage(data.generatedText || 'Unable to generate response');
      
      toast({
        title: "AI response generated",
        description: "Review and modify the message before sending"
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI response",
        variant: "destructive"
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCaseUpdate = async (updatedCase: CaseData) => {
    console.log('🔄 Case updated, refreshing activities and data:', updatedCase);
    
    // Update local case data immediately
    setCaseData(updatedCase);
    
    // Force refresh activities to see any new activity logs
    setTimeout(() => {
      console.log('🔄 Forcing activity refresh after case update');
      fetchActivities();
    }, 500); // Small delay to ensure activity logging is complete
    
    setIsEditDialogOpen(false);
    toast({
      title: "Success",
      description: "Case updated successfully"
    });
  };

  const handleManualRefresh = () => {
    fetchCaseData();
    fetchActivities();
    
    toast({
      title: "Refreshing",
      description: "Case data and activities updated"
    });
  };

  const handleExportPDF = () => {
    if (caseId) {
      exportCaseToPDF(caseId);
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

  const getSLAStatusInfo = (sla_due_at?: string, status?: string) => {
    if (!sla_due_at || status === 'closed' || status === 'resolved') {
      return null;
    }

    const dueDate = new Date(sla_due_at);
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursRemaining = timeDiff / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      const hoursOverdue = Math.abs(hoursRemaining);
      return {
        status: 'breached',
        message: `SLA breached ${Math.round(hoursOverdue)} hours ago`,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200'
      };
    } else if (hoursRemaining < 2) {
      return {
        status: 'critical',
        message: `SLA due in ${Math.round(hoursRemaining)} hours - URGENT`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200'
      };
    } else if (hoursRemaining < 24) {
      return {
        status: 'warning',
        message: `SLA due in ${Math.round(hoursRemaining)} hours`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200'
      };
    }

    return {
      status: 'on_track',
      message: `SLA due in ${Math.round(hoursRemaining / 24)} days`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200'
    };
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

  const slaInfo = getSLAStatusInfo(caseData.sla_due_at, caseData.status);

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
                <StatusBadge status={caseData.status} />
                <PriorityBadge priority={caseData.priority} />
                <SLABadge sla_due_at={caseData.sla_due_at} status={caseData.status} />
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              {isExporting ? 'Generating PDF...' : 'Download Case Report (PDF)'}
            </Button>
            <Button variant="outline" onClick={handleManualRefresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Case
            </Button>
          </div>
        </div>

        {slaInfo && (
          <Card className={`border-2 ${slaInfo.bgColor}`}>
            <CardContent className="py-3">
              <div className={`flex items-center ${slaInfo.color}`}>
                {slaInfo.status === 'breached' && <AlertTriangle className="h-5 w-5 mr-2" />}
                {slaInfo.status !== 'breached' && <Clock className="h-5 w-5 mr-2" />}
                <span className="font-medium">{slaInfo.message}</span>
                {caseData.sla_due_at && (
                  <span className="ml-2 text-sm opacity-75">
                    (Due: {formatDateTime(caseData.sla_due_at)})
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                      <PriorityBadge priority={caseData.priority} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <StatusBadge status={caseData.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
                    <div className="mt-1">{caseData.submitted_by_user?.name || caseData.submitted_by_user?.email || 'Unknown'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                    <div className="mt-1">{caseData.assigned_to_user?.name || 'Unassigned'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <div className="mt-1">{formatDate(caseData.created_at)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SLA Due Date</label>
                    <div className="mt-1">
                      {caseData.sla_due_at ? formatDateTime(caseData.sla_due_at) : 'Not set'}
                    </div>
                  </div>
                  {caseData.location && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <div className="mt-1">{caseData.location}</div>
                    </div>
                  )}
                  {caseData.category && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Category</label>
                      <div className="mt-1">{caseData.category.name}</div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <div className="mt-1 font-medium">{caseData.title}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div className="mt-1 whitespace-pre-wrap">{caseData.description || 'No description provided'}</div>
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

            <RelatedCases caseId={caseData.id} />

            <CaseTasks caseId={caseData.id} />

            <CaseNotes caseId={caseData.id} />
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
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="notes">Internal</TabsTrigger>
                    <TabsTrigger value="activities">Activities</TabsTrigger>
                    <TabsTrigger value="updates">Updates</TabsTrigger>
                  </TabsList>
                  <TabsContent value="messages" className="space-y-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messages.map((message) => (
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
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex gap-2 mb-2">
                        <Button
                          onClick={generateAIResponse}
                          disabled={generatingAI || !caseData}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          {generatingAI ? 'Generating...' : 'AI Draft'}
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Write a message..."
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
                  </TabsContent>
                  <TabsContent value="notes" className="space-y-4">
                    <InternalNotes caseId={caseData.id} onActivityUpdate={fetchActivities} />
                  </TabsContent>
                  <TabsContent value="activities" className="space-y-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                        <span>Activities ({activities.length})</span>
                        <Button 
                          onClick={fetchActivities} 
                          variant="outline" 
                          size="sm"
                          disabled={refreshingActivities}
                          className="h-6 px-2 text-xs flex items-center gap-1"
                        >
                          <RefreshCw className={`h-3 w-3 ${refreshingActivities ? 'animate-spin' : ''}`} />
                          {refreshingActivities ? 'Refreshing...' : 'Refresh'}
                        </Button>
                      </div>
                      {activities.map((activity) => (
                        <div key={activity.id} className="border-l-2 border-muted pl-4">
                          <div className="text-sm font-medium capitalize">
                            {activity.activity_type.replace(/_/g, ' ')}
                          </div>
                          {activity.description && (
                            <div className="text-sm text-muted-foreground">{activity.description}</div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(activity.created_at)} by {activity.users?.name || activity.users?.email || activity.performed_by}
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
                    <CaseUpdates caseId={caseData.id} isInternal={true} />
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
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Paperclip className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{attachment.file_name}</p>
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
                {attachments.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No attachments
                  </div>
                )}
              </CardContent>
            </Card>

            <CaseWatchers caseId={caseData.id} />

            <CaseFeedback 
              caseId={caseData.id} 
              caseTitle={caseData.title}
              caseStatus={caseData.status} 
            />
          </div>
        </div>
      </div>

      <CaseAIAssistant 
        caseContext={{
          title: caseData.title,
          status: caseData.status,
          priority: caseData.priority,
          description: caseData.description
        }}
      />

      <CaseEditDialog
        case={caseData}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onCaseUpdate={handleCaseUpdate}
      />
    </>
  );
};

export default CaseDetail;
