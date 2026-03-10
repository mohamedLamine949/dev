import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService
    ) { }

    @Post('register')
    async register(@Body() body: any) {
        // Phone is now the required primary identifier
        if (!body.phone || !body.password || !body.firstName || !body.lastName || !body.country) {
            throw new BadRequestException(
                'Champs obligatoires manquants : téléphone, mot de passe, prénom, nom, pays'
            );
        }

        const user = await this.usersService.create({
            phone: body.phone,
            email: body.email || undefined,  // optional
            password: body.password,
            firstName: body.firstName,
            lastName: body.lastName,
            country: body.country,
            role: body.role || 'CANDIDATE',
        });

        return this.authService.login(user);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() body: any) {
        // Accept phone number OR email as identifier
        if (!body.identifier || !body.password) {
            throw new BadRequestException(
                'Veuillez fournir votre numéro de téléphone (ou email) et votre mot de passe'
            );
        }
        const user = await this.authService.validateUser(body.identifier, body.password);
        if (!user) {
            throw new UnauthorizedException('Identifiants incorrects');
        }
        return this.authService.login(user);
    }
}
