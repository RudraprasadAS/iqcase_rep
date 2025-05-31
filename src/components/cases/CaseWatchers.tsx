
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Watcher {
  id: string;
  user_id: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface CaseWatchersProps {
  caseId: string;
}

const CaseWatchers = ({ caseId }: CaseWatchersProps) => {
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchWatchers();
    fetchAvailableUsers();
  }, [caseId]);

  const fetchWatchers = async () => {
    try {
      const { data, error } = await supabase
        .from('case_watchers')
        .select(`
          *,
          users (
            id,
            name,
            email
          )
        `)
        .eq('case_id', caseId);

      if (error) throw error;
      setWatchers(data || []);
    } catch (error) {
      console.error('Error fetching watchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('is_active', true);

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addWatcher = async () => {
    if (!selectedUserId || !user) return;

    try {
      const { error } = await supabase
        .from('case_watchers')
        .insert({
          case_id: caseId,
          user_id: selectedUserId,
          added_by: user.id
        });

      if (error) throw error;

      await fetchWatchers();
      setIsAddDialogOpen(false);
      setSelectedUserId('');
      
      toast({
        title: "Success",
        description: "Watcher added successfully"
      });
    } catch (error) {
      console.error('Error adding watcher:', error);
      toast({
        title: "Error",
        description: "Failed to add watcher",
        variant: "destructive"
      });
    }
  };

  const removeWatcher = async (watcherId: string) => {
    try {
      const { error } = await supabase
        .from('case_watchers')
        .delete()
        .eq('id', watcherId);

      if (error) throw error;
      
      await fetchWatchers();
      toast({
        title: "Success",
        description: "Watcher removed successfully"
      });
    } catch (error) {
      console.error('Error removing watcher:', error);
      toast({
        title: "Error",
        description: "Failed to remove watcher",
        variant: "destructive"
      });
    }
  };

  const watcherUserIds = watchers.map(w => w.user_id);
  const availableUsersToAdd = availableUsers.filter(u => !watcherUserIds.includes(u.id));

  if (loading) {
    return <div>Loading watchers...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Watchers ({watchers.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Watcher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Watcher</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select User</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsersToAdd.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addWatcher} disabled={!selectedUserId}>
                  Add Watcher
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {watchers.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No watchers
          </div>
        ) : (
          watchers.map((watcher) => (
            <div key={watcher.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {watcher.users.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{watcher.users.name}</div>
                  <div className="text-xs text-muted-foreground">{watcher.users.email}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeWatcher(watcher.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default CaseWatchers;
