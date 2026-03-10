import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface CreateUserDto {
    phone: string;         // Required — primary identifier in Mali
    password: string;
    firstName: string;
    lastName: string;
    country: string;
    email?: string;        // Optional at sign-up
    role?: string;
}

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findByPhone(phone: string) {
        return this.prisma.user.findUnique({ where: { phone } });
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    /** Find by phone OR email — used for flexible login */
    async findByPhoneOrEmail(identifier: string) {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { phone: identifier },
                    { email: identifier },
                ],
            },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async create(data: CreateUserDto) {
        // Check phone uniqueness (always required)
        const existingByPhone = await this.prisma.user.findUnique({
            where: { phone: data.phone },
        });
        if (existingByPhone) {
            throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
        }

        // Check email uniqueness only if provided
        if (data.email) {
            const existingByEmail = await this.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existingByEmail) {
                throw new ConflictException('Cet email est déjà utilisé');
            }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);

        return this.prisma.user.create({
            data: {
                phone: data.phone,
                email: data.email || null,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                country: data.country,
                role: data.role || 'CANDIDATE',
            },
        });
    }
}
