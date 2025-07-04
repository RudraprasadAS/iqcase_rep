import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post('case/:caseId')
  async createTask(@Param('caseId') caseId: string, @Body() taskData: any, @Request() req) {
    return await this.tasksService.createTask(caseId, taskData, req.user.internalUserId);
  }

  @Get('case/:caseId')
  async getTasks(@Param('caseId') caseId: string) {
    return await this.tasksService.getTasks(caseId);
  }

  @Put(':id')
  async updateTask(@Param('id') id: string, @Body() updates: any, @Request() req) {
    return await this.tasksService.updateTask(id, updates, req.user.internalUserId);
  }

  @Delete(':id')
  async deleteTask(@Param('id') id: string, @Request() req) {
    return await this.tasksService.deleteTask(id, req.user.internalUserId);
  }
}