import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
    constructor(private alertsService: AlertsService) { }

    @Get()
    getMine(@Request() req: any) {
        return this.alertsService.getMyAlerts(req.user.id);
    }

    @Post()
    create(@Request() req: any, @Body() body: any) {
        return this.alertsService.create(req.user.id, {
            sectors: body.sectors || [],
            jobTypes: body.jobTypes || [],
            regions: body.regions || [],
            isDiasporaOnly: body.isDiasporaOnly ?? false,
            isRemoteOnly: body.isRemoteOnly ?? false,
        });
    }

    @Patch(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        return this.alertsService.update(req.user.id, id, body);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.alertsService.remove(req.user.id, id);
    }
}
