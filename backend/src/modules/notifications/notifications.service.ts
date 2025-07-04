import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private supabaseService: SupabaseService) {}

  async getNotificationsForUser(userId: string) {
    try {
      this.logger.log(`Fetching notifications for user: ${userId}`);
      
      const supabase = this.supabaseService.setAuthContext(userId);
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          message,
          notification_type,
          is_read,
          case_id,
          user_id,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Error fetching notifications:', error);
        throw error;
      }

      this.logger.log(`Fetched ${data?.length || 0} notifications for user ${userId}`);
      return data || [];
    } catch (error) {
      this.logger.error('Exception fetching notifications:', error);
      throw error;
    }
  }

  async createNotification(createNotificationDto: CreateNotificationDto) {
    try {
      this.logger.log('Creating notification:', createNotificationDto);
      
      const supabase = this.supabaseService.getClient();
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: createNotificationDto.userId,
          title: createNotificationDto.title,
          message: createNotificationDto.message,
          notification_type: createNotificationDto.type || NotificationType.GENERAL,
          case_id: createNotificationDto.caseId || null,
          is_read: false
        })
        .select('*')
        .single();
        
      if (error) {
        this.logger.error('Error creating notification:', error);
        throw error;
      }
      
      this.logger.log('Notification created successfully:', data);
      return data;
    } catch (error) {
      this.logger.error('Exception creating notification:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      this.logger.log(`Marking notification ${notificationId} as read for user ${userId}`);
      
      const supabase = this.supabaseService.setAuthContext(userId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId); // Ensure user can only update their own notifications
        
      if (error) {
        this.logger.error('Error marking notification as read:', error);
        throw error;
      }
      
      this.logger.log('Notification marked as read successfully');
      return { success: true };
    } catch (error) {
      this.logger.error('Exception marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      this.logger.log(`Marking all notifications as read for user ${userId}`);
      
      const supabase = this.supabaseService.setAuthContext(userId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);
        
      if (error) {
        this.logger.error('Error marking all notifications as read:', error);
        throw error;
      }
      
      this.logger.log('All notifications marked as read successfully');
      return { success: true };
    } catch (error) {
      this.logger.error('Exception marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string, userId: string) {
    try {
      this.logger.log(`Deleting notification ${notificationId} for user ${userId}`);
      
      const supabase = this.supabaseService.setAuthContext(userId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId); // Ensure user can only delete their own notifications
        
      if (error) {
        this.logger.error('Error deleting notification:', error);
        throw error;
      }
      
      this.logger.log('Notification deleted successfully');
      return { success: true };
    } catch (error) {
      this.logger.error('Exception deleting notification:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const supabase = this.supabaseService.setAuthContext(userId);
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        this.logger.error('Error getting unread count:', error);
        throw error;
      }

      return { count: count || 0 };
    } catch (error) {
      this.logger.error('Exception getting unread count:', error);
      throw error;
    }
  }

  // Business logic methods for different notification types
  async createTaskAssignmentNotification(
    assignedUserId: string,
    taskName: string,
    caseId: string,
    createdByUserId: string
  ) {
    // Get creator name
    const supabase = this.supabaseService.getClient();
    const { data: creatorData } = await supabase
      .from('users')
      .select('name')
      .eq('id', createdByUserId)
      .single();

    const creatorName = creatorData?.name || 'A colleague';
    const message = `${creatorName} assigned you a new task: "${taskName}"`;

    return this.createNotification({
      userId: assignedUserId,
      title: 'New Task Assigned',
      message: message,
      type: NotificationType.TASK_ASSIGNMENT,
      caseId: caseId
    });
  }

  async createCaseAssignmentNotification(
    assignedUserId: string,
    caseTitle: string,
    caseId: string,
    createdByUserId: string
  ) {
    const message = `You have been assigned a new case: "${caseTitle}"`;

    return this.createNotification({
      userId: assignedUserId,
      title: 'New Case Assigned',
      message: message,
      type: NotificationType.CASE_ASSIGNMENT,
      caseId: caseId
    });
  }

  async createWatcherAddedNotification(
    userId: string,
    caseTitle: string,
    caseId: string
  ) {
    const message = `You have been added as a watcher to case: ${caseTitle}`;

    return this.createNotification({
      userId: userId,
      title: 'Added as Watcher',
      message: message,
      type: NotificationType.WATCHER_ADDED,
      caseId: caseId
    });
  }

  async notifyRelevantUsers(
    caseId: string,
    activityType: string,
    message: string,
    performedBy: string,
    excludeUserId?: string
  ) {
    try {
      this.logger.log('Creating activity notifications for case:', caseId, 'activity:', activityType);

      const supabase = this.supabaseService.getClient();

      // Get case data and related users
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select(`
          id,
          title,
          submitted_by,
          assigned_to,
          users!cases_submitted_by_fkey(id, name, user_type),
          assigned_user:users!cases_assigned_to_fkey(id, name, user_type)
        `)
        .eq('id', caseId)
        .single();

      if (caseError || !caseData) {
        this.logger.error('Error fetching case data:', caseError);
        return;
      }

      // Get watchers, task users, etc.
      const { data: watchers } = await supabase
        .from('case_watchers')
        .select(`
          user_id,
          users!case_watchers_user_id_fkey(id, name, user_type)
        `)
        .eq('case_id', caseId);

      const { data: taskUsers } = await supabase
        .from('case_tasks')
        .select(`
          assigned_to,
          users!case_tasks_assigned_to_fkey(id, name, user_type)
        `)
        .eq('case_id', caseId)
        .not('assigned_to', 'is', null);

      // Collect relevant users (internal only)
      const relevantUsers = new Set<string>();

      // Add case submitter (if internal)
      if (caseData.users?.user_type === 'internal' && caseData.submitted_by !== excludeUserId) {
        relevantUsers.add(caseData.submitted_by);
      }

      // Add assigned user
      if (caseData.assigned_to && caseData.assigned_to !== excludeUserId) {
        relevantUsers.add(caseData.assigned_to);
      }

      // Add watchers (internal only)
      watchers?.forEach(watcher => {
        if (watcher.users?.user_type === 'internal' && watcher.user_id !== excludeUserId) {
          relevantUsers.add(watcher.user_id);
        }
      });

      // Add task assignees (internal only)
      taskUsers?.forEach(taskUser => {
        if (taskUser.users?.user_type === 'internal' && taskUser.assigned_to !== excludeUserId) {
          relevantUsers.add(taskUser.assigned_to);
        }
      });

      // Create notifications for all relevant users
      const notificationPromises = Array.from(relevantUsers).map(userId =>
        this.createNotification({
          userId,
          title: this.getNotificationTitle(activityType),
          message: `${message} on case "${caseData.title}"`,
          type: this.getNotificationType(activityType),
          caseId
        })
      );

      await Promise.all(notificationPromises);
      this.logger.log('Activity notifications created for', relevantUsers.size, 'users');

    } catch (error) {
      this.logger.error('Error creating activity notifications:', error);
    }
  }

  private getNotificationTitle(activityType: string): string {
    switch (activityType) {
      case 'message_added':
        return 'New Message';
      case 'task_created':
        return 'New Task Created';
      case 'task_completed':
        return 'Task Completed';
      case 'status_changed':
        return 'Case Status Updated';
      case 'case_assigned':
        return 'Case Assignment Changed';
      case 'attachment_added':
        return 'New Attachment';
      case 'case_note_added':
        return 'New Note Added';
      case 'watcher_added':
        return 'New Watcher Added';
      default:
        return 'Case Activity';
    }
  }

  private getNotificationType(activityType: string): NotificationType {
    switch (activityType) {
      case 'message_added':
        return NotificationType.NEW_MESSAGE;
      case 'task_created':
      case 'task_completed':
        return NotificationType.TASK_UPDATE;
      case 'status_changed':
        return NotificationType.CASE_STATUS_CHANGE;
      case 'case_assigned':
        return NotificationType.CASE_ASSIGNMENT;
      case 'attachment_added':
        return NotificationType.ATTACHMENT;
      case 'case_note_added':
        return NotificationType.NOTE;
      case 'watcher_added':
        return NotificationType.WATCHER_ADDED;
      default:
        return NotificationType.CASE_UPDATE;
    }
  }
}