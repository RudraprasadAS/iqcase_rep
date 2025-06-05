
import { supabase } from '@/integrations/supabase/client';
import { notifyExternalUserOfCaseUpdate } from './externalNotificationUtils';

// Helper function to get current user's internal ID
const getCurrentInternalUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  return userData?.id || null;
};

export const logCaseCreated = async (caseId: string, caseTitle: string, performedBy: string) => {
  try {
    console.log('📋 Logging case created activity:', { caseId, caseTitle, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'case_created',
        description: `Case "${caseTitle}" was created`,
        performed_by: performedBy
      });

    if (error) {
      console.error('📋 Error logging case created activity:', error);
      throw error;
    }

    console.log('📋 Case created activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logCaseCreated:', error);
  }
};

export const logCaseUpdated = async (caseId: string, changes: Record<string, { old: any, new: any }>, performedBy?: string) => {
  try {
    console.log('📋 Logging case updated activity:', { caseId, changes, performedBy });
    
    // Get current user if not provided
    const userId = performedBy || await getCurrentInternalUserId();
    if (!userId) {
      console.error('📋 No user ID available for logging case update');
      return;
    }
    
    // Create descriptions for each change
    const descriptions = Object.entries(changes).map(([field, change]) => {
      switch (field) {
        case 'title':
          return `Title changed from "${change.old}" to "${change.new}"`;
        case 'description':
          return `Description updated`;
        case 'category_id':
          return `Category changed`;
        default:
          return `${field} changed from "${change.old}" to "${change.new}"`;
      }
    });

    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'case_updated',
        description: descriptions.join(', '),
        performed_by: userId
      });

    if (error) {
      console.error('📋 Error logging case updated activity:', error);
      throw error;
    }

    console.log('📋 Case updated activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logCaseUpdated:', error);
  }
};

export const logCaseAssigned = async (caseId: string, assigneeName: string, performedBy?: string) => {
  try {
    console.log('📋 Logging case assigned activity:', { caseId, assigneeName, performedBy });
    
    // Get current user if not provided
    const userId = performedBy || await getCurrentInternalUserId();
    if (!userId) {
      console.error('📋 No user ID available for logging case assignment');
      return;
    }
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'case_assigned',
        description: `Case assigned to ${assigneeName}`,
        performed_by: userId
      });

    if (error) {
      console.error('📋 Error logging case assigned activity:', error);
      throw error;
    }

    // Get case title for notification
    const { data: caseData } = await supabase
      .from('cases')
      .select('title')
      .eq('id', caseId)
      .single();

    // Notify external user of assignment
    if (caseData) {
      await notifyExternalUserOfCaseUpdate(caseId, caseData.title, 'status_change', 'assigned');
    }

    console.log('📋 Case assigned activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logCaseAssigned:', error);
  }
};

export const logCaseUnassigned = async (caseId: string, performedBy?: string) => {
  try {
    console.log('📋 Logging case unassigned activity:', { caseId, performedBy });
    
    // Get current user if not provided
    const userId = performedBy || await getCurrentInternalUserId();
    if (!userId) {
      console.error('📋 No user ID available for logging case unassignment');
      return;
    }
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'case_unassigned',
        description: 'Case unassigned',
        performed_by: userId
      });

    if (error) {
      console.error('📋 Error logging case unassigned activity:', error);
      throw error;
    }

    console.log('📋 Case unassigned activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logCaseUnassigned:', error);
  }
};

export const logStatusChanged = async (caseId: string, oldStatus: string, newStatus: string, performedBy?: string) => {
  try {
    console.log('📋 Logging status changed activity:', { caseId, oldStatus, newStatus, performedBy });
    
    // Get current user if not provided
    const userId = performedBy || await getCurrentInternalUserId();
    if (!userId) {
      console.error('📋 No user ID available for logging status change');
      return;
    }
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'status_changed',
        description: `Status changed from "${oldStatus}" to "${newStatus}"`,
        performed_by: userId
      });

    if (error) {
      console.error('📋 Error logging status changed activity:', error);
      throw error;
    }

    // Get case title for notification
    const { data: caseData } = await supabase
      .from('cases')
      .select('title')
      .eq('id', caseId)
      .single();

    // Notify external user of status change - handle both closed and resolved
    if (caseData) {
      const updateType = (newStatus === 'closed' || newStatus === 'resolved') ? 'case_closed' : 'status_change';
      await notifyExternalUserOfCaseUpdate(caseId, caseData.title, updateType, newStatus);
    }

    console.log('📋 Status changed activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logStatusChanged:', error);
  }
};

