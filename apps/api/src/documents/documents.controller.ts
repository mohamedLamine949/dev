import {
    Controller, Get, Post, Delete, Param, Request, Res,
    UseGuards, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException, NotFoundException
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
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
            // Remove the file that multer just saved
            if (existsSync(file.path)) unlinkSync(file.path);
            throw new BadRequestException(`Catégorie invalide. Choisissez parmi: ${DOCUMENT_CATEGORIES.join(', ')}`);
        }

        // Remove old document of same category (one per category)
        const existing = await this.prisma.document.findFirst({
            where: { userId: req.user.id, category },
        });
        if (existing) {
            await this.prisma.document.delete({ where: { id: existing.id } });

            // Delete the old file from disk
            const oldFilePath = join(process.cwd(), existing.s3Key);
            if (existsSync(oldFilePath)) {
                unlinkSync(oldFilePath);
            }
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

        // Delete the physical file
        const filePath = join(process.cwd(), doc.s3Key);
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }

        return { success: true };
    }

    /** GET /api/documents/:id/download — Securely download a file */
    @UseGuards(JwtAuthGuard)
    @Get(':id/download')
    async download(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
        const doc = await this.prisma.document.findUnique({ where: { id } });
        if (!doc) throw new NotFoundException('Document introuvable');

        // Logic 1: You are the owner
        let hasAccess = doc.userId === req.user.id;

        // Logic 2: You are Admin
        if (!hasAccess && req.user.role === 'ADMIN') {
            hasAccess = true;
        }

        // Logic 3: You are a Recruiter and this document is attached to an application for your company
        if (!hasAccess && req.user.role === 'RECRUITER') {
            const hasApplication = await this.prisma.applicationDoc.findFirst({
                where: {
                    documentId: id,
                    application: {
                        job: {
                            employer: {
                                members: {
                                    some: { userId: req.user.id }
                                }
                            }
                        }
                    }
                }
            });
            if (hasApplication) hasAccess = true;
        }

        if (!hasAccess) {
            throw new ForbiddenException('Vous n\'avez pas accès à ce document.');
        }

        const filePath = join(process.cwd(), doc.s3Key);
        if (!existsSync(filePath)) {
            throw new NotFoundException('Fichier physique introuvable sur le serveur.');
        }

        const fileStream = createReadStream(filePath);
        res.set({
            'Content-Type': doc.mimeType,
            'Content-Disposition': `inline; filename="${doc.name}"`, // inline allows viewing PDFs in browser instead of forcing download
        });
        fileStream.pipe(res);
    }
}
