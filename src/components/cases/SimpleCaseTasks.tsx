
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Task {
  id: string;
  task_name: string;
  status: string;
  created_at: string;
  created_by: string;
  users?: { name: string };
}

interface SimpleCaseTasksProps {
  caseId: string;
}

const SimpleCaseTasks = ({ caseId }: SimpleCaseTasksProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [loading, setLoading] = useState(true);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (caseId) {
      fetchTasks();
    }
  }, [caseId]);

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

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('case_tasks')
        .select(`
          *,
          users!case_tasks_created_by_fkey(name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'open' : 'completed';
    
    try {
      const { error } = await supabase
        .from('case_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchTasks();
      toast({
        title: "Success",
        description: `Task marked as ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const createTask = async () => {
    if (!newTaskName.trim() || !internalUserId) return;

    try {
      const { error } = await supabase
        .from('case_tasks')
        .insert({
          case_id: caseId,
          task_name: newTaskName.trim(),
          created_by: internalUserId,
          status: 'open'
        });

      if (error) throw error;
      
      setNewTaskName('');
      await fetchTasks();
      toast({
        title: "Success",
        description: "Task created successfully"
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('case_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchTasks();
      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createTask()}
          />
          <Button onClick={createTask} size="sm" disabled={!newTaskName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTaskStatus(task.id, task.status)}
                  className="p-0 h-auto"
                >
                  {task.status === 'completed' ? (
                    <CheckSquare className="h-5 w-5 text-green-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </Button>
                <div className="flex-1">
                  <p className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                    {task.task_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created by {task.users?.name || 'Unknown'}
                  </p>
                </div>
                <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                  {task.status}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No tasks yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleCaseTasks;
