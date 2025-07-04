import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private supabaseService: SupabaseService) {}

  async checkPermission(
    authUserId: string,
    elementKey: string, 
    permissionType: 'view' | 'edit' = 'view'
  ): Promise<boolean> {
    try {
      this.logger.log(`Checking permission for element: ${elementKey} (${permissionType})`);
      
      const supabase = this.supabaseService.getClient();

      // Get current user info
      const { data: userInfo, error: userError } = await supabase.rpc('get_current_user_info');
      if (userError) {
        this.logger.error('Error getting user info:', userError);
        return false;
      }
      
      const currentUser = userInfo?.[0];
      if (!currentUser) {
        this.logger.error('No user found');
        return false;
      }
      
      this.logger.log('Current user info:', currentUser);

      // For admin users, allow access to everything
      if (currentUser.is_admin || currentUser.is_super_admin) {
        this.logger.log(`Admin user - allowing access to ${elementKey}`);
        return true;
      }

      // For caseworker users, allow access to core functionality
      if (currentUser.is_case_worker || currentUser.role_name === 'caseworker') {
        const allowedElements = [
          'dashboard',
          'dashboards',
          'cases',
          'cases.create_case',
          'cases.edit_case',
          'cases.assign_case',
          'cases.view_details',
          'cases.case_detail',
          'notifications',
          'notifications.mark_read',
          'reports',
          'reports.create_report',
          'reports.edit_report',
          'reports.view_report',
          'reports.delete_report',
          'reports.report_builder',
          'knowledge',
          'insights'
        ];
        
        if (allowedElements.includes(elementKey)) {
          this.logger.log(`Caseworker accessing allowed element ${elementKey} - permitting`);
          return true;
        }
      }

      // For citizen users, allow access to citizen-specific features
      if (currentUser.is_citizen) {
        if (elementKey.startsWith('citizen')) {
          this.logger.log(`Citizen accessing citizen element ${elementKey} - permitting`);
          return true;
        }
      }

      // Use the backend function to check permissions as fallback
      const { data, error } = await supabase
        .rpc('current_user_has_frontend_permission', {
          p_element_key: elementKey,
          p_permission_type: permissionType
        });

      if (error) {
        this.logger.error(`RPC error for ${elementKey}:`, error);
        return false;
      }

      this.logger.log(`Backend permission result for ${elementKey} (${permissionType}):`, data);
      return data as boolean;
    } catch (err) {
      this.logger.error(`Exception checking permission for ${elementKey}:`, err);
      return false;
    }
  }

  async bulkCheckPermissions(
    authUserId: string,
    permissions: Array<{ elementKey: string; permissionType: 'view' | 'edit' }>
  ): Promise<Record<string, boolean>> {
    this.logger.log(`Bulk checking permissions for ${permissions.length} elements`);
    
    const results: Record<string, boolean> = {};
    
    try {
      // Check each permission
      for (const perm of permissions) {
        try {
          const hasPermission = await this.checkPermission(
            authUserId,
            perm.elementKey,
            perm.permissionType
          );
          
          results[`${perm.elementKey}.${perm.permissionType}`] = hasPermission;
        } catch (err) {
          this.logger.error(`Exception for ${perm.elementKey}:`, err);
          results[`${perm.elementKey}.${perm.permissionType}`] = false;
        }
      }

      this.logger.log('Bulk permission results:', results);
      return results;
    } catch (err) {
      this.logger.error('Exception during bulk check:', err);
      throw err;
    }
  }
}