import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

export const useTasksApi = (caseId: string) => {
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks-api', caseId],
    queryFn: async () => {
      console.log('🔔 [useTasksApi] Fetching tasks from backend API for case:', caseId);
      
      try {
        const result = await apiService.getTasks(caseId);
        console.log('🔔 [useTasksApi] Tasks fetched:', result);
        return Array.isArray(result) ? result : (result as any)?.data || [];
      } catch (error) {
        console.error('🔔 [useTasksApi] Exception fetching tasks:', error);
        throw error;
      }
    },
    enabled: !!caseId,
  });

  // Create task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      console.log('🔔 [useTasksApi] Creating task:', taskData);
      return await apiService.createTask(caseId, taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-api', caseId] });
      toast({
        title: "Success",
        description: "Task created successfully"
      });
    },
    onError: (error) => {
      console.error('🔔 [useTasksApi] Failed to create task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  });

  // Update task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      console.log('🔔 [useTasksApi] Updating task:', taskId, updates);
      return await apiService.updateTask(taskId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-api', caseId] });
      toast({
        title: "Success",
        description: "Task updated successfully"
      });
    },
    onError: (error) => {
      console.error('🔔 [useTasksApi] Failed to update task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  });

  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      console.log('🔔 [useTasksApi] Deleting task:', taskId);
      return await apiService.deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-api', caseId] });
      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
    },
    onError: (error) => {
      console.error('🔔 [useTasksApi] Failed to delete task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    }
  });

  const createTask = (taskData: any) => {
    createTaskMutation.mutate(taskData);
  };

  const updateTask = (taskId: string, updates: any) => {
    updateTaskMutation.mutate({ taskId, updates });
  };

  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  return {
    tasks: tasksData || [],
    loading: isLoading,
    createTask,
    updateTask,
    deleteTask,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['tasks-api', caseId] })
  };
};