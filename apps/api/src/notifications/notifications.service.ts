import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async getMyNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    async markAsRead(userId: string, id: string) {
        const notif = await this.prisma.notification.findUnique({ where: { id } });
        if (!notif || notif.userId !== userId) throw new NotFoundException('Notification introuvable');

        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    // --- Helper pour créer des notifications internes ---
    async create(userId: string, type: string, title: string, body: string, deepLink?: string) {
        return this.prisma.notification.create({
            data: { userId, type, title, body, deepLink },
        });
    }
}
