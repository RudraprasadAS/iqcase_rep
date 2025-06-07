
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, MessageSquare, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  action?: 'success' | 'error';
}

interface CaseAIAssistantProps {
  caseId: string;
  caseContext?: {
    title: string;
    status: string;
    priority: string;
    description?: string;
    category?: string;
    assigned_to?: string;
    submitted_by?: string;
  };
  onCaseUpdate?: () => void;
}

const CaseAIAssistant = ({ caseId, caseContext, onCaseUpdate }: CaseAIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hi! I'm your Case Assistant. I can help you with this case: "${caseContext?.title || 'Current Case'}". Ask me questions or give me commands like:
      
      • "What is this case about?"
      • "Who raised this case?"
      • "Close this case"
      • "Mark as urgent"
      • "Assign to [user name]"
      • "What attachments are there?"`,
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage('');
    setLoading(true);

    try {
      const ruleBasedResponse = await processMessage(currentMessage);
      if (ruleBasedResponse) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          content: ruleBasedResponse.content,
          isBot: true,
          timestamp: new Date(),
          action: ruleBasedResponse.action
        }]);
      } else {
        const aiResponse = await callAI(currentMessage);
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          content: aiResponse,
          isBot: true,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Processing error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 3).toString(),
        content: 'I encountered an error. Please try again.',
        isBot: true,
        timestamp: new Date(),
        action: 'error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = async (userId: string): Promise<string> => {
    try {
      console.log('Looking up user name for ID:', userId);
      const { data: user, error } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user:', error);
        return userId;
      }
      
      if (user) {
        console.log('Found user:', user);
        return user.name || user.email || userId;
      }
      
      return userId;
    } catch (error) {
      console.error('Error in getUserName:', error);
      return userId;
    }
  };

  const findUserByName = async (name: string): Promise<string | null> => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email')
        .or(`name.ilike.%${name}%, email.ilike.%${name}%`)
        .limit(1);

      if (error || !users || users.length === 0) {
        return null;
      }

      return users[0].id;
    } catch (error) {
      console.error('Error finding user by name:', error);
      return null;
    }
  };

  const processMessage = async (message: string): Promise<{ content: string; action?: 'success' | 'error' } | null> => {
    const lower = message.toLowerCase();

    if (lower.includes('what is this case about') || lower.includes('case about')) {
      return {
        content: `This case is titled "${caseContext?.title}" with status "${caseContext?.status}" and priority "${caseContext?.priority}". ${caseContext?.description ? `Description: ${caseContext.description}` : ''}`
      };
    }

    if (lower.includes('who raised this case') || lower.includes('who submitted') || lower.includes('submitted by')) {
      if (caseContext?.submitted_by) {
        try {
          const submitterName = await getUserName(caseContext.submitted_by);
          return {
            content: `This case was submitted by: ${submitterName}`
          };
        } catch (error) {
          return {
            content: `This case was submitted by user ID: ${caseContext.submitted_by}`
          };
        }
      } else {
        return {
          content: 'No submitter information is available for this case.'
        };
      }
    }

    if (lower.includes('close this case') || lower.includes('close case')) {
      try {
        console.log('Attempting to close case:', caseId);
        
        const { error: updateError } = await supabase
          .from('cases')
          .update({ status: 'closed' })
          .eq('id', caseId);

        if (updateError) {
          console.error('Error updating case status:', updateError);
          throw updateError;
        }

        // Log the activity
        const { error: activityError } = await supabase
          .from('case_activities')
          .insert({
            case_id: caseId,
            activity_type: 'status_changed',
            description: 'Case closed via AI Assistant',
            performed_by: caseContext?.submitted_by || 'system'
          });

        if (activityError) {
          console.error('Error creating activity log:', activityError);
        }

        if (onCaseUpdate) {
          onCaseUpdate();
        }

        toast({
          title: 'Case Closed',
          description: 'The case has been successfully closed.'
        });

        return { content: 'Case successfully closed.', action: 'success' };
      } catch (error) {
        console.error('Error closing case:', error);
        return { content: 'Error closing case. Please try again.', action: 'error' };
      }
    }

    if (lower.includes('mark as urgent') || lower.includes('set to urgent') || lower.includes('urgent priority')) {
      try {
        console.log('Attempting to set case as urgent:', caseId);
        
        const { error: updateError } = await supabase
          .from('cases')
          .update({ priority: 'urgent' })
          .eq('id', caseId);

        if (updateError) {
          console.error('Error updating case priority:', updateError);
          throw updateError;
        }

        // Log the activity
        const { error: activityError } = await supabase
          .from('case_activities')
          .insert({
            case_id: caseId,
            activity_type: 'priority_changed',
            description: 'Priority set to urgent via AI Assistant',
            performed_by: caseContext?.submitted_by || 'system'
          });

        if (activityError) {
          console.error('Error creating activity log:', activityError);
        }

        if (onCaseUpdate) {
          onCaseUpdate();
        }

        toast({
          title: 'Priority Updated',
          description: 'Case priority has been set to urgent.'
        });

        return { content: 'Priority set to urgent.', action: 'success' };
      } catch (error) {
        console.error('Error updating priority:', error);
        return { content: 'Error updating priority. Please try again.', action: 'error' };
      }
    }

    // Handle assignment commands
    const assignMatch = lower.match(/assign to (.+)/);
    if (assignMatch) {
      const assigneeName = assignMatch[1].trim();
      try {
        console.log('Attempting to assign case to:', assigneeName);
        
        // Find user by name
        const assigneeId = await findUserByName(assigneeName);
        
        if (!assigneeId) {
          return { 
            content: `Could not find a user named "${assigneeName}". Please check the name and try again.`, 
            action: 'error' 
          };
        }

        const { error: updateError } = await supabase
          .from('cases')
          .update({ assigned_to: assigneeId })
          .eq('id', caseId);

        if (updateError) {
          console.error('Error updating case assignment:', updateError);
          throw updateError;
        }

        // Log the activity
        const { error: activityError } = await supabase
          .from('case_activities')
          .insert({
            case_id: caseId,
            activity_type: 'assignment_changed',
            description: `Assigned to ${assigneeName} via AI Assistant`,
            performed_by: caseContext?.submitted_by || 'system'
          });

        if (activityError) {
          console.error('Error creating activity log:', activityError);
        }

        if (onCaseUpdate) {
          onCaseUpdate();
        }

        const assigneeFriendlyName = await getUserName(assigneeId);

        toast({
          title: 'Case Assigned',
          description: `Case has been assigned to ${assigneeFriendlyName}.`
        });

        return { content: `Case successfully assigned to ${assigneeFriendlyName}.`, action: 'success' };
      } catch (error) {
        console.error('Error assigning case:', error);
        return { content: 'Error assigning case. Please try again.', action: 'error' };
      }
    }

    return null;
  };

  const callAI = async (input: string): Promise<string> => {
    const systemPrompt = `You are a helpful AI assistant for case management. Case context:
Title: ${caseContext?.title}
Status: ${caseContext?.status}
Priority: ${caseContext?.priority}
Description: ${caseContext?.description}

Provide helpful, concise responses about this case. If asked about user IDs, explain that you can help with case information but suggest using specific commands for actions like:
- "Close this case" to close the case
- "Mark as urgent" to set priority to urgent
- "Assign to [user name]" to assign the case

Keep responses brief and professional.`;

    try {
      const { data, error } = await supabase.functions.invoke('knowledge-assistant', {
        body: {
          message: input,
          context: systemPrompt
        }
      });

      if (error) {
        console.error('Error calling AI function:', error);
        throw error;
      }

      return data?.response || 'I\'m sorry, I couldn\'t process that request. Please try asking about the case details or use specific commands like "close this case" or "mark as urgent".';
    } catch (error) {
      console.error('Error calling AI:', error);
      return 'I\'m sorry, I\'m having trouble connecting to my AI service. Please try asking about the case details or use specific commands.';
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const getMessageIcon = (m: Message) => {
    if (m.action === 'success') return <CheckCircle className="h-3 w-3 text-green-500" />;
    if (m.action === 'error') return <AlertTriangle className="h-3 w-3 text-red-500" />;
    return null;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button size="lg" className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700">
            <MessageSquare className="h-5 w-5 mr-2" /> AI Assistant
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="absolute bottom-16 right-0 w-96">
          <Card className="shadow-xl border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5" /> Case AI Assistant
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-2 ${m.isBot ? '' : 'flex-row-reverse'}`}>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {m.isBot ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[80%] ${m.isBot ? '' : 'text-right'}`}>
                      <div className={`text-xs p-2 rounded-lg whitespace-pre-line ${
                        m.isBot 
                          ? m.action === 'success' 
                            ? 'bg-green-50 border border-green-200' 
                            : m.action === 'error' 
                            ? 'bg-red-50 border border-red-200' 
                            : 'bg-muted' 
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        <div className="flex items-start gap-1">
                          {m.content}
                          {getMessageIcon(m)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTime(m.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        <Bot className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-2 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Textarea
                  placeholder="Ask about this case or give me a command..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                  className="text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={loading || !newMessage.trim()} 
                  size="sm" 
                  className="w-full"
                >
                  <Send className="h-3 w-3 mr-2" />
                  {loading ? 'Processing...' : 'Send'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CaseAIAssistant;
