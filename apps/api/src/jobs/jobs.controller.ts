import {
    Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, BadRequestException,
} from '@nestjs/common';
import { JobsService, CreateJobDto, JobFilters } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService, private readonly prisma: PrismaService) { }

    /** Public — list published jobs with optional filters */
    @Get()
    findAll(@Query() query: any) {
        const filters: JobFilters = {
            keyword: query.q,
            sector: query.sector,
            type: query.type,
            region: query.region,
            educationLevel: query.educationLevel,
            isDiaspora: query.diaspora === 'true',
            page: query.page ? parseInt(query.page) : 1,
            limit: query.limit ? parseInt(query.limit) : 20,
        };
        return this.jobsService.findAll(filters);
    }

    /** Public — get one job */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const job = await this.jobsService.findOne(id);
        // Increment view in background (non-blocking)
        this.jobsService.incrementView(id);
        return job;
    }

    /** Protected — create job (recruiter) */
    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() body: CreateJobDto, @Request() req: any) {
        const userId = req.user.id;
        let employerId = body.employerId;

        // If no employerId provided, try to find one where the user is a member
        if (!employerId) {
            const memberships = await this.prisma.employerMember.findMany({
                where: { userId },
                include: { employer: true }
            });

            if (memberships.length > 0) {
                employerId = memberships[0].employerId;
            } else {
                // FALLBACK: If no memberships but there are employers in DB, link user to the first one
                const allEmployers = await this.prisma.employer.findMany({ take: 1 });
                if (allEmployers.length > 0) {
                    employerId = allEmployers[0].id;
                    // Auto-link for future use
                    await this.prisma.employerMember.create({
                        data: { userId, employerId, role: 'RECRUITER' },
                    });
                } else {
                    throw new BadRequestException('Vous n\'avez pas encore de compte employeur. Veuillez en créer un d\'abord (ou spécifier son ID).');
                }
            }
        }

        // Auto-create EmployerMember link if missing (for admins/other use cases)
        const existing = await this.prisma.employerMember.findFirst({
            where: { userId, employerId },
        });
        if (!existing) {
            await this.prisma.employerMember.create({
                data: { userId, employerId, role: 'RECRUITER' },
            });
        }

        return this.jobsService.create(body, employerId);
    }

    /** Protected — publish a draft job */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/publish')
    publish(@Param('id') id: string, @Request() req: any) {
        return this.jobsService.publish(id, req.user.id);
    }

    /** Protected — close a published job */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/close')
    close(@Param('id') id: string, @Request() req: any) {
        return this.jobsService.close(id, req.user.id);
    }
}
