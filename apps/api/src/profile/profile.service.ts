import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// --------------- DTOs ---------------
export interface UpdateProfileDto {
    title?: string;
    summary?: string;
    availability?: string; // IMMEDIATE | NOTICE | LISTENING | UNAVAILABLE
    salaryMin?: number;
    salaryMax?: number;
    isDiaspora?: boolean;
    returnType?: string;
    returnHorizon?: string;
}

export interface ExperienceDto {
    title: string;
    company: string;
    type?: string; // PRIVATE | PUBLIC | ONG
    startDate: string;
    endDate?: string;
    description?: string;
}

export interface EducationDto {
    title: string;
    institution: string;
    country: string;
    year: number;
    level: string; // BEPC | BAC | BAC+2 ...
}

export interface SkillDto {
    name: string;
    level?: string; // BEGINNER | INTERMEDIATE | ADVANCED | EXPERT
}

// --------------- Service ---------------
@Injectable()
export class ProfileService {
    constructor(private prisma: PrismaService) { }

    /** Get or create the candidate profile for the current user */
    async getMyProfile(userId: string) {
        let profile = await this.prisma.candidateProfile.findUnique({
            where: { userId },
            include: { experiences: true, educations: true, skills: true, user: true },
        });

        if (!profile) {
            profile = await this.prisma.candidateProfile.create({
                data: { userId },
                include: { experiences: true, educations: true, skills: true, user: true },
            });
        }

        return { ...profile, completionScore: this.calculateScore(profile) };
    }

    /** Update top-level profile fields */
    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const profile = await this.ensureProfile(userId);
        const updated = await this.prisma.candidateProfile.update({
            where: { id: profile.id },
            data: dto,
            include: { experiences: true, educations: true, skills: true, user: true },
        });
        // Recalculate score
        const score = this.calculateScore(updated);
        await this.prisma.candidateProfile.update({ where: { id: profile.id }, data: { completionScore: score } });
        return { ...updated, completionScore: score };
    }

    // ---- Experiences ----
    async addExperience(userId: string, dto: ExperienceDto) {
        const profile = await this.ensureProfile(userId);
        return this.prisma.experience.create({
            data: {
                profileId: profile.id,
                title: dto.title,
                company: dto.company,
                type: dto.type || 'PRIVATE',
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                description: dto.description,
            },
        });
    }

    async removeExperience(userId: string, expId: string) {
        const profile = await this.ensureProfile(userId);
        await this.prisma.experience.deleteMany({ where: { id: expId, profileId: profile.id } });
        return { deleted: true };
    }

    // ---- Educations ----
    async addEducation(userId: string, dto: EducationDto) {
        const profile = await this.ensureProfile(userId);
        return this.prisma.education.create({
            data: {
                profileId: profile.id,
                title: dto.title,
                institution: dto.institution,
                country: dto.country,
                year: dto.year,
                level: dto.level,
            },
        });
    }

    async removeEducation(userId: string, eduId: string) {
        const profile = await this.ensureProfile(userId);
        await this.prisma.education.deleteMany({ where: { id: eduId, profileId: profile.id } });
        return { deleted: true };
    }

    // ---- Skills ----
    async addSkill(userId: string, dto: SkillDto) {
        const profile = await this.ensureProfile(userId);
        return this.prisma.skill.create({
            data: { profileId: profile.id, name: dto.name, level: dto.level || 'INTERMEDIATE' },
        });
    }

    async removeSkill(userId: string, skillId: string) {
        const profile = await this.ensureProfile(userId);
        await this.prisma.skill.deleteMany({ where: { id: skillId, profileId: profile.id } });
        return { deleted: true };
    }

    // ---- Public profile ----
    async getPublicProfile(profileId: string) {
        const profile = await this.prisma.candidateProfile.findUnique({
            where: { id: profileId },
            include: {
                experiences: true,
                educations: true,
                skills: true,
                user: { select: { firstName: true, lastName: true, country: true, region: true, createdAt: true, avatarS3Key: true } },
            },
        });
        if (!profile) throw new NotFoundException('Profil introuvable');
        return { ...profile, completionScore: this.calculateScore(profile) };
    }

    // ---- Avatar ----
    async getAvatarUrl(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { avatarS3Key: true } });
        return user?.avatarS3Key;
    }

    async updateAvatar(userId: string, avatarUrl: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { avatarS3Key: avatarUrl },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, avatarS3Key: true }
        });
    }

    // ---- Helpers ----
    private async ensureProfile(userId: string) {
        let profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
        if (!profile) {
            profile = await this.prisma.candidateProfile.create({ data: { userId } });
        }
        return profile;
    }

    private calculateScore(profile: any): number {
        let score = 0;
        const checks = [
            () => !!profile.title,                     // 15
            () => !!profile.summary,                   // 15
            () => !!profile.availability,              // 10
            () => !!profile.salaryMin,                 // 5
            () => profile.experiences?.length > 0,     // 20
            () => profile.educations?.length > 0,      // 20
            () => profile.skills?.length > 0,          // 10
            () => !!profile.user?.country,             // 5
        ];
        const weights = [15, 15, 10, 5, 20, 20, 10, 5];
        checks.forEach((check, i) => { if (check()) score += weights[i]; });
        return score;
    }
}
