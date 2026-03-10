import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notifService: NotificationsService) { }

    @Get()
    async getMine(@Request() req: any) {
        const notifications = await this.notifService.getMyNotifications(req.user.id);
        const unreadCount = await this.notifService.getUnreadCount(req.user.id);
        return { notifications, unreadCount };
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req: any) {
        await this.notifService.markAllAsRead(req.user.id);
        return { success: true };
    }

    @Patch(':id/read')
    async markAsRead(@Request() req: any, @Param('id') id: string) {
        await this.notifService.markAsRead(req.user.id, id);
        return { success: true };
    }
}
