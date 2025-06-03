import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Calendar, User, X, Check } from 'lucide-react';
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

      const { data: taskResult, error } = await supabase
        .from('case_tasks')
        .insert(taskData)
        .select()
        .single();

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

      // Create notification for assigned user (if different from creator)
      if (newTaskAssignee && newTaskAssignee !== internalUserId) {
        console.log('Creating task assignment notification for user:', newTaskAssignee);
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: newTaskAssignee,
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${newTaskName.trim()}`,
            notification_type: 'task_assignment',
            case_id: caseId
          });

        if (notificationError) {
          console.error('Error creating task notification:', notificationError);
        } else {
          console.log('Task assignment notification created successfully');
        }
      }

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

  const toggleTaskComplete = async (taskId: string, currentStatus: string) => {
    if (!internalUserId) return;

    const newStatus = currentStatus === 'completed' ? 'open' : 'completed';

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
          description: `Task marked as ${newStatus}`,
          performed_by: internalUserId
        });

      // Find the task to get assigned user
      const task = tasks.find(t => t.id === taskId);
      if (task && task.assigned_to && task.assigned_to !== internalUserId) {
        console.log('Creating task status notification for user:', task.assigned_to);
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: task.assigned_to,
            title: 'Task Status Updated',
            message: `Task "${task.task_name}" has been marked as ${newStatus}`,
            notification_type: 'task_assignment',
            case_id: caseId
          });

        if (notificationError) {
          console.error('Error creating task status notification:', notificationError);
        } else {
          console.log('Task status notification created successfully');
        }
      }

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
                <div className="flex items-center gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTaskComplete(task.id, task.status)}
                    className={`p-1 h-8 w-8 ${
                      task.status === 'completed' 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Check className={`h-4 w-4 ${task.status === 'completed' ? 'opacity-100' : 'opacity-30'}`} />
                  </Button>
                  <span 
                    className={`font-medium cursor-pointer flex-1 ${
                      task.status === 'completed' 
                        ? 'line-through text-green-600' 
                        : 'text-gray-900 hover:text-gray-700'
                    }`}
                    onClick={() => toggleTaskComplete(task.id, task.status)}
                  >
                    {task.task_name}
                  </span>
                  {task.status === 'completed' && (
                    <Badge className="bg-green-100 text-green-800" variant="secondary">
                      Completed
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground ml-11">
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
