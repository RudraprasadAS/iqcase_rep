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
import { logWatcherAdded, logWatcherRemoved } from '@/utils/activityLogger';
import { createWatcherAddedNotification } from '@/utils/notifications';

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
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (internalUserId) {
      fetchWatchers();
      fetchAvailableUsers();
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

  const fetchWatchers = async () => {
    try {
      const { data, error } = await supabase
        .from('case_watchers')
        .select(`
          *,
          users!case_watchers_user_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq('case_id', caseId);

      if (error) {
        console.error('Watchers fetch error:', error);
        throw error;
      }

      console.log('Watchers fetched:', data);
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

      if (error) {
        console.error('Users fetch error:', error);
        throw error;
      }

      console.log('Available users fetched:', data);
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addWatcher = async () => {
    if (!selectedUserId || !internalUserId) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('👁️ ADDING WATCHER:', {
        caseId,
        selectedUserId,
        internalUserId
      });

      // Get the user name for logging and notification
      const selectedUser = availableUsers.find(u => u.id === selectedUserId);
      const watcherName = selectedUser?.name || 'Unknown User';

      console.log('👁️ Selected user:', selectedUser);

      const { error } = await supabase
        .from('case_watchers')
        .insert({
          case_id: caseId,
          user_id: selectedUserId,
          added_by: internalUserId
        });

      if (error) {
        console.error('👁️ Watcher insert error:', error);
        throw error;
      }

      console.log('👁️ Watcher added successfully');

      // Log the activity
      await logWatcherAdded(caseId, watcherName, internalUserId);

      // Create notification for the new watcher
      console.log('👁️ Creating watcher notification...');
      try {
        // Get case title
        const { data: caseData } = await supabase
          .from('cases')
          .select('title')
          .eq('id', caseId)
          .single();

        const caseTitle = caseData?.title || 'a case';

        const notificationResult = await createWatcherAddedNotification(
          selectedUserId,
          caseTitle,
          caseId
        );

        console.log('👁️ Watcher notification result:', notificationResult);
      } catch (notificationError) {
        console.error('👁️ Error creating watcher notification:', notificationError);
      }

      await fetchWatchers();
      setIsAddDialogOpen(false);
      setSelectedUserId('');
      
      toast({
        title: "Success",
        description: "Watcher added successfully"
      });
    } catch (error) {
      console.error('👁️ Error adding watcher:', error);
      toast({
        title: "Error",
        description: "Failed to add watcher",
        variant: "destructive"
      });
    }
  };

  const removeWatcher = async (watcherId: string, watcherName: string) => {
    if (!internalUserId) return;

    try {
      console.log('👁️ REMOVING WATCHER:', watcherId, watcherName);

      const { error } = await supabase
        .from('case_watchers')
        .delete()
        .eq('id', watcherId);

      if (error) {
        console.error('👁️ Watcher delete error:', error);
        throw error;
      }

      console.log('👁️ Watcher removed successfully');

      // Log the activity
      await logWatcherRemoved(caseId, watcherName, internalUserId);
      
      await fetchWatchers();
      toast({
        title: "Success",
        description: "Watcher removed successfully"
      });
    } catch (error) {
      console.error('👁️ Error removing watcher:', error);
      toast({
        title: "Error",
        description: "Failed to remove watcher",
        variant: "destructive"
      });
    }
  };

  const watcherUserIds = watchers.map(w => w.user_id);
  const availableUsersToAdd = availableUsers.filter(u => !watcherUserIds.includes(u.id));

  // Add real-time subscription for watchers
  useEffect(() => {
    if (!caseId) return;

    console.log('👁️ Setting up real-time subscription for case watchers:', caseId);

    const channel = supabase
      .channel(`case_watchers_${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'case_watchers',
          filter: `case_id=eq.${caseId}`
        },
        (payload) => {
          console.log('👁️ Real-time watcher change:', payload);
          fetchWatchers(); // Refetch watchers when changes occur
        }
      )
      .subscribe();

    return () => {
      console.log('👁️ Cleaning up watchers subscription');
      supabase.removeChannel(channel);
    };
  }, [caseId]);

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
                onClick={() => removeWatcher(watcher.id, watcher.users.name)}
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
