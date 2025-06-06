import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, MessageSquare, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { callDeepSeek } from '@/lib/deepseek-api';

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
      content: `Hi! I'm your Case Assistant. I can help you with this case: "${caseContext?.title || 'Current Case'}". Ask me to do things like:

• Close this case
• Assign it to John Doe
• Change Category to Resident Complaint
• Mark as Urgent
• Add Dara Light as Watcher`,
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
    // Step 1: Try rule-based logic
    const ruleBasedResponse = await processMessage(currentMessage);
    if (ruleBasedResponse) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: ruleBasedResponse.content,
        isBot: true,
        timestamp: new Date(),
        action: ruleBasedResponse.action
      }]);
      return;
    }

    // Step 2: Call AI
    const { response, action } = await callDeepSeek({
      message: currentMessage,
      caseContext,
      attachments: []
    });

    let finalResponse = response;

    if (action) {
      const result = await handleAIAction(action);
      if (result) finalResponse += `\n\n✅ ${result}`;
    }

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        content: finalResponse,
        isBot: true,
        timestamp: new Date(),
        action: action ? 'success' : undefined,
      }
    ]);
  } catch (err) {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: 'Something went wrong while processing your message.',
      isBot: true,
      timestamp: new Date(),
      action: 'error'
    }]);
  } finally {
    setLoading(false);
  }
};

  const processMessage = async (message: string) => {
    const lower = message.toLowerCase();

    if (lower.includes('close this case')) {
      const { error } = await supabase.from('cases').update({ status: 'closed' }).eq('id', caseId);
      if (!error) {
        await logActivity('status_changed', 'Closed the case via assistant');
        onCaseUpdate?.();
        return { content: 'Case closed successfully.', action: 'success' };
      }
    }

    if (lower.includes('mark as urgent')) {
      const { error } = await supabase.from('cases').update({ priority: 'urgent' }).eq('id', caseId);
      if (!error) {
        await logActivity('priority_changed', 'Priority set to urgent via assistant');
        onCaseUpdate?.();
        return { content: 'Marked as urgent.', action: 'success' };
      }
    }

    if (lower.includes('assign to')) {
      const name = message.split('assign to')[1]?.trim();
      if (name) {
        const { data: user } = await supabase.from('users').select('id').ilike('name', `%${name}%`).single();
        if (user) {
          await supabase.from('cases').update({ assigned_to: user.id }).eq('id', caseId);
          await logActivity('assigned', `Assigned to ${name} via assistant`);
          onCaseUpdate?.();
          return { content: `Assigned to ${name}.`, action: 'success' };
        }
      }
    }

    if (lower.includes('change category to')) {
      const category = message.split('change category to')[1]?.trim();
      if (category) {
        const { data: cat } = await supabase.from('categories').select('id').ilike('name', `%${category}%`).single();
        if (cat) {
          await supabase.from('cases').update({ category: cat.id }).eq('id', caseId);
          await logActivity('category_changed', `Changed category to ${category} via assistant`);
          onCaseUpdate?.();
          return { content: `Category changed to ${category}.`, action: 'success' };
        }
      }
    }

    if (lower.includes('add') && lower.includes('as watcher')) {
      const name = message.split('add')[1].split('as')[0]?.trim();
      if (name) {
        const { data: user } = await supabase.from('users').select('id').ilike('name', `%${name}%`).single();
        if (user) {
          await supabase.from('case_watchers').insert({ case_id: caseId, user_id: user.id });
          await logActivity('watcher_added', `Added ${name} as watcher via assistant`);
          onCaseUpdate?.();
          return { content: `${name} added as a watcher.`, action: 'success' };
        }
      }
    }

    return null;
  };

  const logActivity = async (type: string, description: string) => {
    await supabase.from('case_activities').insert({
      case_id: caseId,
      activity_type: type,
      description,
      performed_by: caseContext?.submitted_by
    });
  };

  const handleAIAction = async (action: { type: string; value: any }) => {
  switch (action.type) {
    case 'close_case': {
      const { error } = await supabase.from('cases').update({ status: 'closed' }).eq('id', caseId);
      if (!error) {
        await logActivity('status_changed', 'Case closed by AI assistant');
        onCaseUpdate?.();
        return 'Case closed successfully.';
      }
      break;
    }

    case 'mark_urgent': {
      const { error } = await supabase.from('cases').update({ priority: 'urgent' }).eq('id', caseId);
      if (!error) {
        await logActivity('priority_changed', 'Marked as urgent by AI assistant');
        onCaseUpdate?.();
        return 'Case marked as urgent.';
      }
      break;
    }

    case 'assign_case': {
      const { data: user } = await supabase.from('users').select('id').ilike('name', `%${action.value}%`).single();
      if (user) {
        await supabase.from('cases').update({ assigned_to: user.id }).eq('id', caseId);
        await logActivity('assigned', `Assigned to ${action.value} by AI assistant`);
        onCaseUpdate?.();
        return `Assigned to ${action.value}.`;
      }
      return `User "${action.value}" not found.`;
    }

    case 'change_category': {
      const { data: cat } = await supabase.from('categories').select('id').ilike('name', `%${action.value}%`).single();
      if (cat) {
        await supabase.from('cases').update({ category: cat.id }).eq('id', caseId);
        await logActivity('category_changed', `Changed category to ${action.value} by AI assistant`);
        onCaseUpdate?.();
        return `Category changed to ${action.value}.`;
      }
      return `Category "${action.value}" not found.`;
    }

    case 'add_watcher': {
      const { data: user } = await supabase.from('users').select('id').ilike('name', `%${action.value}%`).single();
      if (user) {
        await supabase.from('case_watchers').insert({ case_id: caseId, user_id: user.id });
        await logActivity('watcher_added', `Added ${action.value} as watcher by AI assistant`);
        onCaseUpdate?.();
        return `${action.value} added as a watcher.`;
      }
      return `User "${action.value}" not found.`;
    }

    default:
      return 'Unknown action type.';
  }
};


return (
  <Card className="my-4">
    <CardHeader>
      <CardTitle>
        <Bot className="inline-block w-5 h-5 mr-2" />
        AI Case Assistant
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4 max-h-[300px] overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start space-x-2 ${msg.isBot ? 'text-blue-700' : 'text-gray-800'}`}>
            <Avatar className="w-6 h-6">
              <AvatarFallback>
                {msg.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-md p-2 text-sm whitespace-pre-wrap">
              {msg.content}
              {msg.action === 'success' && (
                <CheckCircle className="inline-block w-4 h-4 ml-2 text-green-600" />
              )}
              {msg.action === 'error' && (
                <AlertTriangle className="inline-block w-4 h-4 ml-2 text-red-600" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex space-x-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ask me to do something..."
          className="flex-grow"
        />
        <Button onClick={handleSendMessage} disabled={loading}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

};

export default CaseAIAssistant;