import {
    IsString,
    IsOptional,
    IsEmail,
    MinLength,
    MaxLength,
    Matches,
    IsIn,
} from 'class-validator';

export class RegisterDto {
    @IsString()
    @Matches(/^[+\d][\d\s\-().]{6,}$/, {
        message: 'Numéro de téléphone invalide (chiffres et + uniquement)',
    })
    @MaxLength(20, { message: 'Numéro de téléphone trop long' })
    phone: string;

    @IsString()
    @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
    @MaxLength(50, { message: 'Le prénom est trop long' })
    @Matches(/^[a-zA-ZÀ-ÿ\u00C0-\u024F\s'-]+$/, {
        message: 'Le prénom ne doit contenir que des lettres',
    })
    firstName: string;

    @IsString()
    @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
    @MaxLength(50, { message: 'Le nom est trop long' })
    @Matches(/^[a-zA-ZÀ-ÿ\u00C0-\u024F\s'-]+$/, {
        message: 'Le nom ne doit contenir que des lettres',
    })
    lastName: string;

    @IsString()
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    @MaxLength(100, { message: 'Le mot de passe est trop long' })
    password: string;

    @IsString()
    @MinLength(2, { message: 'Le pays est obligatoire' })
    @MaxLength(60, { message: 'Le nom du pays est trop long' })
    country: string;

    @IsOptional()
    @IsEmail({}, { message: 'Adresse email invalide' })
    email?: string;

    @IsOptional()
    @IsIn(['CANDIDATE', 'RECRUITER'], { message: 'Rôle invalide' })
    role?: string;
}
