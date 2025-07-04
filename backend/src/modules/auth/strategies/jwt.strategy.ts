import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      console.log('🔐 JWT payload:', payload);
      
      // For Supabase JWT tokens, validate and get user info
      const userInfo = await this.authService.validateSupabaseToken(payload.sub);
      
      console.log('🔐 User validated:', userInfo);
      return userInfo;
    } catch (error) {
      console.error('🔐 JWT validation error:', error);
      throw new UnauthorizedException();
    }
  }
}