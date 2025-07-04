import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private supabaseService: SupabaseService) {}

  async logCaseActivity(
    caseId: string,
    activityType: string,
    description: string,
    performedBy: string,
    actorId?: string,
    metadata?: any
  ) {
    try {
      this.logger.log('Logging case activity:', { caseId, activityType, description, performedBy });
      
      const supabase = this.supabaseService.getClient();
      
      const { error } = await supabase
        .from('case_activities')
        .insert({
          case_id: caseId,
          activity_type: activityType,
          description: description,
          performed_by: performedBy,
          actor_id: actorId,
          message: metadata?.message
        });

      if (error) {
        this.logger.error('Error logging case activity:', error);
        throw error;
      }

      this.logger.log('Case activity logged successfully');
    } catch (error) {
      this.logger.error('Exception in logCaseActivity:', error);
      throw error;
    }
  }

  async logCaseCreated(caseId: string, caseTitle: string, performedBy: string) {
    return this.logCaseActivity(
      caseId,
      'case_created',
      `Case "${caseTitle}" was created`,
      performedBy
    );
  }

  async logCaseUpdated(caseId: string, changes: Record<string, { old: any, new: any }>, performedBy: string) {
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

    return this.logCaseActivity(
      caseId,
      'case_updated',
      descriptions.join(', '),
      performedBy
    );
  }

  async logCaseAssigned(caseId: string, assigneeName: string, performedBy: string) {
    return this.logCaseActivity(
      caseId,
      'case_assigned',
      `Case assigned to ${assigneeName}`,
      performedBy
    );
  }

  async logStatusChanged(caseId: string, oldStatus: string, newStatus: string, performedBy: string) {
    return this.logCaseActivity(
      caseId,
      'status_changed',
      `Status changed from "${oldStatus}" to "${newStatus}"`,
      performedBy
    );
  }

  async logMessageAdded(caseId: string, message: string, isInternal: boolean, performedBy: string) {
    return this.logCaseActivity(
      caseId,
      'message_added',
      `${isInternal ? 'Internal message' : 'Message'} added: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      performedBy,
      undefined,
      { message }
    );
  }

  async logTaskCreated(caseId: string, taskName: string, assignedTo: string | null, performedBy: string) {
    const description = assignedTo 
      ? `Task "${taskName}" created and assigned to user`
      : `Task "${taskName}" created`;

    return this.logCaseActivity(
      caseId,
      'task_created',
      description,
      performedBy
    );
  }

  async logTaskCompleted(caseId: string, taskName: string, performedBy: string) {
    return this.logCaseActivity(
      caseId,
      'task_completed',
      `Task "${taskName}" completed`,
      performedBy
    );
  }

  async logAttachmentAdded(caseId: string, fileName: string, performedBy: string) {
    return this.logCaseActivity(
      caseId,
      'attachment_added',
      `Attachment "${fileName}" added`,
      performedBy
    );
  }

  async logWatcherAdded(caseId: string, watcherName: string, performedBy: string) {
    return this.logCaseActivity(
      caseId,
      'watcher_added',
      `${watcherName} was added as a watcher`,
      performedBy
    );
  }
}