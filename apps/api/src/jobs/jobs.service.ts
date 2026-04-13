import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AlertsService } from '../alerts/alerts.service';

export interface RequiredDocDto {
    documentCategory: string; // CV | PASSEPORT | DIPLOME | ...
    label: string;            // "Votre CV à jour"
    isOptional?: boolean;
}

export interface CreateJobDto {
    title: string;
    type: string;          // CDI | CDD | STAGE | CONCOURS | VOLONTARIAT | APPRENTISSAGE
    positions: number;
    sector: string;
    regions: string[];     // e.g. ['BAMAKO', 'KAYES']
    educationLevel: string[];
    experienceLevel: string; // NONE | 1_2 | 3_5 | PLUS_5
    description: string;
    requirements: string;
    requiredDocs?: RequiredDocDto[];  // documents required from candidates
    deadline: string;      // ISO date string
    salaryMin?: number;
    salaryMax?: number;
    isDiasporaOpen?: boolean;
    isRemoteAbroad?: boolean;
    relocationAid?: string;
    employerId?: string;   // set by controller from user context
}

export interface JobFilters {
    keyword?: string;
    sector?: string;
    type?: string;
    region?: string;
    educationLevel?: string;
    isDiaspora?: boolean;
    userId?: string;
    employerId?: string;
    page?: number;
    limit?: number;
}

