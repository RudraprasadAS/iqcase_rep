import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private supabaseService: SupabaseService,
  ) {}

  async validateSupabaseToken(token: string) {
    try {
      const supabase = this.supabaseService.getClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get internal user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          user_type,
          is_active,
          role_id,
          roles:role_id (
            id,
            name,
            role_type,
            is_system
          )
        `)
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: userData.id,
        authUserId: user.id,
        email: userData.email,
        name: userData.name,
        userType: userData.user_type,
        isActive: userData.is_active,
        role: userData.roles,
      };
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  async getCurrentUser(authUserId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase.rpc('get_current_user_info');
    
    if (error || !data || data.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    return data[0];
  }
}