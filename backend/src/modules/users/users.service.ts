import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private supabaseService: SupabaseService) {}

  async getCurrentUserInfo(authUserId: string) {
    try {
      const supabase = this.supabaseService.getClient();
      
      const { data, error } = await supabase.rpc('get_current_user_info');
      
      if (error || !data || data.length === 0) {
        this.logger.error('Error getting current user info:', error);
        throw new Error('User not found');
      }

      return data[0];
    } catch (error) {
      this.logger.error('Exception getting current user info:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const supabase = this.supabaseService.getClient();
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          user_type,
          is_active,
          created_at,
          last_login,
          roles:role_id (
            id,
            name,
            role_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Error fetching users:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Exception fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      const supabase = this.supabaseService.getClient();
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          user_type,
          is_active,
          created_at,
          last_login,
          roles:role_id (
            id,
            name,
            role_type
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        this.logger.error('Error fetching user:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Exception fetching user:', error);
      throw error;
    }
  }
}