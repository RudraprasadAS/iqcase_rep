
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckSquare, Plus, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Task {
  id: string;
  task_name: string;
  status: string;
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  users?: {
    name: string;
    email: string;
  };
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
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('unassigned');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [caseId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('case_tasks')
        .select(`
          *,
          users!case_tasks_assigned_to_fkey (
            name,
            email
          )
        `)
        .eq('case_id', caseId)
        .order('created_at');

      if (error) throw error;
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
        .eq('is_active', true);

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addTask = async () => {
    if (!newTaskName.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('case_tasks')
        .insert({
          case_id: caseId,
          task_name: newTaskName.trim(),
          assigned_to: selectedAssignee === 'unassigned' ? null : selectedAssignee,
          created_by: user.id
        });

      if (error) throw error;

      await fetchTasks();
      setIsAddDialogOpen(false);
      setNewTaskName('');
      setSelectedAssignee('unassigned');
      
      toast({
        title: "Success",
        description: "Task added successfully"
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive"
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('case_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            Tasks ({completedTasks}/{tasks.length})
          </CardTitle>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Task Name</label>
                <Input
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Assign To (Optional)</label>
                <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {availableUsers.map((user) => (
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
                <Button onClick={addTask} disabled={!newTaskName.trim()}>
                  Add Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No tasks yet
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                checked={task.status === 'done'}
                onCheckedChange={(checked) => 
                  updateTaskStatus(task.id, checked ? 'done' : 'open')
                }
              />
              <div className="flex-1">
                <div className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.task_name}
                </div>
                {task.users && (
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <User className="h-3 w-3 mr-1" />
                    {task.users.name}
                  </div>
                )}
                <div className={`text-xs ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default CaseTasks;
