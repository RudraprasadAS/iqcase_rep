
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react';

interface CaseDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location: string | null;
  created_at: string;
  updated_at: string;
  sla_due_at: string | null;
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  is_internal: boolean;
  users: {
    name: string;
    email: string;
  };
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  users: {
    name: string;
  };
}

const CitizenCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [case_, setCase] = useState<CaseDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchCaseDetails();
    }
  }, [id, user]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);

      // Fetch case details
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .eq('submitted_by', user?.id)
        .single();

      if (caseError) throw caseError;
      setCase(caseData);

      // Fetch messages (exclude internal messages)
      const { data: messagesData, error: messagesError } = await supabase
        .from('case_messages')
        .select(`
          *,
          users:sender_id (
            name,
            email
          )
        `)
        .eq('case_id', id)
        .eq('is_internal', false)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('case_activities')
        .select(`
          *,
          users:performed_by (
            name
          )
        `)
        .eq('case_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);

    } catch (error) {
      console.error('Error fetching case details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load case details',
        variant: 'destructive'
      });
      navigate('/citizen/cases');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !case_) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('case_messages')
        .insert({
          case_id: case_.id,
          message: newMessage.trim(),
          sender_id: user.id,
          is_internal: false
        });

      if (error) throw error;

      // Add activity log
      await supabase
        .from('case_activities')
        .insert({
          case_id: case_.id,
          activity_type: 'message_added',
          description: 'Citizen sent a message',
          performed_by: user.id
        });

      setNewMessage('');
      await fetchCaseDetails();

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
      setSendingMessage(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!case_) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Case not found</h3>
        <p className="text-gray-500 mb-4">The case you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => navigate('/citizen/cases')}>
          Back to Cases
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/citizen/cases')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
      </div>

      {/* Case Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {getStatusIcon(case_.status)}
                <CardTitle className="text-2xl">{case_.title}</CardTitle>
              </div>
              <CardDescription>Case ID: {case_.id}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Badge className={getPriorityColor(case_.priority)}>
                {case_.priority} priority
              </Badge>
              <Badge variant="outline">
                {case_.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-gray-700">{case_.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Submitted: {formatDateTime(case_.created_at)}</span>
              </div>
              
              {case_.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{case_.location}</span>
                </div>
              )}
              
              {case_.sla_due_at && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Due: {formatDateTime(case_.sla_due_at)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Messages ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.users.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">{message.users.name}</span>
                        <span className="text-muted-foreground ml-2">
                          {formatDateTime(message.created_at)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm bg-gray-50 border rounded-lg p-3">
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
              
              {case_.status !== 'closed' && (
                <div className="border-t pt-4 space-y-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="mb-2"
                    rows={3}
                  />
                  <Button 
                    onClick={sendMessage} 
                    size="sm"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(activity.created_at)}
                        {activity.users?.name && ` by ${activity.users.name}`}
                      </p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    No activity yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CitizenCaseDetail;
