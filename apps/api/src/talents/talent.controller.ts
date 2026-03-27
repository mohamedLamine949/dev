import { Controller, Get, Query, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { TalentService } from './talent.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('talents')
export class TalentController {
    constructor(private talentService: TalentService) { }

    @UseGuards(JwtAuthGuard)
    @Get('search')
    async search(@Request() req: any, @Query() query: any) {
        const user = req.user;
        if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Seuls les recruteurs peuvent rechercher des talents.');
        }
        return this.talentService.searchTalents(query);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getOne(@Request() req: any, @Param('id') id: string) {
        const user = req.user;
        if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Accès restreint aux recruteurs.');
        }
        return this.talentService.getTalentById(id);
    }
}
