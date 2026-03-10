import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        // In production we would use a proper secret key from env
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'malilink-super-secret-key-for-dev',
        });
    }

    async validate(payload: any) {
        return { sub: payload.sub, id: payload.sub, userId: payload.sub, phone: payload.phone, email: payload.email, role: payload.role };
    }
}
