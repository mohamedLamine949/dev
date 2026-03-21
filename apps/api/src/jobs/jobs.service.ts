import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    page?: number;
    limit?: number;
}

@Injectable()
export class JobsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(filters: JobFilters = {}) {
        const { keyword, sector, type, region, educationLevel, isDiaspora, userId, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const where: any = {
            status: 'PUBLISHED',
            deadline: { gte: new Date() },
        };

        if (keyword) {
            where.OR = [
                { title: { contains: keyword } },
                { description: { contains: keyword } },
                { sector: { contains: keyword } },
            ];
        }
        if (sector) where.sector = sector;
        if (type) where.type = type;
        if (region) where.regions = { contains: region };
        if (educationLevel) where.educationLevel = { contains: educationLevel };
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

    async findOne(id: string) {
        const job = await this.prisma.job.findUnique({
            where: { id },
            include: {
                employer: { select: { id: true, name: true, slug: true, logoS3Key: true, isVerified: true, description: true } },
                requiredDocs: true,
            },
        });
        if (!job) throw new NotFoundException('Offre introuvable');
        return job;
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
        const member = await this.prisma.employerMember.findFirst({
            where: { userId, employerId: job.employerId },
        });
        if (!member) throw new ForbiddenException('Accès refusé');

        return this.prisma.job.update({
            where: { id },
            data: { status: 'PUBLISHED', publishedAt: new Date() },
        });
    }

    async close(id: string, userId: string) {
        const job = await this.findOne(id);
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
