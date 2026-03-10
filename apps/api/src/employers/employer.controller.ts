import {
    Controller, Post, Patch, Body, UseGuards, Request, BadRequestException, Get, UseInterceptors, UploadedFile, Param, NotFoundException, Res
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync, createReadStream } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/** Normalize: remove accents, lowercase, replace spaces with dashes, strip non-alphanumeric */
function toSlug(name: string): string {
    return name
        .normalize('NFD')                     // decompose accented chars: é → e + combining accent
        .replace(/[\u0300-\u036f]/g, '')       // remove combining accents
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')                 // spaces → dashes
        .replace(/[^\w-]+/g, '')              // remove non-word characters
        .replace(/--+/g, '-')                 // collapse multiple dashes
        .replace(/^-|-$/g, '');               // trim leading/trailing dashes
}

const UPLOADS_DIR = join(process.cwd(), 'uploads');

const storage = diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
});

@Controller('employers')
export class EmployerController {
    constructor(private prisma: PrismaService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Request() req: any, @Body() body: any) {
        const userId = req.user.id;

        if (!body.name || !body.category) {
            throw new BadRequestException('Le nom et la catégorie sont obligatoires');
        }

        const slug = toSlug(body.name);

        if (!slug) {
            throw new BadRequestException('Le nom de l\'entreprise est invalide');
        }

        // Check if employer with same name/slug exists
        const existing = await this.prisma.employer.findFirst({
            where: { OR: [{ name: body.name }, { slug }] }
        });
        if (existing) {
            throw new BadRequestException('Un employeur avec ce nom existe déjà');
        }

        let employer;
        try {
            employer = await this.prisma.employer.create({
                data: {
                    name: body.name,
                    slug,
                    category: body.category,
                    description: body.description || null,
                }
            });
        } catch (e: any) {
            // Prisma unique constraint violation (P2002)
            if (e?.code === 'P2002') {
                throw new BadRequestException('Un employeur avec ce nom ou slug existe déjà. Essayez un nom légèrement différent.');
            }
            console.error('[EmployerController] create error:', e);
            throw new BadRequestException(`Erreur lors de la création: ${e.message}`);
        }

        // Link the creator as first member (ignore if already linked)
        try {
            await this.prisma.employerMember.create({
                data: { employerId: employer.id, userId, role: 'RECRUITER' }
            });
        } catch (e: any) {
            if (e?.code !== 'P2002') {
                console.error('[EmployerController] member link error:', e);
            }
            // P2002 = already linked, that's fine
        }

        return employer;
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMyEmployers(@Request() req: any) {
        const userId = req.user.id;
        const memberships = await this.prisma.employerMember.findMany({
            where: { userId },
            include: { employer: true }
        });
        return memberships.map(m => m.employer);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    async updateMyEmployer(@Request() req: any, @Body() body: any) {
        const userId = req.user.id;
        const membership = await this.prisma.employerMember.findFirst({
            where: { userId },
            include: { employer: true },
        });
        if (!membership) throw new BadRequestException('Aucune entreprise associée à ce compte');

        return this.prisma.employer.update({
            where: { id: membership.employerId },
            data: {
                nif: body.nif || undefined,
                rccm: body.rccm || undefined,
                description: body.description || undefined,
            },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Post('me/logo')
    @UseInterceptors(FileInterceptor('file', {
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: (_req, file, cb) => {
            if (['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Format non supporté. Utilisez JPG, PNG ou WEBP.'), false);
            }
        },
    }))
    async uploadLogo(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
        if (!file) throw new BadRequestException('Aucun fichier reçu');

        const userId = req.user.id;
        const membership = await this.prisma.employerMember.findFirst({
            where: { userId },
            include: { employer: true },
        });

        if (!membership) {
            if (existsSync(file.path)) unlinkSync(file.path);
            throw new BadRequestException('Aucune entreprise associée à ce compte');
        }

        const oldLogoUrl = membership.employer.logoS3Key;
        const logoS3Key = `/uploads/${file.filename}`;

        const updatedEmployer = await this.prisma.employer.update({
            where: { id: membership.employerId },
            data: { logoS3Key },
        });

        // Delete old logo physical file if exists
        if (oldLogoUrl) {
            const oldFilePath = join(process.cwd(), oldLogoUrl);
            if (existsSync(oldFilePath)) {
                try {
                    unlinkSync(oldFilePath);
                } catch (e) {
                    console.error('Erreur supression ancien logo:', e);
                }
            }
        }

        return updatedEmployer;
    }

    @Get(':id/logo')
    async getLogo(@Param('id') id: string, @Res() res: Response) {
        const employer = await this.prisma.employer.findUnique({ where: { id } });
        if (!employer || !employer.logoS3Key) {
            throw new NotFoundException('Logo non trouvé');
        }

        const filePath = join(process.cwd(), employer.logoS3Key);
        if (!existsSync(filePath)) {
            throw new NotFoundException('Fichier physique introuvable.');
        }

        const ext = extname(employer.logoS3Key).toLowerCase();
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
}
