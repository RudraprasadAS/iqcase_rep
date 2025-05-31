
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Lock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
}

const InternalNotes = ({ caseId }: InternalNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingNote, setSendingNote] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, [caseId]);

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

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching internal notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;

    setSendingNote(true);
    try {
      const { error } = await supabase
        .from('case_notes')
        .insert({
          case_id: caseId,
          note: newNote.trim(),
          author_id: user.id,
          is_internal: true
        });

      if (error) throw error;

      setNewNote('');
      await fetchNotes();
      
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="h-5 w-5 mr-2" />
          Internal Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Textarea
            placeholder="Add an internal note (staff only)..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="mb-2 border-orange-200 focus:border-orange-400"
            rows={3}
          />
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
      </CardContent>
    </Card>
  );
};

export default InternalNotes;
