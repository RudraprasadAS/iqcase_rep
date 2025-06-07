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
        const aiResponse = await callOpenRouterAI(currentMessage);
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

  const processMessage = async (message: string): Promise<{ content: string; action?: 'success' | 'error' } | null> => {
    const lower = message.toLowerCase();

    if (lower.includes('what is this case about') || lower.includes('case about')) {
      return {
        content: `This case is titled "${caseContext?.title}" with status "${caseContext?.status}" and priority "${caseContext?.priority}". ${caseContext?.description ? `Description: ${caseContext.description}` : ''}`
      };
    }

    if (lower.includes('close this case')) {
      try {
        await supabase.from('cases').update({ status: 'closed' }).eq('id', caseId);
        await supabase.from('case_activities').insert({
          case_id: caseId,
          activity_type: 'status_changed',
          description: 'Case closed via AI Assistant',
          performed_by: caseContext?.submitted_by
        });
        if (onCaseUpdate) onCaseUpdate();
        return { content: 'Case successfully closed.', action: 'success' };
      } catch {
        return { content: 'Error closing case.', action: 'error' };
      }
    }

    if (lower.includes('mark as urgent')) {
      try {
        await supabase.from('cases').update({ priority: 'urgent' }).eq('id', caseId);
        await supabase.from('case_activities').insert({
          case_id: caseId,
          activity_type: 'priority_changed',
          description: 'Priority set to urgent via AI Assistant',
          performed_by: caseContext?.submitted_by
        });
        if (onCaseUpdate) onCaseUpdate();
        return { content: 'Priority set to urgent.', action: 'success' };
      } catch {
        return { content: 'Error updating priority.', action: 'error' };
      }
    }

    const assignMatch = lower.match(/assign to (.+)/);
    if (assignMatch) {
      const assignee = assignMatch[1].trim();
      try {
        await supabase.from('cases').update({ assigned_to: assignee }).eq('id', caseId);
        await supabase.from('case_activities').insert({
          case_id: caseId,
          activity_type: 'assignment_changed',
          description: `Assigned to ${assignee} via AI Assistant`,
          performed_by: caseContext?.submitted_by
        });
        if (onCaseUpdate) onCaseUpdate();
        return { content: `Case successfully assigned to ${assignee}.`, action: 'success' };
      } catch {
        return { content: 'Error assigning case.', action: 'error' };
      }
    }

    return null;
  };

  const callOpenRouterAI = async (input: string): Promise<string> => {
    const systemPrompt = `You are a helpful AI assistant for internal case management. Case context:
Title: ${caseContext?.title}
Status: ${caseContext?.status}
Priority: ${caseContext?.priority}
Description: ${caseContext?.description}
Category: ${caseContext?.category}
Assigned To: ${caseContext?.assigned_to}
Submitted By: ${caseContext?.submitted_by}`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer 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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ]
      })
    });

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || 'No response.';
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const getMessageIcon = (m: Message) => m.action === 'success' ? <CheckCircle className="h-3 w-3 text-green-500" /> : m.action === 'error' ? <AlertTriangle className="h-3 w-3 text-red-500" /> : null;

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
                      <AvatarFallback className="text-xs">{m.isBot ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}</AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[80%] ${m.isBot ? '' : 'text-right'}`}>
                      <div className={`text-xs p-2 rounded-lg whitespace-pre-line ${
                        m.isBot ? m.action === 'success' ? 'bg-green-50 border border-green-200' : m.action === 'error' ? 'bg-red-50 border border-red-200' : 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                        <div className="flex items-start gap-1">{m.content}{getMessageIcon(m)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{formatTime(m.timestamp)}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs"><Bot className="h-3 w-3" /></AvatarFallback>
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
                <Button onClick={handleSendMessage} disabled={loading || !newMessage.trim()} size="sm" className="w-full">
                  <Send className="h-3 w-3 mr-2" />{loading ? 'Processing...' : 'Send'}
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
