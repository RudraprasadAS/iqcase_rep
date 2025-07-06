
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. I can help you with case management questions, troubleshooting steps, and accessing our knowledge base. How can I assist you today?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
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
      // Call the AI assistant function
      const { data, error } = await supabase.functions.invoke('knowledge-assistant', {
        body: {
          message: newMessage,
          context: 'case_management' // This helps the AI understand the domain
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
      
      // Fallback response for common questions
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
        description: "Using fallback responses. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFallbackResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('login') || lowerMessage.includes('authentication')) {
      return 'For login issues, first verify the user\'s credentials are correct. Check if their account is active and not locked. If the problem persists, check our authentication troubleshooting guide in the knowledge base.';
    }
    
    if (lowerMessage.includes('priority') || lowerMessage.includes('sla')) {
      return 'Case priority should be set based on business impact and urgency. High priority for system outages affecting many users, Medium for significant functionality issues, Low for minor bugs or feature requests.';
    }
    
    if (lowerMessage.includes('status') || lowerMessage.includes('workflow')) {
      return 'Case workflow: Open → In Progress → Resolved → Closed. Cases should be moved to "In Progress" when work begins, "Resolved" when fixed but pending user confirmation, and "Closed" when confirmed resolved.';
    }
    
    return 'I\'m currently experiencing connectivity issues. For immediate help, please search our knowledge base or consult with a team lead.';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.isBot ? '' : 'flex-row-reverse'}`}>
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {message.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className={`flex-1 max-w-[80%] ${message.isBot ? '' : 'text-right'}`}>
              <Card className={message.isBot ? 'bg-muted' : 'bg-primary text-primary-foreground'}>
                <CardContent className="p-3">
                  <p className="text-sm">{message.content}</p>
                </CardContent>
              </Card>
              <div className="text-xs text-muted-foreground mt-1">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="bg-muted">
              <CardContent className="p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Ask me anything about case management..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={3}
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
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </div>
  );
};

export default AIAssistant;
