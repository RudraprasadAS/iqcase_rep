
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
        message: params.metadata ? JSON.stringify(params.metadata) : null,
        created_at: new Date().toISOString()
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
  console.log('📝 Logging task creation:', { caseId, taskName, assignedTo, performedBy });
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
  console.log('📝 Logging task update:', { caseId, taskName, changes, performedBy });
  return await logActivity({
    caseId,
    activityType: 'task_updated',
    description: `Task "${taskName}" updated: ${changeDescriptions}`,
    performedBy,
    metadata: { taskName, changes }
  });
};

export const logTaskDeleted = async (caseId: string, taskName: string, performedBy: string) => {
  console.log('📝 Logging task deletion:', { caseId, taskName, performedBy });
  return await logActivity({
    caseId,
    activityType: 'task_deleted',
    description: `Task deleted: "${taskName}"`,
    performedBy,
    metadata: { taskName }
  });
};

export const logWatcherAdded = async (caseId: string, watcherName: string, performedBy: string) => {
  console.log('📝 Logging watcher addition:', { caseId, watcherName, performedBy });
  return await logActivity({
    caseId,
    activityType: 'watcher_added',
    description: `Watcher added: ${watcherName}`,
    performedBy,
    metadata: { watcherName }
  });
};

export const logWatcherRemoved = async (caseId: string, watcherName: string, performedBy: string) => {
  console.log('📝 Logging watcher removal:', { caseId, watcherName, performedBy });
  return await logActivity({
    caseId,
    activityType: 'watcher_removed',
    description: `Watcher removed: ${watcherName}`,
    performedBy,
    metadata: { watcherName }
  });
};

export const logInternalNoteAdded = async (caseId: string, notePreview: string, performedBy: string) => {
  console.log('📝 Logging internal note:', { caseId, notePreview, performedBy });
  return await logActivity({
    caseId,
    activityType: 'internal_note_added',
    description: `Internal note added: ${notePreview.substring(0, 50)}...`,
    performedBy,
    metadata: { notePreview }
  });
};

export const logMessageAdded = async (caseId: string, messagePreview: string, isInternal: boolean, performedBy: string) => {
  console.log('📝 Logging message:', { caseId, messagePreview, isInternal, performedBy });
  return await logActivity({
    caseId,
    activityType: isInternal ? 'internal_message_added' : 'message_added',
    description: `${isInternal ? 'Internal m' : 'M'}essage added: ${messagePreview.substring(0, 50)}...`,
    performedBy,
    metadata: { messagePreview, isInternal }
  });
};

// NEW: Case field update logging functions
export const logCaseAssigned = async (caseId: string, assignedToName: string, performedBy: string) => {
  console.log('📝 Logging case assignment:', { caseId, assignedToName, performedBy });
  return await logActivity({
    caseId,
    activityType: 'case_assigned',
    description: `Case assigned to: ${assignedToName}`,
    performedBy,
    metadata: { assignedToName }
  });
};

export const logCaseUnassigned = async (caseId: string, performedBy: string) => {
  console.log('📝 Logging case unassignment:', { caseId, performedBy });
  return await logActivity({
    caseId,
    activityType: 'case_unassigned',
    description: 'Case unassigned',
    performedBy,
    metadata: {}
  });
};

export const logPriorityChanged = async (caseId: string, oldPriority: string, newPriority: string, performedBy: string) => {
  console.log('📝 Logging priority change:', { caseId, oldPriority, newPriority, performedBy });
  return await logActivity({
    caseId,
    activityType: 'priority_changed',
    description: `Priority changed from ${oldPriority} to ${newPriority}`,
    performedBy,
    metadata: { oldPriority, newPriority }
  });
};

export const logStatusChanged = async (caseId: string, oldStatus: string, newStatus: string, performedBy: string) => {
  console.log('📝 Logging status change:', { caseId, oldStatus, newStatus, performedBy });
  return await logActivity({
    caseId,
    activityType: 'status_changed',
    description: `Status changed from ${oldStatus} to ${newStatus}`,
    performedBy,
    metadata: { oldStatus, newStatus }
  });
};

export const logCaseUpdated = async (caseId: string, changes: Record<string, { old: any, new: any }>, performedBy: string) => {
  console.log('📝 Logging case update:', { caseId, changes, performedBy });
  
  // Log each change separately for better tracking
  const results = [];
  
  for (const [field, change] of Object.entries(changes)) {
    let activityType = 'case_updated';
    let description = `${field} updated`;
    
    // Use specific logging functions for key fields
    if (field === 'assigned_to') {
      if (change.new) {
        await logCaseAssigned(caseId, change.new, performedBy);
      } else {
        await logCaseUnassigned(caseId, performedBy);
      }
      continue;
    } else if (field === 'priority') {
      await logPriorityChanged(caseId, change.old, change.new, performedBy);
      continue;
    } else if (field === 'status') {
      await logStatusChanged(caseId, change.old, change.new, performedBy);
      continue;
    } else {
      // Generic field update
      description = `${field.replace('_', ' ')} changed from "${change.old}" to "${change.new}"`;
    }
    
    const result = await logActivity({
      caseId,
      activityType,
      description,
      performedBy,
      metadata: { field, oldValue: change.old, newValue: change.new }
    });
    
    results.push(result);
  }
  
  return results;
};
