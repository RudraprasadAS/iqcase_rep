
import { supabase } from '@/integrations/supabase/client';
import { notifyExternalUserOfCaseUpdate } from './externalNotificationUtils';

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

export const logCaseUpdated = async (caseId: string, changes: Record<string, { old: any, new: any }>, performedBy: string) => {
  try {
    console.log('📋 Logging case updated activity:', { caseId, changes, performedBy });
    
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
        performed_by: performedBy
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

export const logCaseAssigned = async (caseId: string, assigneeName: string, performedBy: string) => {
  try {
    console.log('📋 Logging case assigned activity:', { caseId, assigneeName, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'case_assigned',
        description: `Case assigned to ${assigneeName}`,
        performed_by: performedBy
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

export const logCaseUnassigned = async (caseId: string, performedBy: string) => {
  try {
    console.log('📋 Logging case unassigned activity:', { caseId, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'case_unassigned',
        description: 'Case unassigned',
        performed_by: performedBy
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

export const logStatusChanged = async (caseId: string, oldStatus: string, newStatus: string, performedBy: string) => {
  try {
    console.log('📋 Logging status changed activity:', { caseId, oldStatus, newStatus, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'status_changed',
        description: `Status changed from "${oldStatus}" to "${newStatus}"`,
        performed_by: performedBy
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

    // Notify external user of status change
    if (caseData) {
      const updateType = newStatus === 'closed' ? 'case_closed' : 'status_change';
      await notifyExternalUserOfCaseUpdate(caseId, caseData.title, updateType, newStatus);
    }

    console.log('📋 Status changed activity logged successfully');
  } catch (error) {
    console.error('📋 Exception in logStatusChanged:', error);
  }
};

export const logPriorityChanged = async (caseId: string, oldPriority: string, newPriority: string, performedBy: string) => {
  try {
    console.log('📋 Logging priority changed activity:', { caseId, oldPriority, newPriority, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'priority_changed',
        description: `Priority changed from "${oldPriority}" to "${newPriority}"`,
        performed_by: performedBy
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

export const logMessageAdded = async (caseId: string, message: string, isInternal: boolean, performedBy: string) => {
  try {
    console.log('📋 Logging message added activity:', { caseId, message: message.substring(0, 50) + '...', isInternal, performedBy });
    
    const { error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        activity_type: 'message_added',
        description: `${isInternal ? 'Internal message' : 'Message'} added: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        performed_by: performedBy
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
