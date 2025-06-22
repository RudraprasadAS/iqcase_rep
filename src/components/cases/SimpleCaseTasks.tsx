import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CheckSquare, Square, Plus, Trash2, Calendar as CalendarIcon, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { logTaskCreated, logTaskUpdated, logTaskDeleted } from '@/utils/activityLogger';

interface Task {
  id: string;
  task_name: string;
  status: string;
  created_at: string;
  created_by: string;
  assigned_to?: string;
  due_date?: string;
  users?: { name: string };
  assigned_user?: { name: string };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface SimpleCaseTasksProps {
  caseId: string;
  onActivityUpdate?: () => void;
}

const SimpleCaseTasks = ({ caseId, onActivityUpdate }: SimpleCaseTasksProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(true);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (caseId) {
      fetchTasks();
      fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('user_type', 'internal')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('case_tasks')
        .select(`
          *,
          users!case_tasks_created_by_fkey(name),
          assigned_user:users!case_tasks_assigned_to_fkey(name)
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
    if (!internalUserId) return;
    
    const newStatus = currentStatus === 'completed' ? 'open' : 'completed';
    const task = tasks.find(t => t.id === taskId);
    
    try {
      const { error } = await supabase
        .from('case_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      
      // Log the task status change activity
      console.log('🚀 About to log task status change');
      await logTaskUpdated(caseId, task?.task_name || 'Unknown Task', { status: newStatus }, internalUserId);
      console.log('🚀 Task status change logged successfully');
      
      await fetchTasks();
      
      // Call the callback to refresh activities in the parent component
      if (onActivityUpdate) {
        onActivityUpdate();
      }
      
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
      const taskData: any = {
        case_id: caseId,
        task_name: newTaskName.trim(),
        created_by: internalUserId,
        status: 'open'
      };

      if (selectedAssignee) {
        taskData.assigned_to = selectedAssignee;
      }

      if (selectedDueDate) {
        taskData.due_date = selectedDueDate.toISOString();
      }

      const { error } = await supabase
        .from('case_tasks')
        .insert(taskData);

      if (error) throw error;
      
      // Log the task creation activity
      console.log('🚀 About to log task creation');
      await logTaskCreated(caseId, newTaskName.trim(), selectedAssignee || null, internalUserId);
      console.log('🚀 Task creation logged successfully');
      
      // Send notification if task is assigned to someone other than the creator
      if (selectedAssignee && selectedAssignee !== internalUserId) {
        console.log('🔔 Sending task assignment notification to:', selectedAssignee);
        const { createTaskAssignmentNotification } = await import('@/utils/notificationUtils');
        const notificationResult = await createTaskAssignmentNotification(
          selectedAssignee,
          newTaskName.trim(),
          caseId,
          internalUserId
        );
        console.log('🔔 Task assignment notification result:', notificationResult);
        
        if (!notificationResult.success) {
          console.error('🔔 Failed to send task assignment notification:', notificationResult.error);
        }
      } else {
        console.log('🔔 No notification needed - task not assigned or assigned to creator');
      }
      
      setNewTaskName('');
      setSelectedAssignee('');
      setSelectedDueDate(undefined);
      setShowTaskForm(false);
      await fetchTasks();
      
      // Call the callback to refresh activities in the parent component
      if (onActivityUpdate) {
        onActivityUpdate();
      }
      
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
    if (!internalUserId) return;
    
    const task = tasks.find(t => t.id === taskId);
    
    try {
      const { error } = await supabase
        .from('case_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      // Log the task deletion activity
      console.log('🚀 About to log task deletion');
      await logTaskDeleted(caseId, task?.task_name || 'Unknown Task', internalUserId);
      console.log('🚀 Task deletion logged successfully');
      
      await fetchTasks();
      
      // Call the callback to refresh activities in the parent component
      if (onActivityUpdate) {
        onActivityUpdate();
      }
      
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

  const formatDueDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date() && new Date(dateString).toDateString() !== new Date().toDateString();
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
        <CardTitle className="flex items-center justify-between">
          Tasks ({tasks.length})
          <Button 
            onClick={() => setShowTaskForm(!showTaskForm)} 
            size="sm"
            variant={showTaskForm ? "outline" : "default"}
          >
            <Plus className="h-4 w-4 mr-1" />
            {showTaskForm ? "Cancel" : "Add Task"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showTaskForm && (
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <Input
              placeholder="Task description..."
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDueDate ? format(selectedDueDate, "MMM d, yyyy") : "Due date..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDueDate}
                    onSelect={setSelectedDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              onClick={createTask} 
              size="sm" 
              disabled={!newTaskName.trim()}
              className="w-full"
            >
              Create Task
            </Button>
          </div>
        )}

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
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      by {task.users?.name || 'Unknown'}
                    </p>
                    {task.assigned_user && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">
                          {task.assigned_user.name}
                        </span>
                      </div>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span className={`text-xs ${isOverdue(task.due_date) ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {formatDueDate(task.due_date)}
                        </span>
                      </div>
                    )}
                  </div>
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
