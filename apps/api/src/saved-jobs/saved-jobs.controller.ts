import { Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SavedJobsService } from './saved-jobs.service';

@Controller()
export class SavedJobsController {
    constructor(private readonly savedJobsService: SavedJobsService) { }

    @UseGuards(JwtAuthGuard)
    @Post('jobs/:id/save')
    saveJob(@Request() req: any, @Param('id') jobId: string) {
        return this.savedJobsService.saveJob(req.user.id, jobId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('jobs/:id/save')
    removeSavedJob(@Request() req: any, @Param('id') jobId: string) {
        return this.savedJobsService.removeSavedJob(req.user.id, jobId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('saved-jobs')
    getSavedJobs(@Request() req: any) {
        return this.savedJobsService.getSavedJobs(req.user.id);
    }
}