export const logPriorityChanged = async (caseId: string, oldPriority: string, newPriority: string, performedBy?: string) => {
  try {
    console.log('📋 Logging priority changed activity:', { caseId, oldPriority, newPriority, performedBy });
    
    // Get current user if not provided
    const userId = performedBy || await getCurrentInternalUserId();
    if (!userId) {
      console.error('📋 No user ID available for logging priority change');
      return;
    }
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'priority_changed',
        description: `Priority changed from "${oldPriority}" to "${newPriority}"`,
        performed_by: userId
      });

    if (error) {
      console.error('📋 Error logging priority changed activity:', error);
      throw error;
    }

    console.log('📋 Priority changed activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logPriorityChanged:', error);
  }
};

export const logMessageAdded = async (caseId: string, message: string, isInternal: boolean, performedBy?: string) => {
  try {
    console.log('📋 Logging message added activity:', { caseId, message: message.substring(0, 50) + '...', isInternal, performedBy });
    
    // Get current user if not provided
    const userId = performedBy || await getCurrentInternalUserId();
    if (!userId) {
      console.error('📋 No user ID available for logging message');
      return;
    }
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'message_added',
        description: `${isInternal ? 'Internal message' : 'Message'} added: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        performed_by: userId
      });

    if (error) {
      console.error('📋 Error logging message added activity:', error);
      throw error;
    }

    // If it's not an internal message, notify external user
    if (!isInternal) {
      const { data: caseData } = await supabase
        .from('cases')
        .select('title')
        .eq('id', caseId)
        .single();

      if (caseData) {
        await notifyExternalUserOfCaseUpdate(caseId, caseData.title, 'message_added', undefined, message);
      }
    }

    console.log('📋 Message added activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logMessageAdded:', error);
  }
};

export const logInternalNoteAdded = async (caseId: string, note: string, performedBy: string) => {
  try {
    console.log('📋 Logging internal note added activity:', { caseId, note: note.substring(0, 50) + '...', performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'internal_note_added',
        description: `Internal note added: ${note.substring(0, 100)}${note.length > 100 ? '...' : ''}`,
        performed_by: performedBy
      });

    if (error) {
      console.error('📋 Error logging internal note added activity:', error);
      throw error;
    }

    console.log('📋 Internal note added activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logInternalNoteAdded:', error);
  }
};

export const logTaskCreated = async (caseId: string, taskName: string, assignedTo: string | null, performedBy: string) => {
  try {
    console.log('📋 Logging task created activity:', { caseId, taskName, assignedTo, performedBy });
    
    const description = assignedTo 
      ? `Task "${taskName}" created and assigned to user`
      : `Task "${taskName}" created`;

    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'task_created',
        description: description,
        performed_by: performedBy
      });

    if (error) {
      console.error('📋 Error logging task created activity:', error);
      throw error;
    }

    console.log('📋 Task created activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logTaskCreated:', error);
  }
};

export const logTaskCompleted = async (caseId: string, taskName: string, performedBy: string) => {
  try {
    console.log('📋 Logging task completed activity:', { caseId, taskName, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'task_completed',
        description: `Task "${taskName}" completed`,
        performed_by: performedBy
      });

    if (error) {
      console.error('📋 Error logging task completed activity:', error);
      throw error;
    }

    console.log('📋 Task completed activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logTaskCompleted:', error);
  }
};

export const logAttachmentAdded = async (caseId: string, fileName: string, performedBy: string) => {
  try {
    console.log('📋 Logging attachment added activity:', { caseId, fileName, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'attachment_added',
        description: `Attachment "${fileName}" added`,
        performed_by: performedBy
      });

    if (error) {
      console.error('📋 Error logging attachment added activity:', error);
      throw error;
    }

    console.log('📋 Attachment added activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logAttachmentAdded:', error);
  }
};

export const logWatcherAdded = async (caseId: string, watcherName: string, performedBy: string) => {
  try {
    console.log('👁️ Logging watcher added activity:', { caseId, watcherName, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'watcher_added',
        description: `${watcherName} was added as a watcher`,
        performed_by: performedBy
      });

    if (error) {
      console.error('👁️ Error logging watcher added activity:', error);
      throw error;
    }

    console.log('👁️ Watcher added activity logged successfully');
  } catch (error) {
    console.error('👁️ Exception in logWatcherAdded:', error);
  }
};

export const logWatcherRemoved = async (caseId: string, watcherName: string, performedBy: string) => {
  try {
    console.log('👁️ Logging watcher removed activity:', { caseId, watcherName, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'watcher_removed',
        description: `${watcherName} was removed as a watcher`,
        performed_by: performedBy
      });

    if (error) {
      console.error('👁️ Error logging watcher removed activity:', error);
      throw error;
    }

    console.log('👁️ Watcher removed activity logged successfully');
  } catch (error) {
    console.error('👁️ Exception in logWatcherRemoved:', error);
  }
};

export const logTaskUpdated = async (caseId: string, taskName: string, changes: Record<string, any>, performedBy: string) => {
  try {
    console.log('✅ Logging task updated activity:', { caseId, taskName, changes, performedBy });
    
    // Create descriptions for each change
    const descriptions = Object.entries(changes).map(([field, value]) => {
      switch (field) {
        case 'status':
          return `Status changed to "${value}"`;
        case 'assigned_to':
          return value ? `Assigned to user` : `Unassigned`;
        case 'due_date':
          return value ? `Due date set to ${value}` : `Due date removed`;
        case 'task_name':
          return `Name changed to "${value}"`;
        default:
          return `${field} updated`;
      }
    });

    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'task_updated',
        description: `Task "${taskName}" updated: ${descriptions.join(', ')}`,
        performed_by: performedBy
      });

    if (error) {
      console.error('✅ Error logging task updated activity:', error);
      throw error;
    }

    console.log('✅ Task updated activity logged successfully');
  } catch (error) {
    console.error('✅ Exception in logTaskUpdated:', error);
  }
};

export const logTaskDeleted = async (caseId: string, taskName: string, performedBy: string) => {
  try {
    console.log('✅ Logging task deleted activity:', { caseId, taskName, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'task_deleted',
        description: `Task "${taskName}" was deleted`,
        performed_by: performedBy
      });

    if (error) {
      console.error('✅ Error logging task deleted activity:', error);
      throw error;
    }

    console.log('✅ Task deleted activity logged successfully');
  } catch (error) {
    console.error('✅ Exception in logTaskDeleted:', error);
  }
};

export const logCaseNoteAdded = async (caseId: string, note: string, performedBy: string) => {
  try {
    console.log('📝 Logging case note added activity:', { caseId, note: note.substring(0, 50) + '...', performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'case_note_added',
        description: `Case note added: ${note.substring(0, 100)}${note.length > 100 ? '...' : ''}`,
        performed_by: performedBy
      });

    if (error) {
      console.error('📝 Error logging case note added activity:', error);
      throw error;
    }

    console.log('📝 Case note added activity logged successfully');
  } catch (error) {
    console.error('📝 Exception in logCaseNoteAdded:', error);
  }
};

export const logCaseNoteUpdated = async (caseId: string, note: string, performedBy: string) => {
  try {
    console.log('📝 Logging case note updated activity:', { caseId, note: note.substring(0, 50) + '...', performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'case_note_updated',
        description: `Case note updated: ${note.substring(0, 100)}${note.length > 100 ? '...' : ''}`,
        performed_by: performedBy
      });

    if (error) {
      console.error('📝 Error logging case note updated activity:', error);
      throw error;
    }

    console.log('📝 Case note updated activity logged successfully');
  } catch (error) {
    console.error('📝 Exception in logCaseNoteUpdated:', error);
  }
};

export const logCaseNoteDeleted = async (caseId: string, note: string, performedBy: string) => {
  try {
    console.log('📝 Logging case note deleted activity:', { caseId, note: note.substring(0, 50) + '...', performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'case_note_deleted',
        description: `Case note deleted: ${note.substring(0, 100)}${note.length > 100 ? '...' : ''}`,
        performed_by: performedBy
      });

    if (error) {
      console.error('📝 Error logging case note deleted activity:', error);
      throw error;
    }

    console.log('📝 Case note deleted activity logged successfully');
  } catch (error) {
    console.error('📝 Exception in logCaseNoteDeleted:', error);
  }
};
