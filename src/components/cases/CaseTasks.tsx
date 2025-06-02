
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Calendar, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Task {
  id: string;
  task_name: string;
  status: string;
  due_date?: string;
  assigned_to?: string;
  created_at: string;
  created_by?: string;
  users?: { name: string };
  assigned_user?: { name: string };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface CaseTasksProps {
  caseId: string;
}

const CaseTasks = ({ caseId }: CaseTasksProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
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
      fetchTasks();
      fetchUsers();
    }
  }, [caseId, internalUserId]);

  const fetchInternalUserId = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('User lookup error:', userError);
        return;
      }

      if (userData) {
        setInternalUserId(userData.id);
      }
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
          users!case_tasks_assigned_to_fkey(name),
          assigned_user:users!case_tasks_created_by_fkey(name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Tasks fetch error:', error);
        throw error;
      }

      console.log('Tasks fetched:', data);
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Users fetch error:', error);
        throw error;
      }

      console.log('Users fetched:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addTask = async () => {
    if (!newTaskName.trim() || !internalUserId) {
      toast({
        title: "Error",
        description: "Please enter a task name",
        variant: "destructive"
      });
      return;
    }

    try {
      const taskData = {
        case_id: caseId,
        task_name: newTaskName.trim(),
        assigned_to: newTaskAssignee || null,
        due_date: newTaskDueDate || null,
        created_by: internalUserId,
        status: 'open'
      };

      const { error } = await supabase
        .from('case_tasks')
        .insert(taskData);

      if (error) {
        console.error('Task insert error:', error);
        throw error;
      }

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseId,
          activity_type: 'task_created',
          description: `Task created: ${newTaskName.trim()}`,
          performed_by: internalUserId
        });

      await fetchTasks();
      setIsAddDialogOpen(false);
      setNewTaskName('');
      setNewTaskAssignee('');
      setNewTaskDueDate('');
      
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

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!internalUserId) return;

    try {
      const { error } = await supabase
        .from('case_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        console.error('Task update error:', error);
        throw error;
      }

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseId,
          activity_type: 'task_updated',
          description: `Task status changed to: ${newStatus}`,
          performed_by: internalUserId
        });

      await fetchTasks();
      toast({
        title: "Success",
        description: "Task status updated"
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

  const deleteTask = async (taskId: string) => {
    if (!internalUserId) return;

    try {
      const { error } = await supabase
        .from('case_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Task delete error:', error);
        throw error;
      }

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseId,
          activity_type: 'task_deleted',
          description: 'Task deleted',
          performed_by: internalUserId
        });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <CheckSquare className="h-5 w-5 mr-2" />
          Tasks ({tasks.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Task Name</label>
                <Input
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task description..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Assign To</label>
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="datetime-local"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addTask} disabled={!newTaskName.trim()}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No tasks created
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                  <span className="font-medium">{task.task_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={task.status}
                    onValueChange={(value) => updateTaskStatus(task.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTask(task.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {task.assigned_to && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {task.users?.name || 'Assigned'}
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </div>
                )}
                <div>
                  Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default CaseTasks;
