
import { supabase } from '@/integrations/supabase/client';

export interface LogActivityParams {
  caseId: string;
  activityType: string;
  description: string;
  performedBy: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export const logActivity = async (params: LogActivityParams) => {
  try {
    console.log('📝 Logging activity:', params);

    const { data, error } = await supabase
      .from('case_activities')
      .insert({
        case_id: params.caseId,
        activity_type: params.activityType,
        description: params.description,
        performed_by: params.performedBy,
        duration_minutes: params.duration,
        message: params.metadata ? JSON.stringify(params.metadata) : null
      })
      .select('*')
      .single();

    if (error) {
      console.error('📝 Error logging activity:', error);
      return { success: false, error };
    }

    console.log('📝 Activity logged successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('📝 Exception logging activity:', error);
    return { success: false, error };
  }
};

// Specific activity logging functions
export const logTaskCreated = async (caseId: string, taskName: string, assignedTo: string | null, performedBy: string) => {
  return await logActivity({
    caseId,
    activityType: 'task_created',
    description: `Task created: "${taskName}"${assignedTo ? ` (assigned to user)` : ''}`,
    performedBy,
    metadata: { taskName, assignedTo }
  });
};

export const logTaskUpdated = async (caseId: string, taskName: string, changes: Record<string, any>, performedBy: string) => {
  const changeDescriptions = Object.entries(changes).map(([key, value]) => `${key}: ${value}`).join(', ');
  return await logActivity({
    caseId,
    activityType: 'task_updated',
    description: `Task "${taskName}" updated: ${changeDescriptions}`,
    performedBy,
    metadata: { taskName, changes }
  });
};

export const logTaskDeleted = async (caseId: string, taskName: string, performedBy: string) => {
  return await logActivity({
    caseId,
    activityType: 'task_deleted',
    description: `Task deleted: "${taskName}"`,
    performedBy,
    metadata: { taskName }
  });
};

export const logWatcherAdded = async (caseId: string, watcherName: string, performedBy: string) => {
  return await logActivity({
    caseId,
    activityType: 'watcher_added',
    description: `Watcher added: ${watcherName}`,
    performedBy,
    metadata: { watcherName }
  });
};

export const logWatcherRemoved = async (caseId: string, watcherName: string, performedBy: string) => {
  return await logActivity({
    caseId,
    activityType: 'watcher_removed',
    description: `Watcher removed: ${watcherName}`,
    performedBy,
    metadata: { watcherName }
  });
};

export const logInternalNoteAdded = async (caseId: string, notePreview: string, performedBy: string) => {
  return await logActivity({
    caseId,
    activityType: 'internal_note_added',
    description: `Internal note added: ${notePreview.substring(0, 50)}...`,
    performedBy,
    metadata: { notePreview }
  });
};

export const logMessageAdded = async (caseId: string, messagePreview: string, isInternal: boolean, performedBy: string) => {
  return await logActivity({
    caseId,
    activityType: isInternal ? 'internal_message_added' : 'message_added',
    description: `${isInternal ? 'Internal m' : 'M'}essage added: ${messagePreview.substring(0, 50)}...`,
    performedBy,
    metadata: { messagePreview, isInternal }
  });
};
