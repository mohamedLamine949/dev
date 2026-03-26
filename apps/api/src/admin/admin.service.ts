import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsService
    ) { }

    async getStats() {
        const todayAtMidnight = new Date(new Date().setHours(0, 0, 0, 0));
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
            diasporaCandidates,
            jobsBySector,
            employersByStatus,
            applicationsTimeline,
            profileScores
        ] = await Promise.all([
            // Basic User Metrics
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
            this.prisma.user.count({ where: { role: 'RECRUITER' } }),
            this.prisma.user.count({ where: { role: 'ADMIN' } }),

            // Job Metrics
            this.prisma.job.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.job.count({ where: { status: 'DRAFT' } }),
            this.prisma.job.count({ where: { status: 'CLOSED' } }),

            // Application Metrics
            this.prisma.application.count(),
            this.prisma.application.count({ where: { createdAt: { gte: todayAtMidnight } } }),

            // 🚨 NEW ADVANCED CRM METRICS 🚨

            // 1. Diaspora Candidates vs Local
            this.prisma.candidateProfile.count({ where: { isDiaspora: true } }),

            // 2. Jobs by Sector (Top 5+ Grouped)
            this.prisma.job.groupBy({
                by: ['sector'],
                _count: { _all: true },
                orderBy: { _count: { sector: 'desc' } }
            }),

            // 3. Employer Verification Statuses
            this.prisma.employer.groupBy({
                by: ['verificationStatus'],
                _count: { _all: true }
            }),

            // 4. Applications Timeline (Last 7 Days)
            this.prisma.$queryRaw<{ date: string, count: bigint }[]>`
                SELECT "createdAt"::date as date, COUNT(*) as count
                FROM "Application"
                WHERE "createdAt" >= ${sevenDaysAgo}
                GROUP BY "createdAt"::date
                ORDER BY date ASC
            `,

            // 5. Avg Profile Completion
            this.prisma.candidateProfile.aggregate({
                _avg: { completionScore: true }
            })
        ]);

        return {
            users: {
                total: totalUsers,
                candidates,
                recruiters,
                admins,
                diaspora: diasporaCandidates,
                local: candidates - diasporaCandidates
            },
            jobs: {
                active: activeJobs,
                draft: draftJobs,
                closed: closedJobs,
                bySector: jobsBySector.map(s => ({ name: s.sector, value: s._count._all }))
            },
            applications: {
                total: totalApplications,
                today: applicationsToday,
                timeline: applicationsTimeline.map(t => ({
                    date: typeof t.date === 'string' ? t.date : new Date(t.date).toISOString().split('T')[0],
                    count: Number(t.count)
                }))
            },
            employers: {
                byStatus: employersByStatus.map(s => ({ name: s.verificationStatus, value: s._count._all }))
            },
            completion: {
                averageScore: Math.round(profileScores._avg.completionScore || 0)
            }
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

    async getUserDetail(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                candidateProfile: {
                    include: {
                        experiences: { orderBy: { startDate: 'desc' } },
                        educations: { orderBy: { year: 'desc' } },
                        skills: true,
                    }
                },
                documents: { orderBy: { createdAt: 'desc' } },
                employerMembers: { include: { employer: true } },
            }
        });
    }

    async getEmployers(query: any) {
        const { page = 1, limit = 20, status, search = '' } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.verificationStatus = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { nif: { contains: search, mode: 'insensitive' } },
                { rccm: { contains: search, mode: 'insensitive' } },
            ];
        }

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

    async getEmployerDetail(id: string) {
        return this.prisma.employer.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                phone: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                avatarS3Key: true,
                            }
                        }
                    }
                },
                jobs: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }

    async verifyEmployer(id: string, status: string, note?: string) {
        if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
            throw new BadRequestException('Statut invalide. Utilisez PENDING, VERIFIED ou REJECTED.');
        }

        const employer = await this.prisma.employer.update({
            where: { id },
            data: {
                verificationStatus: status,
                isVerified: status === 'VERIFIED',
                verificationNote: note ?? null,
            },
            include: { members: true },
        });

        // -- Notify Employer Members --
        if (status === 'VERIFIED' || status === 'REJECTED') {
            const statusText = status === 'VERIFIED'
                ? 'Votre compte Entreprise a été vérifié avec succès ! 🎉 Vous pouvez désormais publier des offres.'
                : `Votre demande de vérification a été refusée. ${note ? 'Motif : ' + note : ''}`;

            for (const member of employer.members) {
                await this.notifications.create(
                    member.userId,
                    'VERIFICATION_UPDATE',
                    status === 'VERIFIED' ? 'Compte vérifié !' : 'Vérification refusée',
                    statusText,
                    '/dashboard/recruiter/employer'
                );
            }
        }

        return employer;
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

    async getJobDetail(id: string) {
        return this.prisma.job.findUnique({
            where: { id },
            include: {
                employer: true,
                requiredDocs: true,
                _count: {
                    select: { applications: true }
                }
            }
        });
    }
}
