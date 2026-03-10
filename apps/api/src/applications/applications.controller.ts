import {
    Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApplicationsService, ApplyDto, UpdateStatusDto, SendMessageDto, ApplicationFilters } from './applications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class ApplicationsController {
    constructor(private appService: ApplicationsService) { }

    // ===== CANDIDATE ENDPOINTS =====

    /** POST /api/jobs/:jobId/apply — submit an application */
    @UseGuards(JwtAuthGuard)
    @Post('jobs/:jobId/apply')
    apply(@Request() req: any, @Param('jobId') jobId: string, @Body() dto: ApplyDto) {
        return this.appService.apply(req.user.id, jobId, dto);
    }

    /** GET /api/applications/mine — list my applications */
    @UseGuards(JwtAuthGuard)
    @Get('applications/mine')
    getMyApplications(@Request() req: any, @Query() filters: ApplicationFilters) {
        return this.appService.getMyApplications(req.user.id, filters);
    }

    /** GET /api/applications/:id — application detail (candidate or recruiter) */
    @UseGuards(JwtAuthGuard)
    @Get('applications/:id')
    getApplicationDetail(@Request() req: any, @Param('id') id: string) {
        return this.appService.getApplicationDetail(req.user.id, id);
    }

    // ===== RECRUITER ENDPOINTS =====

    /** GET /api/jobs/:jobId/applications — recruiter views applications for a job */
    @UseGuards(JwtAuthGuard)
    @Get('jobs/:jobId/applications')
    getJobApplications(@Request() req: any, @Param('jobId') jobId: string, @Query() filters: ApplicationFilters) {
        return this.appService.getJobApplications(req.user.id, jobId, filters);
    }

    /** PATCH /api/applications/:id/status — recruiter updates application status */
    @UseGuards(JwtAuthGuard)
    @Patch('applications/:id/status')
    updateStatus(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
        return this.appService.updateStatus(req.user.id, id, dto);
    }

    // ===== MESSAGING =====

    /** GET /api/applications/:id/messages — messages for an application */
    @UseGuards(JwtAuthGuard)
    @Get('applications/:id/messages')
    getMessages(@Request() req: any, @Param('id') id: string) {
        return this.appService.getMessages(req.user.id, id);
    }

    /** POST /api/applications/:id/messages — send a message */
    @UseGuards(JwtAuthGuard)
    @Post('applications/:id/messages')
    sendMessage(@Request() req: any, @Param('id') id: string, @Body() dto: SendMessageDto) {
        return this.appService.sendMessage(req.user.id, id, dto);
    }
}
