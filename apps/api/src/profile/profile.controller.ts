import {
    Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ProfileService, UpdateProfileDto, ExperienceDto, EducationDto, SkillDto } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
export class ProfileController {
    constructor(private profileService: ProfileService) { }

    /** GET /api/profile/me — authenticated user's full profile */
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMyProfile(@Request() req: any) {
        return this.profileService.getMyProfile(req.user.id);
    }

    /** PATCH /api/profile/me — update top-level profile fields */
    @UseGuards(JwtAuthGuard)
    @Patch('me')
    updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
        return this.profileService.updateProfile(req.user.id, dto);
    }

    // ---- Experiences ----
    @UseGuards(JwtAuthGuard)
    @Post('me/experiences')
    addExperience(@Request() req: any, @Body() dto: ExperienceDto) {
        return this.profileService.addExperience(req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/experiences/:id')
    removeExperience(@Request() req: any, @Param('id') id: string) {
        return this.profileService.removeExperience(req.user.id, id);
    }

    // ---- Educations ----
    @UseGuards(JwtAuthGuard)
    @Post('me/educations')
    addEducation(@Request() req: any, @Body() dto: EducationDto) {
        return this.profileService.addEducation(req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/educations/:id')
    removeEducation(@Request() req: any, @Param('id') id: string) {
        return this.profileService.removeEducation(req.user.id, id);
    }

    // ---- Skills ----
    @UseGuards(JwtAuthGuard)
    @Post('me/skills')
    addSkill(@Request() req: any, @Body() dto: SkillDto) {
        return this.profileService.addSkill(req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/skills/:id')
    removeSkill(@Request() req: any, @Param('id') id: string) {
        return this.profileService.removeSkill(req.user.id, id);
    }

    // ---- Public profile ----
    @Get(':id')
    getPublicProfile(@Param('id') id: string) {
        return this.profileService.getPublicProfile(id);
    }
}
