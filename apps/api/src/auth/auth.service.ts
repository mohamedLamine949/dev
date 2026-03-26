import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    /** Accepts phone number OR email as identifier */
    async validateUser(identifier: string, pass: string): Promise<any> {
        const user = await this.usersService.findByPhoneOrEmail(identifier);
        if (user && await bcrypt.compare(pass, user.passwordHash)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { sub: user.id, phone: user.phone, email: user.email, role: user.role };

        let employerStatus: string | null = null;
        if (user.role === 'RECRUITER') {
            const membership = await this.prisma.employerMember.findFirst({
                where: { userId: user.id },
                include: { employer: { select: { verificationStatus: true } } },
            });
            employerStatus = membership?.employer?.verificationStatus ?? null;
        }

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                phone: user.phone,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                employerStatus,
            },
        };
    }
}
