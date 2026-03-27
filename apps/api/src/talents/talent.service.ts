import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TalentService {
    constructor(private prisma: PrismaService) { }

    async searchTalents(query: any) {
        const { q, sectors, regions, isDiaspora, experienceLevel, educationLevel } = query;

        const where: any = {
            role: 'CANDIDATE',
            isSuspended: false,
        };

        if (q) {
            where.OR = [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                {
                    candidateProfile: {
                        OR: [
                            { title: { contains: q, mode: 'insensitive' } },
                            { summary: { contains: q, mode: 'insensitive' } },
                        ]
                    }
                }
            ];
        }

        if (isDiaspora !== undefined && isDiaspora !== '') {
            where.candidateProfile = {
                ...where.candidateProfile,
                isDiaspora: isDiaspora === 'true',
            };
        }

        if (regions) {
            where.region = { in: Array.isArray(regions) ? regions : [regions] };
        }

        const profileConditions: any = {};
        if (educationLevel) {
            profileConditions.educations = { some: { level: educationLevel } };
        }

        if (sectors) {
            const sectorList = Array.isArray(sectors) ? sectors : [sectors];
            profileConditions.OR = [
                { summary: { contains: sectors.toString(), mode: 'insensitive' } },
                { skills: { some: { name: { in: sectorList, mode: 'insensitive' } } } }
            ];
        }

        if (Object.keys(profileConditions).length > 0) {
            where.candidateProfile = { ...where.candidateProfile, ...profileConditions };
        }

        const candidates = await this.prisma.user.findMany({
            where,
            include: {
                candidateProfile: {
                    include: {
                        skills: true,
                        experiences: true,
                    }
                }
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
        });

        const mapped = candidates.map(c => {
            const years = this.calculateTotalExperience(c.candidateProfile?.experiences || []);
            return { ...c, totalExperienceYears: years };
        });

        if (experienceLevel) {
            return mapped.filter(c => this.matchExperienceLevel(c.totalExperienceYears, experienceLevel));
        }

        return mapped;
    }

    private calculateTotalExperience(experiences: any[]): number {
        let totalMonths = 0;
        experiences.forEach(exp => {
            const start = new Date(exp.startDate);
            const end = exp.endDate ? new Date(exp.endDate) : new Date();
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            totalMonths += Math.max(0, months);
        });
        return Math.floor(totalMonths / 12);
    }

    private matchExperienceLevel(years: number, level: string): boolean {
        if (level === 'Débutant') return years === 0;
        if (level === '1-3 ans') return years >= 1 && years <= 3;
        if (level === '3-5 ans') return years >= 3 && years <= 5;
        if (level === '5-10 ans') return years >= 5 && years <= 10;
        if (level === '10+ ans') return years >= 10;
        return true;
    }

    async getTalentById(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId, role: 'CANDIDATE' },
            include: {
                candidateProfile: {
                    include: {
                        experiences: { orderBy: { startDate: 'desc' } },
                        educations: { orderBy: { year: 'desc' } },
                        skills: true,
                    }
                }
            }
        });
    }
}
