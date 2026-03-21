import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedJobsService {
    constructor(private readonly prisma: PrismaService) { }

    async saveJob(userId: string, jobId: string) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            select: { id: true },
        });

        if (!job) {
            throw new NotFoundException('Offre introuvable');
        }

        return this.prisma.savedJob.upsert({
            where: { userId_jobId: { userId, jobId } },
            update: {},
            create: { userId, jobId },
            include: {
                job: {
                    include: {
                        employer: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                logoS3Key: true,
                                isVerified: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async removeSavedJob(userId: string, jobId: string) {
        const savedJob = await this.prisma.savedJob.findUnique({
            where: { userId_jobId: { userId, jobId } },
            select: { id: true },
        });

        if (!savedJob) {
            throw new NotFoundException('Offre sauvegardee introuvable');
        }

        await this.prisma.savedJob.delete({
            where: { userId_jobId: { userId, jobId } },
        });

        return { success: true };
    }

    async getSavedJobs(userId: string) {
        const savedJobs = await this.prisma.savedJob.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                job: {
                    include: {
                        employer: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                logoS3Key: true,
                                isVerified: true,
                            },
                        },
                    },
                },
            },
        });

        return savedJobs.map(savedJob => ({
            ...savedJob,
            job: {
                ...savedJob.job,
                isSaved: true,
            },
        }));
    }
}
