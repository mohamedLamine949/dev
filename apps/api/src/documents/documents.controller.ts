import {
    Controller, Get, Post, Delete, Param, Request,
    UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

export const DOCUMENT_CATEGORIES = [
    'CV',
    'ACTE_NAISSANCE',
    'CERTIFICAT_NATIONALITE',
    'CASIER_JUDICIAIRE',
    'PASSEPORT',
    'CARTE_NINA',
    'DIPLOME',
    'AUTRE',
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];

const UPLOADS_DIR = join(process.cwd(), 'uploads');

// Ensure uploads directory exists at startup
if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
});

@Controller('documents')
export class DocumentsController {
    constructor(private prisma: PrismaService) { }

    /** GET /api/documents — list my documents */
    @UseGuards(JwtAuthGuard)
    @Get()
    async getMyDocuments(@Request() req: any) {
        return this.prisma.document.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    /** POST /api/documents/upload — upload a file */
    @UseGuards(JwtAuthGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
        fileFilter: (_req, file, cb) => {
            const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Format non supporté. Utilisez PDF, JPG ou PNG.'), false);
            }
        },
    }))
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any,
    ) {
        if (!file) throw new BadRequestException('Aucun fichier reçu');

        const category = req.body?.category as DocumentCategory;
        if (!DOCUMENT_CATEGORIES.includes(category)) {
            throw new BadRequestException(`Catégorie invalide. Choisissez parmi: ${DOCUMENT_CATEGORIES.join(', ')}`);
        }

        // Remove old document of same category (one per category)
        const existing = await this.prisma.document.findFirst({
            where: { userId: req.user.id, category },
        });
        if (existing) {
            await this.prisma.document.delete({ where: { id: existing.id } });
            // Note: in production, also delete the file from S3/storage
        }

        return this.prisma.document.create({
            data: {
                userId: req.user.id,
                name: file.originalname,
                category,
                s3Key: `/uploads/${file.filename}`,  // local path, swap for S3 key later
                mimeType: file.mimetype,
                size: file.size,
            },
        });
    }

    /** DELETE /api/documents/:id */
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: any) {
        const doc = await this.prisma.document.findUnique({ where: { id } });
        if (!doc || doc.userId !== req.user.id) {
            throw new BadRequestException('Document introuvable ou accès refusé');
        }
        await this.prisma.document.delete({ where: { id } });
        return { success: true };
    }
}
