import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class TasksService {
  constructor(private supabaseService: SupabaseService) {}

  async createTask(caseId: string, taskData: any, userId: string) {
    try {
      const supabase = this.supabaseService.getClient();

      const taskInsertData = {
        case_id: caseId,
        task_name: taskData.task_name.trim(),
        created_by: userId,
        status: 'open',
        ...(taskData.assigned_to && { assigned_to: taskData.assigned_to }),
        ...(taskData.due_date && { due_date: taskData.due_date }),
      };

      const { data, error } = await supabase
        .from('case_tasks')
        .insert(taskInsertData)
        .select('*')
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('case_activities').insert({
        case_id: caseId,
        activity_type: 'task_created',
        description: `Task created: ${taskData.task_name}`,
        performed_by: userId,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error: error.message };
    }
  }

  async getTasks(caseId: string) {
    try {
      const supabase = this.supabaseService.getClient();

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

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTask(taskId: string, updates: any, userId: string) {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('case_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select('*')
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('case_activities').insert({
        case_id: data.case_id,
        activity_type: 'task_updated',
        description: `Task updated: ${data.task_name}`,
        performed_by: userId,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteTask(taskId: string, userId: string) {
    try {
      const supabase = this.supabaseService.getClient();

      // Get task details first
      const { data: task } = await supabase
        .from('case_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      const { error } = await supabase
        .from('case_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      if (task) {
        // Log activity
        await supabase.from('case_activities').insert({
          case_id: task.case_id,
          activity_type: 'task_deleted',
          description: `Task deleted: ${task.task_name}`,
          performed_by: userId,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    }
  }
}