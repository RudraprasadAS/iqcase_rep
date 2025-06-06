
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
      • "Mark as urgent"
      • "Assign to [user]"
      • "Close this case"
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
      // Check if this is a command
      const response = await processMessage(currentMessage);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        isBot: true,
        timestamp: new Date(),
        action: response.action
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I encountered an error processing your request. Please try again.',
        isBot: true,
        timestamp: new Date(),
        action: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const processMessage = async (message: string): Promise<{ content: string; action?: 'success' | 'error' }> => {
    const lowerMessage = message.toLowerCase();
    
    // Handle information queries
    if (lowerMessage.includes('what is this case about') || lowerMessage.includes('case about')) {
      return {
        content: `This case is titled "${caseContext?.title}" with status "${caseContext?.status}" and priority "${caseContext?.priority}". ${caseContext?.description ? `Description: ${caseContext.description}` : ''}`
      };
    }
    
    if (lowerMessage.includes('attachments') || lowerMessage.includes('files')) {
      try {
        const { data: attachments } = await supabase
          .from('case_attachments')
          .select('file_name, created_at')
          .eq('case_id', caseId);
        
        if (attachments && attachments.length > 0) {
          const fileList = attachments.map(att => `• ${att.file_name}`).join('\n');
          return {
            content: `This case has ${attachments.length} attachment(s):\n${fileList}`
          };
        } else {
          return {
            content: 'This case has no attachments.'
          };
        }
      } catch (error) {
        return {
          content: 'I couldn\'t retrieve attachment information.',
          action: 'error'
        };
      }
    }
    
    if (lowerMessage.includes('who is handling') || lowerMessage.includes('assigned to')) {
      if (caseContext?.assigned_to) {
        try {
          const { data: user } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', caseContext.assigned_to)
            .single();
          
          return {
            content: `This case is assigned to ${user?.name || 'Unknown user'} (${user?.email || 'No email'})`
          };
        } catch (error) {
          return {
            content: 'This case is assigned but I couldn\'t retrieve the user details.',
            action: 'error'
          };
        }
      } else {
        return {
          content: 'This case is not currently assigned to anyone.'
        };
      }
    }
    
    // Handle commands
    if (lowerMessage.includes('mark as urgent') || lowerMessage.includes('set priority urgent')) {
      try {
        const { error } = await supabase
          .from('cases')
          .update({ priority: 'urgent' })
          .eq('id', caseId);
        
        if (error) throw error;
        
        // Calculate new SLA due date
        if (caseContext?.category) {
          const { data: slaData } = await supabase
            .from('category_sla_matrix')
            .select('sla_urgent')
            .eq('category_id', caseContext.category)
            .eq('is_active', true)
            .single();
          
          if (slaData?.sla_urgent) {
            const newDueDate = new Date();
            newDueDate.setHours(newDueDate.getHours() + slaData.sla_urgent);
            
            await supabase
              .from('cases')
              .update({ sla_due_at: newDueDate.toISOString() })
              .eq('id', caseId);
          }
        }
        
        // Log activity
        await supabase
          .from('case_activities')
          .insert({
            case_id: caseId,
            activity_type: 'priority_changed',
            description: 'Priority changed to urgent via AI Assistant',
            performed_by: caseContext?.submitted_by
          });
        
        if (onCaseUpdate) onCaseUpdate();
        
        return {
          content: 'Successfully updated case priority to urgent and recalculated SLA due date.',
          action: 'success'
        };
      } catch (error) {
        return {
          content: 'Failed to update case priority. Please try again or contact support.',
          action: 'error'
        };
      }
    }
    
    if (lowerMessage.includes('close this case') || lowerMessage.includes('close case')) {
      try {
        const { error } = await supabase
          .from('cases')
          .update({ status: 'closed' })
          .eq('id', caseId);
        
        if (error) throw error;
        
        // Log activity
        await supabase
          .from('case_activities')
          .insert({
            case_id: caseId,
            activity_type: 'status_changed',
            description: 'Case closed via AI Assistant',
            performed_by: caseContext?.submitted_by
          });
        
        if (onCaseUpdate) onCaseUpdate();
        
        return {
          content: 'Successfully closed this case.',
          action: 'success'
        };
      } catch (error) {
        return {
          content: 'Failed to close the case. Please try again or contact support.',
          action: 'error'
        };
      }
    }
    
    // Default response for unclear messages
    return {
      content: `I understand you're asking about: "${message}". I can help with:
      
      Information:
      • Case details and status
      • Attachments and files
      • Who is handling the case
      
      Actions:
      • Mark as urgent
      • Close this case
      • Update case status
      
      Try asking something like "What attachments are there?" or "Mark as urgent"`
    };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageIcon = (message: Message) => {
    if (message.action === 'success') return <CheckCircle className="h-3 w-3 text-green-500" />;
    if (message.action === 'error') return <AlertTriangle className="h-3 w-3 text-red-500" />;
    return null;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            size="lg" 
            className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            AI Assistant
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="absolute bottom-16 right-0 w-96">
          <Card className="shadow-xl border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5" />
                  Case AI Assistant
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-2 ${message.isBot ? '' : 'flex-row-reverse'}`}>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {message.isBot ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[80%] ${message.isBot ? '' : 'text-right'}`}>
                      <div className={`text-xs p-2 rounded-lg whitespace-pre-line ${
                        message.isBot 
                          ? message.action === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : message.action === 'error'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-muted'
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        <div className="flex items-start gap-1">
                          {message.content}
                          {getMessageIcon(message)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTime(message.timestamp)}
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
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