@Injectable()
export class JobsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
        private readonly alertsService: AlertsService,
    ) { }

    async findAll(filters: JobFilters = {}) {
        const { keyword, sector, type, region, educationLevel, isDiaspora, userId, employerId, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const where: any = {
            status: 'PUBLISHED',
            deadline: { gte: new Date() },
        };

        if (employerId) {
            // When querying for a specific employer, we want to see all their jobs including drafts/expired potentially?
            // Usually yes, but for now we'll just filter by employerId and maybe remove the status/deadline constraints.
            // Let's modify the default where if employerId is provided.
            delete where.status;
            delete where.deadline;
            where.employerId = employerId;
        }

        if (keyword) {
            where.OR = [
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
                { sector: { contains: keyword, mode: 'insensitive' } },
                { externalCompany: { contains: keyword, mode: 'insensitive' } },
                { employer: { is: { name: { contains: keyword, mode: 'insensitive' } } } },
            ];
        }
        if (sector) where.sector = { equals: sector, mode: 'insensitive' };
        if (type) where.type = { equals: type, mode: 'insensitive' };
        if (region) where.regions = { contains: region, mode: 'insensitive' };
        if (educationLevel) where.educationLevel = { contains: educationLevel, mode: 'insensitive' };
        if (isDiaspora) where.isDiasporaOpen = true;
        
        // Hide jobs the user has already applied to
        if (userId) {
            where.applications = { none: { userId } };
        }

        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
                orderBy: { publishedAt: 'desc' },
                include: { employer: { select: { id: true, name: true, slug: true, logoS3Key: true, isVerified: true } } },
            }),
            this.prisma.job.count({ where }),
        ]);

        const savedJobIds = userId
            ? new Set(
                (await this.prisma.savedJob.findMany({
                    where: { userId, jobId: { in: jobs.map(job => job.id) } },
                    select: { jobId: true },
                })).map(saved => saved.jobId)
            )
            : null;

        const jobsWithSavedState = jobs.map(job => ({
            ...job,
            isSaved: savedJobIds ? savedJobIds.has(job.id) : false,
        }));

        return { jobs: jobsWithSavedState, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string, userId?: string) {
        const job = await this.prisma.job.findUnique({
            where: { id },
            include: {
                employer: { select: { id: true, name: true, slug: true, logoS3Key: true, isVerified: true, description: true } },
                requiredDocs: true,
            },
        });
        if (!job) throw new NotFoundException('Offre introuvable');

        let isSaved = false;
        if (userId) {
            const saved = await this.prisma.savedJob.findUnique({
                where: { userId_jobId: { userId, jobId: id } }
            });
            isSaved = !!saved;
        }

        return { ...job, isSaved };
    }

    async create(data: CreateJobDto, employerId: string) {
        if (!data.title || !data.type || !data.sector || !data.deadline) {
            throw new BadRequestException('Champs obligatoires manquants');
        }
        const deadline = new Date(data.deadline);
        if (deadline < new Date()) {
            throw new BadRequestException('La date limite ne peut pas être dans le passé');
        }

        // Check employer exists
        const employer = await this.prisma.employer.findUnique({ where: { id: employerId } });
        if (!employer) throw new NotFoundException('Compte employeur introuvable');

        // Check employer is verified
        if (employer.verificationStatus !== 'VERIFIED') {
            throw new ForbiddenException('Votre compte entreprise doit être vérifié par un administrateur avant de pouvoir publier des offres. Veuillez renseigner votre NIF et RCCM puis attendre la validation.');
        }

        // Max 15 active jobs
        const activeCount = await this.prisma.job.count({
            where: { employerId, status: { in: ['DRAFT', 'PUBLISHED'] } }
        });
        if (activeCount >= 15) {
            throw new BadRequestException('Limite de 15 offres actives simultanées atteinte');
        }

        const job = await this.prisma.job.create({
            data: {
                employerId,
                title: data.title,
                type: data.type,
                sector: data.sector,
                regions: JSON.stringify(data.regions || []),
                educationLevel: JSON.stringify(data.educationLevel || []),
                experienceLevel: data.experienceLevel || 'NONE',
                description: data.description,
                requirements: data.requirements || '',
                deadline,
                salaryMin: data.salaryMin,
                salaryMax: data.salaryMax,
                isDiasporaOpen: data.isDiasporaOpen ?? false,
                isRemoteAbroad: data.isRemoteAbroad ?? false,
                relocationAid: data.relocationAid,
                status: 'DRAFT',
            },
        });

        // Save required documents if provided
        if (data.requiredDocs && data.requiredDocs.length > 0) {
            await this.prisma.requiredDoc.createMany({
                data: data.requiredDocs.map(rd => ({
                    jobId: job.id,
                    documentCategory: rd.documentCategory,
                    label: rd.label,
                    isOptional: rd.isOptional ?? false,
                })),
            });
        }

        return this.prisma.job.findUnique({
            where: { id: job.id },
            include: { requiredDocs: true },
        });

    }

    async publish(id: string, userId: string) {
        const job = await this.findOne(id);
        if (!job.employerId) throw new ForbiddenException('Impossible de modifier une offre externe');
        const member = await this.prisma.employerMember.findFirst({
            where: { userId, employerId: job.employerId },
        });
        if (!member) throw new ForbiddenException('Accès refusé');

        const employer = await this.prisma.employer.findUnique({ where: { id: job.employerId } });
        if (!employer || employer.verificationStatus !== 'VERIFIED') {
            throw new ForbiddenException('Votre compte entreprise doit être vérifié par un administrateur avant de pouvoir publier des offres.');
        }

        const published = await this.prisma.job.update({
            where: { id },
            data: { status: 'PUBLISHED', publishedAt: new Date() },
            include: { employer: { select: { name: true } } },
        });

        // Trigger job alert notifications in background (non-blocking)
        this.triggerAlertNotifications(published).catch(() => { });

        return published;
    }

    private async triggerAlertNotifications(job: any) {
        const matches = await this.alertsService.findMatchingUserIds({
            sector: job.sector,
            type: job.type,
            regions: job.regions,
            isDiasporaOpen: job.isDiasporaOpen,
            isRemoteAbroad: job.isRemoteAbroad,
        });

        if (matches.length === 0) return;

        // Deduplicate by userId (one notification per user even if multiple alerts match)
        const uniqueUserIds = [...new Set(matches.map(m => m.userId))];

        await Promise.all(
            uniqueUserIds.map(uid =>
                this.notificationsService.create(
                    uid,
                    'JOB_ALERT',
                    `Nouvelle offre : ${job.title}`,
                    `${job.employer?.name ?? 'Un employeur'} recrute dans le secteur ${job.sector}`,
                    `/jobs/${job.id}`,
                )
            )
        );
    }

    async close(id: string, userId: string) {
        const job = await this.findOne(id);
        if (!job.employerId) throw new ForbiddenException('Impossible de modifier une offre externe');
        const member = await this.prisma.employerMember.findFirst({
            where: { userId, employerId: job.employerId },
        });
        if (!member) throw new ForbiddenException('Accès refusé');

        return this.prisma.job.update({
            where: { id },
            data: { status: 'CLOSED' },
        });
    }

    async incrementView(id: string) {
        return this.prisma.job.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    }
}
