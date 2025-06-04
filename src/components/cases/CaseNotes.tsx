import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface CaseNote {
  id: string;
  note: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  users: {
    name: string;
    email: string;
  };
}

interface CaseNotesProps {
  caseId: string;
}

const CaseNotes = ({ caseId }: CaseNotesProps) => {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (internalUserId && caseId) {
      fetchNotes();
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
        .eq('is_internal', false) // These are case notes, not internal communication
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Notes fetch error:', error);
        throw error;
      }

      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching case notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!newNote.trim() || !internalUserId) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('case_notes')
        .insert({
          case_id: caseId,
          note: newNote.trim(),
          author_id: internalUserId,
          is_internal: false // This marks it as a case note, not internal communication
        });

      if (error) {
        console.error('Note save error:', error);
        throw error;
      }

      setNewNote('');
      await fetchNotes();
      
      toast({
        title: "Success",
        description: "Case note saved successfully"
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save case note",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (note: CaseNote) => {
    setEditingNote(note.id);
    setEditingText(note.note);
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditingText('');
  };

  const updateNote = async (noteId: string) => {
    if (!editingText.trim()) {
      toast({
        title: "Error",
        description: "Note cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('case_notes')
        .update({
          note: editingText.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);

      if (error) {
        console.error('Note update error:', error);
        throw error;
      }

      setEditingNote(null);
      setEditingText('');
      await fetchNotes();
      
      toast({
        title: "Success",
        description: "Case note updated successfully"
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update case note",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('case_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('Note delete error:', error);
        throw error;
      }

      await fetchNotes();
      
      toast({
        title: "Success",
        description: "Case note deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete case note",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
    return <div>Loading case notes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Case Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a case note (investigation details, follow-ups, observations, etc.)..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="border-blue-200 focus:border-blue-400"
            rows={3}
          />
          <Button 
            onClick={saveNote} 
            size="sm"
            disabled={saving || !newNote.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Case Note'}
          </Button>
        </div>

        {/* Existing notes */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {note.users.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-medium">{note.users.name}</span>
                    <div className="text-xs text-muted-foreground">
                      Added {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      {note.updated_at !== note.created_at && (
                        <span> • Edited {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(note)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {editingNote === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="text-sm"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => updateNote(note.id)}
                      disabled={saving}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">
                  {note.note}
                </div>
              )}
            </div>
          ))}
          {notes.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No case notes yet. Add notes about your investigation, follow-ups, or observations.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseNotes;
