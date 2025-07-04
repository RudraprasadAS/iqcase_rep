import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  GENERAL = 'general',
  CASE_UPDATE = 'case_update', 
  CASE_ASSIGNMENT = 'case_assignment',
  CASE_STATUS_CHANGE = 'case_status_change',
  TASK_ASSIGNMENT = 'task_assignment',
  TASK_UPDATE = 'task_update',
  NEW_MESSAGE = 'new_message',
  ATTACHMENT = 'attachment',
  NOTE = 'note',
  WATCHER_ADDED = 'watcher_added',
  MENTION = 'mention',
  SYSTEM = 'system',
  REPORT = 'report',
}

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ enum: NotificationType, required: false })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  caseId?: string;
}