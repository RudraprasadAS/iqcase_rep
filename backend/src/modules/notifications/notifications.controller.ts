import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  async getNotifications(@Request() req) {
    return this.notificationsService.getNotificationsForUser(req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  async getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async deleteNotification(@Param('id') id: string, @Request() req) {
    return this.notificationsService.deleteNotification(id, req.user.id);
  }

  @Post('task-assignment')
  @ApiOperation({ summary: 'Create task assignment notification' })
  async createTaskAssignmentNotification(
    @Body() data: { 
      assignedUserId: string; 
      taskName: string; 
      caseId: string; 
      createdByUserId: string 
    }
  ) {
    return this.notificationsService.createTaskAssignmentNotification(
      data.assignedUserId,
      data.taskName,
      data.caseId,
      data.createdByUserId
    );
  }

  @Post('case-assignment')
  @ApiOperation({ summary: 'Create case assignment notification' })
  async createCaseAssignmentNotification(
    @Body() data: { 
      assignedUserId: string; 
      caseTitle: string; 
      caseId: string; 
      createdByUserId: string 
    }
  ) {
    return this.notificationsService.createCaseAssignmentNotification(
      data.assignedUserId,
      data.caseTitle,
      data.caseId,
      data.createdByUserId
    );
  }

  @Post('watcher-added')
  @ApiOperation({ summary: 'Create watcher added notification' })
  async createWatcherAddedNotification(
    @Body() data: { 
      userId: string; 
      caseTitle: string; 
      caseId: string; 
    }
  ) {
    return this.notificationsService.createWatcherAddedNotification(
      data.userId,
      data.caseTitle,
      data.caseId
    );
  }

  @Post('activity-notification')
  @ApiOperation({ summary: 'Notify relevant users about case activity' })
  async notifyRelevantUsers(
    @Body() data: {
      caseId: string;
      activityType: string;
      message: string;
      performedBy: string;
      excludeUserId?: string;
    }
  ) {
    return this.notificationsService.notifyRelevantUsers(
      data.caseId,
      data.activityType,
      data.message,
      data.performedBy,
      data.excludeUserId
    );
  }
}