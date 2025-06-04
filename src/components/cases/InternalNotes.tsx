
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Lock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { searchUsersByMention, processMentionsAndNotify } from '@/utils/mentionUtils';
import { logInternalNoteAdded } from '@/utils/activityLogger';

interface Note {
  id: string;
  note: string;
  created_at: string;
  is_internal: boolean;
  users: {
    name: string;
    email: string;
  };
}

interface InternalNotesProps {
  caseId: string;
  onActivityUpdate?: () => void;
}

interface MentionUser {
  id: string;
  name: string;
  email: string;
}

const InternalNotes = ({ caseId, onActivityUpdate }: InternalNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingNote, setSendingNote] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Mention state
  const [mentionMode, setMentionMode] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showMentionPopover, setShowMentionPopover] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (internalUserId) {
      fetchNotes();
    }
  }, [caseId, internalUserId]);
  
  useEffect(() => {
    // Set up real-time subscription for new notes
    if (caseId) {
      const channel = supabase
        .channel(`case_notes_${caseId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'case_notes',
            filter: `case_id=eq.${caseId}`,
          },
          (payload) => {
            // When a new note is added, fetch the user details and add to state
            fetchNoteWithUser(payload.new.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [caseId]);
  
  // Search for users when in mention mode and query changes
  useEffect(() => {
    if (mentionMode && mentionQuery) {
      const fetchMentionUsers = async () => {
        const users = await searchUsersByMention(mentionQuery);
        setMentionUsers(users);
      };
      fetchMentionUsers();
    }
  }, [mentionQuery, mentionMode]);

  const fetchNoteWithUser = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('case_notes')
        .select(`
          *,
          users!case_notes_author_id_fkey (
            name,
            email
          )
        `)
        .eq('id', noteId)
        .single();

      if (error) {
        console.error('Error fetching note details:', error);
        return;
      }

      // Check if this note is already in our list to avoid duplicates
      if (!notes.some(note => note.id === data.id)) {
        setNotes(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error fetching note with user:', error);
    }
  };

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

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('case_notes')
        .select(`
          *,
          users!case_notes_author_id_fkey (
            name,
            email
          )
        `)
        .eq('case_id', caseId)
        .eq('is_internal', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Notes fetch error:', error);
        throw error;
      }

      console.log('Notes fetched:', data);
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching internal notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewNote(value);
    
    // Get cursor position
    const selectionStart = e.target.selectionStart;
    setCursorPosition(selectionStart);
    
    // Check if we should activate mention mode
    if (value[selectionStart - 1] === '@') {
      setMentionMode(true);
      setMentionQuery('');
      setShowMentionPopover(true);
      return;
    }
    
    // If in mention mode, update query or exit if needed
    if (mentionMode) {
      // Find the text from the @ to the cursor
      const beforeCursor = value.substring(0, selectionStart);
      const lastAtPos = beforeCursor.lastIndexOf('@');
      
      if (lastAtPos >= 0) {
        const query = beforeCursor.substring(lastAtPos + 1);
        setMentionQuery(query);
        
        // Exit mention mode if space is typed
        if (query.includes(' ') || query.length === 0) {
          setMentionMode(false);
          setShowMentionPopover(false);
        } else {
          setShowMentionPopover(true);
        }
      } else {
        setMentionMode(false);
        setShowMentionPopover(false);
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle escape key to exit mention mode
    if (e.key === 'Escape' && mentionMode) {
      setMentionMode(false);
      setShowMentionPopover(false);
      return;
    }
    
    // Handle tab or enter to select a mention
    if (mentionMode && showMentionPopover && (e.key === 'Tab' || e.key === 'Enter') && mentionUsers.length > 0) {
      e.preventDefault();
      selectMention(mentionUsers[0]);
    }
  };
  
  const selectMention = (user: MentionUser) => {
    if (!textareaRef.current) return;
    
    // Get current text and cursor position
    const textarea = textareaRef.current;
    const text = textarea.value;
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);
    
    // Find the position of the last @ symbol
    const lastAtPos = beforeCursor.lastIndexOf('@');
    
    if (lastAtPos >= 0) {
      // Replace the @query with @username
      const newText = 
        text.substring(0, lastAtPos) + 
        `@${user.name.split(' ')[0]}` + 
        afterCursor;
      
      setNewNote(newText);
      
      // Reset mention state
      setMentionMode(false);
      setMentionQuery('');
      setShowMentionPopover(false);
      
      // Focus back on textarea
      setTimeout(() => {
        textarea.focus();
        // Set cursor after the inserted mention
        const newCursorPos = lastAtPos + user.name.split(' ')[0].length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }, 0);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !internalUserId) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive"
      });
      return;
    }

    setSendingNote(true);
    try {
      // Process @mentions in the note text
      const processedNote = await processMentionsAndNotify(
        newNote.trim(),
        caseId,
        'internal_note',
        'internal_note',
        internalUserId
      );
      
      const { error } = await supabase
        .from('case_notes')
        .insert({
          case_id: caseId,
          note: processedNote,
          author_id: internalUserId,
          is_internal: true
        });

      if (error) {
        console.error('Note insert error:', error);
        throw error;
      }

      // Log activity using our centralized logger
      await logInternalNoteAdded(caseId, newNote.trim(), internalUserId);

      setNewNote('');
      
      // Call the callback to refresh activities in the parent component
      if (onActivityUpdate) {
        onActivityUpdate();
      }
      
      toast({
        title: "Success",
        description: "Internal note added successfully"
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add internal note",
        variant: "destructive"
      });
    } finally {
      setSendingNote(false);
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
    return <div>Loading internal notes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {notes.map((note) => (
          <div key={note.id} className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {note.users.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-medium">{note.users.name}</span>
                <span className="text-muted-foreground ml-2">
                  {formatDateTime(note.created_at)}
                </span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Internal
                </Badge>
              </div>
              <div className="mt-1 text-sm bg-orange-50 border border-orange-200 rounded-lg p-3">
                {note.note}
              </div>
            </div>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No internal notes yet
          </div>
        )}
      </div>
      <div className="border-t pt-4 space-y-2">
        <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Add an internal note (staff only)... use @ to mention colleagues"
                value={newNote}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                className="mb-2 border-orange-200 focus:border-orange-400"
                rows={3}
              />
            </div>
          </PopoverTrigger>
          {mentionMode && (
            <PopoverContent 
              className="w-64 p-0" 
              align="start"
              onOpenAutoFocus={e => e.preventDefault()}
            >
              {mentionUsers.length > 0 ? (
                <div className="py-1">
                  {mentionUsers.map((user) => (
                    <div
                      key={user.id}
                      className="px-2 py-1.5 hover:bg-muted cursor-pointer flex items-center gap-2"
                      onClick={() => selectMention(user)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : mentionQuery ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No users found matching "{mentionQuery}"
                </div>
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  Type a name to search
                </div>
              )}
            </PopoverContent>
          )}
        </Popover>
        <Button 
          onClick={addNote} 
          size="sm"
          disabled={sendingNote || !newNote.trim()}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          <Send className="h-4 w-4 mr-2" />
          {sendingNote ? 'Adding...' : 'Add Internal Note'}
        </Button>
      </div>
    </div>
  );
};

export default InternalNotes;
