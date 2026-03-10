import {
    Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Request, NotFoundException, Res, UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { unlinkSync } from 'fs';
import { ProfileService, UpdateProfileDto, ExperienceDto, EducationDto, SkillDto } from './profile.service';
import { join, extname } from 'path';
import { existsSync, createReadStream } from 'fs';
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

    @UseGuards(JwtAuthGuard)
    @Post('me/avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (_req, _file, cb) => cb(null, join(process.cwd(), 'uploads')),
            filename: (_req, file, cb) => {
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: (_req, file, cb) => {
            if (['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Format non supporté. Utilisez JPG, PNG ou WEBP.'), false);
            }
        },
    }))
    async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
        if (!file) throw new BadRequestException('Aucun fichier reçu');

        const userId = req.user.id;
        const oldAvatar = await this.profileService.getAvatarUrl(userId);
        const avatarUrl = `/uploads/${file.filename}`;

        const updatedUser = await this.profileService.updateAvatar(userId, avatarUrl);

        // Delete old avatar physical file if exists
        if (oldAvatar) {
            const oldFilePath = join(process.cwd(), oldAvatar);
            if (existsSync(oldFilePath)) {
                try {
                    unlinkSync(oldFilePath);
                } catch (e) {
                    console.error('Erreur supression ancien avatar:', e);
                }
            }
        }

        return updatedUser;
    }

    // ---- Avatar Image ----
    @Get('/avatar/:userId')
    async getAvatar(@Param('userId') userId: string, @Res() res: Response) {
        const url = await this.profileService.getAvatarUrl(userId);
        if (!url) {
            throw new NotFoundException('Avatar non trouvé');
        }

        const filePath = join(process.cwd(), url);
        if (!existsSync(filePath)) {
            throw new NotFoundException('Fichier physique introuvable.');
        }

        const ext = extname(url).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.webp') mimeType = 'image/webp';

        res.set({
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=86400'
        });
        const fileStream = createReadStream(filePath);
        fileStream.pipe(res);
    }

    // ---- Public profile ----
    @Get(':id')
    getPublicProfile(@Param('id') id: string) {
        return this.profileService.getPublicProfile(id);
    }
}
