import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckSquare, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createTaskAssignmentNotification } from '@/utils/notificationUtils';
import { logTaskCreated, logTaskUpdated, logTaskDeleted } from '@/utils/activityLogger';
import { triggerTaskAssignmentNotification } from '@/utils/notificationTriggers';

interface Task {
  id: string;
  task_name: string;
  status: string;
  due_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  assigned_to_user?: {
    name: string;
    email: string;
  };
  created_by_user?: {
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
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    task_name: '',
    assigned_to: '',
    due_date: '',
    status: 'open'
  });
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
          assigned_to_user:users!case_tasks_assigned_to_fkey(name, email),
          created_by_user:users!case_tasks_created_by_fkey(name, email)
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
        .eq('user_type', 'internal');

      if (error) {
        console.error('Users fetch error:', error);
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addTask = async () => {
    if (!newTask.task_name.trim() || !internalUserId) {
      toast({
        title: "Error",
        description: "Please enter a task name",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Creating task with data:', newTask);
      
      const taskData = {
        case_id: caseId,
        task_name: newTask.task_name.trim(),
        assigned_to: newTask.assigned_to || null,
        due_date: newTask.due_date || null,
        status: newTask.status,
        created_by: internalUserId
      };

      const { data, error } = await supabase
        .from('case_tasks')
        .insert(taskData)
        .select('*')
        .single();

      if (error) {
        console.error('Task insert error:', error);
        throw error;
      }

      console.log('Task created successfully:', data);

      // Log the activity IMMEDIATELY after task creation
      console.log('🚀 About to log task creation activity');
      const logResult = await logTaskCreated(caseId, newTask.task_name, newTask.assigned_to, internalUserId);
      console.log('🚀 Task creation log result:', logResult);

      // Send notification if task is assigned
      if (newTask.assigned_to && newTask.assigned_to !== internalUserId) {
        console.log('🔔 Triggering task assignment notification');
        
        // Get case details for notification
        const { data: caseData } = await supabase
          .from('cases')
          .select('title')
          .eq('id', caseId)
          .single();

        if (caseData) {
          await triggerTaskAssignmentNotification(
            caseId,
            caseData.title,
            newTask.task_name,
            newTask.assigned_to,
            internalUserId
          );
          console.log('🔔 Task assignment notification triggered successfully');
        }
      }

      await fetchTasks();
      setIsAddDialogOpen(false);
      setNewTask({
        task_name: '',
        assigned_to: '',
        due_date: '',
        status: 'open'
      });
      
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

  const updateTaskStatus = async (taskId: string, newStatus: string, taskName: string) => {
    if (!internalUserId) return;

    try {
      const { error } = await supabase
        .from('case_tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) {
        console.error('Task status update error:', error);
        throw error;
      }

      // Log the activity IMMEDIATELY
      console.log('🚀 About to log task status update');
      const logResult = await logTaskUpdated(caseId, taskName, { status: newStatus }, internalUserId);
      console.log('🚀 Task status update log result:', logResult);

      await fetchTasks();
      
      toast({
        title: "Success",
        description: "Task status updated"
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive"
      });
    }
  };

  const updateTask = async () => {
    if (!editingTask || !internalUserId) return;

    try {
      const originalTask = tasks.find(t => t.id === editingTask.id);
      const changes: Record<string, any> = {};
      
      if (originalTask?.task_name !== editingTask.task_name) changes.task_name = editingTask.task_name;
      if (originalTask?.assigned_to !== editingTask.assigned_to) changes.assigned_to = editingTask.assigned_to;
      if (originalTask?.due_date !== editingTask.due_date) changes.due_date = editingTask.due_date;
      if (originalTask?.status !== editingTask.status) changes.status = editingTask.status;

      const { error } = await supabase
        .from('case_tasks')
        .update({
          task_name: editingTask.task_name,
          assigned_to: editingTask.assigned_to || null,
          due_date: editingTask.due_date || null,
          status: editingTask.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTask.id);

      if (error) {
        console.error('Task update error:', error);
        throw error;
      }

      // Log the activity if there were changes
      if (Object.keys(changes).length > 0) {
        await logTaskUpdated(caseId, editingTask.task_name, changes, internalUserId);
      }

      // Send notification if newly assigned to someone else
      if (changes.assigned_to && changes.assigned_to !== internalUserId) {
        console.log('🔔 Triggering task assignment notification for update');
        
        // Get case details for notification
        const { data: caseData } = await supabase
          .from('cases')
          .select('title')
          .eq('id', caseId)
          .single();

        if (caseData) {
          await triggerTaskAssignmentNotification(
            caseId,
            caseData.title,
            editingTask.task_name,
            changes.assigned_to,
            internalUserId
          );
          console.log('🔔 Task assignment notification triggered successfully');
        }
      }

      await fetchTasks();
      setIsEditDialogOpen(false);
      setEditingTask(null);
      
      toast({
        title: "Success",
        description: "Task updated successfully"
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

  const deleteTask = async (taskId: string, taskName: string) => {
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

      // Log the deletion activity IMMEDIATELY
      console.log('🚀 About to log task deletion');
      const logResult = await logTaskDeleted(caseId, taskName, internalUserId);
      console.log('🚀 Task deletion log result:', logResult);

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'open': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    return new Date(dueDateString) < new Date();
  };

  // Add real-time subscription for tasks
  useEffect(() => {
    if (!caseId) return;

    console.log('🔄 Setting up real-time subscription for case tasks:', caseId);

    const channel = supabase
      .channel(`case_tasks_${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'case_tasks',
          filter: `case_id=eq.${caseId}`
        },
        (payload) => {
          console.log('🔄 Real-time task change:', payload);
          fetchTasks(); // Refetch tasks when changes occur
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up tasks subscription');
      supabase.removeChannel(channel);
    };
  }, [caseId]);

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
            <Button size="sm">
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
                  value={newTask.task_name}
                  onChange={(e) => setNewTask(prev => ({ ...prev, task_name: e.target.value }))}
                  placeholder="Enter task name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Assign To</label>
                <Select value={newTask.assigned_to} onValueChange={(value) => setNewTask(prev => ({ ...prev, assigned_to: value === 'unassigned' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addTask}>
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
            <div key={task.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{task.task_name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    {task.due_date && (
                      <Badge variant={isOverdue(task.due_date) ? "destructive" : "outline"} className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Due: {formatDate(task.due_date)}
                        {isOverdue(task.due_date) && ' (Overdue)'}
                      </Badge>
                    )}
                  </div>
                  {task.assigned_to_user && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Assigned to: {task.assigned_to_user.name}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Created: {formatDate(task.created_at)} by {task.created_by_user?.name || 'Unknown'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={task.status} onValueChange={(value) => updateTaskStatus(task.id, value, task.task_name)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingTask(task);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTask(task.id, task.task_name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Task Name</label>
                <Input
                  value={editingTask.task_name}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, task_name: e.target.value } : null)}
                  placeholder="Enter task name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Assign To</label>
                <Select 
                  value={editingTask.assigned_to || 'unassigned'} 
                  onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, assigned_to: value === 'unassigned' ? null : value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={editingTask.due_date || ''}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, due_date: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={editingTask.status} 
                  onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, status: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateTask}>
                  Update Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CaseTasks;
