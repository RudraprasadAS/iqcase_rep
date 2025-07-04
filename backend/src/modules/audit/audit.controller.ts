import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Post('case-activity')
  @ApiOperation({ summary: 'Log case activity' })
  async logCaseActivity(
    @Body() data: {
      caseId: string;
      activityType: string;
      description: string;
      performedBy: string;
      actorId?: string;
      metadata?: any;
    }
  ) {
    return this.auditService.logCaseActivity(
      data.caseId,
      data.activityType,
      data.description,
      data.performedBy,
      data.actorId,
      data.metadata
    );
  }

  @Post('case-created')
  @ApiOperation({ summary: 'Log case creation' })
  async logCaseCreated(
    @Body() data: { caseId: string; caseTitle: string; performedBy: string }
  ) {
    return this.auditService.logCaseCreated(data.caseId, data.caseTitle, data.performedBy);
  }

  @Post('message-added')
  @ApiOperation({ summary: 'Log message addition' })
  async logMessageAdded(
    @Body() data: { 
      caseId: string; 
      message: string; 
      isInternal: boolean; 
      performedBy: string 
    }
  ) {
    return this.auditService.logMessageAdded(
      data.caseId, 
      data.message, 
      data.isInternal, 
      data.performedBy
    );
  }

  @Post('task-created')
  @ApiOperation({ summary: 'Log task creation' })
  async logTaskCreated(
    @Body() data: { 
      caseId: string; 
      taskName: string; 
      assignedTo: string | null; 
      performedBy: string 
    }
  ) {
    return this.auditService.logTaskCreated(
      data.caseId, 
      data.taskName, 
      data.assignedTo, 
      data.performedBy
    );
  }
}