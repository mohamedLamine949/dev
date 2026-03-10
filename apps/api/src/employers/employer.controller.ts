import {
    Controller, Post, Patch, Body, UseGuards, Request, BadRequestException, Get,
} from '@nestjs/common';
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
}
