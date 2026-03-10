import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    getStats() {
        return this.adminService.getStats();
    }

    @Get('users')
    getUsers(@Query() query: any) {
        return this.adminService.getUsers(query);
    }

    @Patch('users/:id/suspend')
    toggleUserSuspension(@Param('id') id: string, @Body('isSuspended') isSuspended: boolean) {
        return this.adminService.toggleUserSuspension(id, isSuspended);
    }

    @Get('employers')
    getEmployers(@Query() query: any) {
        return this.adminService.getEmployers(query);
    }

    @Patch('employers/:id/verify')
    verifyEmployer(@Param('id') id: string, @Body('isVerified') isVerified: boolean) {
        return this.adminService.verifyEmployer(id, isVerified);
    }

    @Get('jobs')
    getJobs(@Query() query: any) {
        return this.adminService.getJobs(query);
    }

    @Patch('jobs/:id/status')
    updateJobStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.adminService.updateJobStatus(id, status);
    }
}
