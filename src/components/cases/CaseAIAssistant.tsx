
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, MessageSquare, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface CaseAIAssistantProps {
  caseContext?: {
    title: string;
    status: string;
    priority: string;
    description?: string;
  };
}

const CaseAIAssistant = ({ caseContext }: CaseAIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi! I\'m here to help with this case. Ask me about troubleshooting steps, similar cases, or any case management questions.',
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
    setNewMessage('');
    setLoading(true);

    try {
      // Prepare context for the AI
      const contextString = caseContext ? 
        `Current case: ${caseContext.title} (Status: ${caseContext.status}, Priority: ${caseContext.priority})${caseContext.description ? `, Description: ${caseContext.description}` : ''}` 
        : 'General case management question';

      // Call the AI assistant function
      const { data, error } = await supabase.functions.invoke('knowledge-assistant', {
        body: {
          message: newMessage,
          context: contextString
        }
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'I apologize, but I encountered an issue processing your request. Please try again.',
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      
      // Fallback response
      const fallbackResponse = getFallbackResponse(newMessage);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      toast({
        title: "AI Assistant Unavailable",
        description: "Using fallback responses. Please check OpenAI API configuration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFallbackResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('login') || lowerMessage.includes('authentication')) {
      return 'For login issues, verify credentials, check account status, and review authentication logs. Check the knowledge base for detailed troubleshooting steps.';
    }
    
    if (lowerMessage.includes('priority') || lowerMessage.includes('sla')) {
      return 'Set priority based on business impact: High for outages, Medium for functionality issues, Low for minor bugs. SLA times depend on priority level.';
    }
    
    if (lowerMessage.includes('escalate') || lowerMessage.includes('escalation')) {
      return 'Escalate to team lead if: case exceeds SLA, customer requests escalation, or technical expertise needed. Document escalation reason clearly.';
    }
    
    return 'I\'m currently experiencing connectivity issues. Please search the knowledge base or consult with a team lead for immediate assistance.';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            size="lg" 
            className="rounded-full shadow-lg"
            onClick={() => setIsOpen(!isOpen)}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            AI Help
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="absolute bottom-16 right-0 w-96">
          <Card className="shadow-xl border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5" />
                  AI Assistant
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
                      <div className={`text-xs p-2 rounded-lg ${message.isBot ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                        {message.content}
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
                  placeholder="Ask about this case..."
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
                  {loading ? 'Sending...' : 'Send'}
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
