import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const [
            totalUsers,
            candidates,
            recruiters,
            admins,
            activeJobs,
            draftJobs,
            closedJobs,
            totalApplications,
            applicationsToday,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
            this.prisma.user.count({ where: { role: 'RECRUITER' } }),
            this.prisma.user.count({ where: { role: 'ADMIN' } }),
            this.prisma.job.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.job.count({ where: { status: 'DRAFT' } }),
            this.prisma.job.count({ where: { status: 'CLOSED' } }),
            this.prisma.application.count(),
            this.prisma.application.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
        ]);

        return {
            users: { total: totalUsers, candidates, recruiters, admins },
            jobs: { active: activeJobs, draft: draftJobs, closed: closedJobs },
            applications: { total: totalApplications, today: applicationsToday },
        };
    }

    async getUsers(query: any) {
        const { page = 1, limit = 20, search = '', role } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    country: true,
                    isSuspended: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { users, total, page, totalPages: Math.ceil(total / limit) };
    }

    async toggleUserSuspension(id: string, isSuspended: boolean) {
        return this.prisma.user.update({
            where: { id },
            data: { isSuspended },
        });
    }

    async getEmployers(query: any) {
        const { page = 1, limit = 20, isVerified } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (isVerified !== undefined) where.isVerified = isVerified === 'true';

        const [employers, total] = await Promise.all([
            this.prisma.employer.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    members: {
                        include: { user: { select: { firstName: true, lastName: true, phone: true } } }
                    }
                }
            }),
            this.prisma.employer.count({ where }),
        ]);

        return { employers, total, page, totalPages: Math.ceil(total / limit) };
    }

    async verifyEmployer(id: string, isVerified: boolean) {
        return this.prisma.employer.update({
            where: { id },
            data: { isVerified },
        });
    }

    async getJobs(query: any) {
        const { page = 1, limit = 20, status } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;

        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    employer: { select: { name: true } },
                },
            }),
            this.prisma.job.count({ where }),
        ]);

        return { jobs, total, page, totalPages: Math.ceil(total / limit) };
    }

    async updateJobStatus(id: string, status: string) {
        return this.prisma.job.update({
            where: { id },
            data: { status },
        });
    }
}
