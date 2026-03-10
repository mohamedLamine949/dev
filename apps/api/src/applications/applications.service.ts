import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// --------------- DTOs ---------------
export interface ApplicationDocDto {
    category: string;   // e.g. 'CV', 'DIPLOME'
    documentId: string; // ID from candidate's document vault
}

export interface ApplyDto {
    coverLetter?: string;
    introMessage?: string;
    applicationDocs?: ApplicationDocDto[]; // documents submitted with application
}

export interface UpdateStatusDto {
    status: string; // SENT → REVIEWED → SHORTLISTED → INTERVIEW → ACCEPTED → REJECTED
}

export interface SendMessageDto {
    content: string;
    type?: string; // STANDARD | SUMMON | RESULT
    summonDate?: string;
    summonLocation?: string;
}

export interface ApplicationFilters {
    status?: string;
    page?: number;
    limit?: number;
}

// --------------- Service ---------------
@Injectable()
export class ApplicationsService {
    constructor(private prisma: PrismaService) { }

    /** Candidate applies to a job */
    async apply(userId: string, jobId: string, dto: ApplyDto) {
        // Check the job exists and is published
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: { requiredDocs: true },
        });
        if (!job) throw new NotFoundException('Offre introuvable');
        if (job.status !== 'PUBLISHED') throw new BadRequestException('Cette offre n\'est plus disponible');
        if (new Date(job.deadline) < new Date()) throw new BadRequestException('La date limite de candidature est dépassée');

        // Validate required documents
        const submittedDocs = dto.applicationDocs || [];
        const mandatoryDocs = job.requiredDocs.filter(rd => !rd.isOptional);
        for (const required of mandatoryDocs) {
            const provided = submittedDocs.find(d => d.category === required.documentCategory);
            if (!provided) {
                throw new BadRequestException(`Document manquant: ${required.label}`);
            }
        }

        // Check submitted document IDs belong to the user
        if (submittedDocs.length > 0) {
            const docIds = submittedDocs.map(d => d.documentId);
            const userDocs = await this.prisma.document.findMany({
                where: { id: { in: docIds }, userId },
            });
            if (userDocs.length !== docIds.length) {
                throw new BadRequestException('Un ou plusieurs documents sont invalides');
            }
        }

        // Check not already applied
        const existing = await this.prisma.application.findUnique({
            where: { jobId_userId: { jobId, userId } },
        });
        if (existing) throw new ConflictException('Vous avez déjà postulé à cette offre');

        // Create the application
        const application = await this.prisma.application.create({
            data: {
                jobId,
                userId,
                coverLetter: dto.coverLetter,
                introMessage: dto.introMessage,
                status: 'SENT',
            },
            include: { job: { select: { title: true, employer: { select: { name: true } } } } },
        });

        // Save application documents (snapshots)
        if (submittedDocs.length > 0) {
            const userDocMap = await this.prisma.document.findMany({
                where: { id: { in: submittedDocs.map(d => d.documentId) }, userId },
            });
            await this.prisma.applicationDoc.createMany({
                data: userDocMap.map(doc => ({
                    applicationId: application.id,
                    documentId: doc.id,
                    s3KeySnapshot: doc.s3Key,
                })),
            });
        }

        // Increment job application count
        await this.prisma.job.update({ where: { id: jobId }, data: { applicationCount: { increment: 1 } } });

        return application;
    }

    /** Get all applications for the current candidate */
    async getMyApplications(userId: string, filters: ApplicationFilters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const where: any = { userId };
        if (filters.status) where.status = filters.status;

        const [applications, total] = await Promise.all([
            this.prisma.application.findMany({
                where,
                include: {
                    job: {
                        select: {
                            id: true, title: true, type: true, sector: true, regions: true,
                            deadline: true, status: true,
                            employer: { select: { name: true, isVerified: true } },
                        },
                    },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.application.count({ where }),
        ]);

        return { applications, total, page, totalPages: Math.ceil(total / limit) };
    }

    /** Recruiter: get all applications for a specific job */
    async getJobApplications(userId: string, jobId: string, filters: ApplicationFilters) {
        // Verify the recruiter owns this job
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: { employer: { include: { members: true } } },
        });
        if (!job) throw new NotFoundException('Offre introuvable');

        const isMember = job.employer.members.some((m: any) => m.userId === userId);
        if (!isMember) throw new ForbiddenException('Vous n\'êtes pas autorisé à voir les candidatures pour cette offre');

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const where: any = { jobId };
        if (filters.status) where.status = filters.status;

        const [applications, total] = await Promise.all([
            this.prisma.application.findMany({
                where,
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, country: true } },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.application.count({ where }),
        ]);

        return { applications, total, page, totalPages: Math.ceil(total / limit), job: { id: job.id, title: job.title } };
    }

    /** Recruiter: update application status */
    async updateStatus(userId: string, applicationId: string, dto: UpdateStatusDto) {
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: { job: { include: { employer: { include: { members: true } } } } },
        });
        if (!application) throw new NotFoundException('Candidature introuvable');

        const isMember = application.job.employer.members.some((m: any) => m.userId === userId);
        if (!isMember) throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier cette candidature');

        const validStatuses = ['SENT', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];
        if (!validStatuses.includes(dto.status)) {
            throw new BadRequestException(`Statut invalide. Valeurs acceptées : ${validStatuses.join(', ')}`);
        }

        return this.prisma.application.update({
            where: { id: applicationId },
            data: { status: dto.status },
        });
    }

    /** Get messages for an application (both candidate and recruiter) */
    async getMessages(userId: string, applicationId: string) {
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: { job: { include: { employer: { include: { members: true } } } } },
        });
        if (!application) throw new NotFoundException('Candidature introuvable');

        // Verify access: candidate or recruiter
        const isCandidate = application.userId === userId;
        const isRecruiter = application.job.employer.members.some((m: any) => m.userId === userId);
        if (!isCandidate && !isRecruiter) throw new ForbiddenException('Accès non autorisé');

        // Mark unread messages as read
        await this.prisma.message.updateMany({
            where: { applicationId, isRead: false, NOT: { senderId: userId } },
            data: { isRead: true },
        });

        return this.prisma.message.findMany({
            where: { applicationId },
            include: { sender: { select: { firstName: true, lastName: true, role: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    /** Send a message in an application thread */
    async sendMessage(userId: string, applicationId: string, dto: SendMessageDto) {
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: { job: { include: { employer: { include: { members: true } } } } },
        });
        if (!application) throw new NotFoundException('Candidature introuvable');

        const isCandidate = application.userId === userId;
        const isRecruiter = application.job.employer.members.some((m: any) => m.userId === userId);
        if (!isCandidate && !isRecruiter) throw new ForbiddenException('Accès non autorisé');

        return this.prisma.message.create({
            data: {
                applicationId,
                senderId: userId,
                content: dto.content,
                type: dto.type || 'STANDARD',
                summonDate: dto.summonDate ? new Date(dto.summonDate) : null,
                summonLocation: dto.summonLocation,
            },
            include: { sender: { select: { firstName: true, lastName: true, role: true } } },
        });
    }

    /** Get a single application detail */
    async getApplicationDetail(userId: string, applicationId: string) {
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                job: {
                    select: { id: true, title: true, type: true, sector: true, deadline: true, employer: { select: { name: true } } },
                },
                user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, country: true } },
                messages: {
                    include: { sender: { select: { firstName: true, lastName: true, role: true } } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!application) throw new NotFoundException('Candidature introuvable');

        // Verify access
        const isCandidate = application.userId === userId;
        // For recruiter check, we need to load employer members
        const job = await this.prisma.job.findUnique({
            where: { id: application.jobId },
            include: { employer: { include: { members: true } } },
        });
        const isRecruiter = job?.employer.members.some((m: any) => m.userId === userId);
        if (!isCandidate && !isRecruiter) throw new ForbiddenException('Accès non autorisé');

        return application;
    }
}
