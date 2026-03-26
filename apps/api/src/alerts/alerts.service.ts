import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function parseList(value: string): string[] {
    try { return JSON.parse(value); } catch { return []; }
}

@Injectable()
export class AlertsService {
    constructor(private prisma: PrismaService) { }

    async getMyAlerts(userId: string) {
        const alerts = await this.prisma.alert.findMany({ where: { userId } });
        return alerts.map(a => ({
            ...a,
            sectors: parseList(a.sectors),
            jobTypes: parseList(a.jobTypes),
            regions: parseList(a.regions),
        }));
    }

    async create(userId: string, data: {
        sectors: string[];
        jobTypes?: string[];
        regions?: string[];
        isDiasporaOnly?: boolean;
        isRemoteOnly?: boolean;
    }) {
        const alert = await this.prisma.alert.create({
            data: {
                userId,
                sectors: JSON.stringify(data.sectors || []),
                jobTypes: JSON.stringify(data.jobTypes || []),
                regions: JSON.stringify(data.regions || []),
                isDiasporaOnly: data.isDiasporaOnly ?? false,
                isRemoteOnly: data.isRemoteOnly ?? false,
                isActive: true,
            },
        });
        return {
            ...alert,
            sectors: parseList(alert.sectors),
            jobTypes: parseList(alert.jobTypes),
            regions: parseList(alert.regions),
        };
    }

    async update(userId: string, id: string, data: {
        sectors?: string[];
        jobTypes?: string[];
        regions?: string[];
        isDiasporaOnly?: boolean;
        isRemoteOnly?: boolean;
        isActive?: boolean;
    }) {
        const alert = await this.prisma.alert.findUnique({ where: { id } });
        if (!alert) throw new NotFoundException('Alerte introuvable');
        if (alert.userId !== userId) throw new ForbiddenException('Accès refusé');

        const updated = await this.prisma.alert.update({
            where: { id },
            data: {
                ...(data.sectors !== undefined && { sectors: JSON.stringify(data.sectors) }),
                ...(data.jobTypes !== undefined && { jobTypes: JSON.stringify(data.jobTypes) }),
                ...(data.regions !== undefined && { regions: JSON.stringify(data.regions) }),
                ...(data.isDiasporaOnly !== undefined && { isDiasporaOnly: data.isDiasporaOnly }),
                ...(data.isRemoteOnly !== undefined && { isRemoteOnly: data.isRemoteOnly }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
        return {
            ...updated,
            sectors: parseList(updated.sectors),
            jobTypes: parseList(updated.jobTypes),
            regions: parseList(updated.regions),
        };
    }

    async remove(userId: string, id: string) {
        const alert = await this.prisma.alert.findUnique({ where: { id } });
        if (!alert) throw new NotFoundException('Alerte introuvable');
        if (alert.userId !== userId) throw new ForbiddenException('Accès refusé');
        await this.prisma.alert.delete({ where: { id } });
        return { success: true };
    }

    /**
     * Called after a job is published.
     * Finds all active alerts matching the job and returns the list of userIds to notify.
     */
    async findMatchingUserIds(job: {
        sector: string;
        type: string;
        regions: string;
        isDiasporaOpen: boolean;
        isRemoteAbroad: boolean;
    }): Promise<Array<{ userId: string; alertId: string }>> {
        const jobRegions: string[] = parseList(job.regions);
        const activeAlerts = await this.prisma.alert.findMany({ where: { isActive: true } });

        const matches: Array<{ userId: string; alertId: string }> = [];

        for (const alert of activeAlerts) {
            const alertSectors = parseList(alert.sectors);
            const alertJobTypes = parseList(alert.jobTypes);
            const alertRegions = parseList(alert.regions);

            // Sector must match (required)
            if (!alertSectors.includes(job.sector)) continue;

            // JobType filter (optional — if empty, all types match)
            if (alertJobTypes.length > 0 && !alertJobTypes.includes(job.type)) continue;

            // Region filter (optional — if empty, all regions match)
            if (alertRegions.length > 0 && !jobRegions.some(r => alertRegions.includes(r))) continue;

            // Diaspora filter
            if (alert.isDiasporaOnly && !job.isDiasporaOpen) continue;

            // Remote filter
            if (alert.isRemoteOnly && !job.isRemoteAbroad) continue;

            matches.push({ userId: alert.userId, alertId: alert.id });
        }

        return matches;
    }
}
