import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Body, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get('check')
  @ApiOperation({ summary: 'Check single permission' })
  @ApiQuery({ name: 'elementKey', required: true })
  @ApiQuery({ name: 'permissionType', required: false, enum: ['view', 'edit'] })
  async checkPermission(
    @Query('elementKey') elementKey: string,
    @Query('permissionType') permissionType: 'view' | 'edit' = 'view',
    @Request() req
  ) {
    const hasPermission = await this.permissionsService.checkPermission(
      req.user.authUserId,
      elementKey,
      permissionType
    );
    
    return { 
      elementKey, 
      permissionType, 
      hasPermission 
    };
  }

  @Post('bulk-check')
  @ApiOperation({ summary: 'Check multiple permissions at once' })
  async bulkCheckPermissions(
    @Body() permissions: Array<{ elementKey: string; permissionType: 'view' | 'edit' }>,
    @Request() req
  ) {
    const results = await this.permissionsService.bulkCheckPermissions(
      req.user.authUserId,
      permissions
    );
    
    return { results };
  }
}