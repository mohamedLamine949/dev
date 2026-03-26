'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const inputCls = (hasError: boolean) =>
    `w-full rounded-lg bg-white/[0.06] border px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 transition ${
        hasError
            ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50'
            : 'border-white/10 focus:ring-white/20 focus:border-white/20'
    }`;

// Only allow letters (including accented), spaces and hyphens
function filterName(value: string): string {
    return value.replace(/[^a-zA-ZÀ-ÿ\u00C0-\u024F\s'-]/g, '');
}

// Only allow + at start and digits
function filterPhone(value: string): string {
    if (value === '') return '';
    const hasPlus = value.startsWith('+');
    const digits = value.replace(/[^\d]/g, '');
    return hasPlus ? '+' + digits : digits;
}

interface FieldErrors {
    phone?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    country?: string;
    password?: string;
}

function validate(form: {
    phone: string;
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    password: string;
}): FieldErrors {
    const errors: FieldErrors = {};

    // Phone
    const digits = form.phone.replace(/[^\d]/g, '');
    if (!form.phone) {
        errors.phone = 'Le numéro de téléphone est obligatoire';
    } else if (!/^[+\d]/.test(form.phone)) {
        errors.phone = 'Doit commencer par + ou un chiffre';
    } else if (digits.length < 8) {
        errors.phone = `Trop court — ${digits.length}/8 chiffres minimum`;
    } else if (digits.length > 15) {
        errors.phone = 'Trop long — 15 chiffres maximum';
    }

    // First name
    if (!form.firstName.trim()) {
        errors.firstName = 'Le prénom est obligatoire';
    } else if (form.firstName.trim().length < 2) {
        errors.firstName = 'Minimum 2 caractères';
    }

    // Last name
    if (!form.lastName.trim()) {
        errors.lastName = 'Le nom est obligatoire';
    } else if (form.lastName.trim().length < 2) {
        errors.lastName = 'Minimum 2 caractères';
    }

    // Email (optional but must be valid if provided)
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Adresse email invalide';
    }

    // Country
    if (!form.country.trim()) {
        errors.country = 'Le pays est obligatoire';
    }

    // Password
    if (!form.password) {
        errors.password = 'Le mot de passe est obligatoire';
    } else if (form.password.length < 6) {
        errors.password = `Trop court — ${form.password.length}/6 caractères minimum`;
    }

    return errors;
}

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        phone: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        country: 'Mali',
        role: 'CANDIDATE' as 'CANDIDATE' | 'RECRUITER',
    });
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fieldErrors = validate(form);
    const hasErrors = Object.keys(fieldErrors).length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let filtered = value;
        if (name === 'phone') filtered = filterPhone(value);
        if (name === 'firstName' || name === 'lastName' || name === 'country') filtered = filterName(value);
        setForm(prev => ({ ...prev, [name]: filtered }));
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const showError = (field: keyof FieldErrors) =>
        touched[field] ? fieldErrors[field] : undefined;

    const handleSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        // Mark all fields as touched to show all errors
        setTouched({ phone: true, firstName: true, lastName: true, email: true, country: true, password: true });
        if (hasErrors) return;

        setError('');
        setLoading(true);
        try {
            await register({
                phone: form.phone,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                password: form.password,
                country: form.country.trim(),
                role: form.role,
                email: form.email || undefined,
            });
            router.push('/dashboard');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur d'inscription");
        } finally {
            setLoading(false);
        }
    };

    const phoneDigits = form.phone.replace(/[^\d]/g, '').length;

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" />
                <div className="flex-1 bg-[#FCD116]" />
                <div className="flex-1 bg-[#CE1126]" />
            </div>

            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <span className="text-white font-bold text-xl tracking-tight">MaliLink</span>
                        <span className="text-[11px] text-[#FCD116]/80 font-medium border border-[#FCD116]/30 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Créer un compte</h1>
                    <p className="mt-1 text-sm text-gray-500">Gratuit, sans engagement</p>
                </div>

                {/* Role selector */}
                <div className="mb-5 grid grid-cols-2 gap-2 p-1 rounded-xl border border-white/[0.07] bg-white/[0.03]">
                    {(['CANDIDATE', 'RECRUITER'] as const).map(r => (
                        <button key={r} type="button"
                            onClick={() => setForm(p => ({ ...p, role: r }))}
                            className={`py-2.5 rounded-lg text-sm font-medium transition-all ${form.role === r
                                ? 'bg-white text-black'
                                : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {r === 'CANDIDATE' ? '👤 Candidat(e)' : '🏢 Recruteur'}
                        </button>
                    ))}
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-7">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Phone */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Téléphone <span className="text-white/40">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    name="phone"
                                    type="tel"
                                    inputMode="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('phone')}
                                    className={inputCls(!!showError('phone'))}
                                    placeholder="+22370000000"
                                    maxLength={17}
                                />
                                {form.phone && (
                                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${phoneDigits >= 8 && phoneDigits <= 15 ? 'text-green-500' : 'text-gray-500'}`}>
                                        {phoneDigits} chiffres
                                    </span>
                                )}
                            </div>
                            {showError('phone') ? (
                                <p className="text-xs text-red-400 mt-1">{showError('phone')}</p>
                            ) : (
                                <p className="text-xs text-gray-600 mt-1">Sert d&apos;identifiant pour vous connecter</p>
                            )}
                        </div>

                        {/* First / Last name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Prénom <span className="text-white/40">*</span>
                                </label>
                                <input
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('firstName')}
                                    className={inputCls(!!showError('firstName'))}
                                    placeholder="Mamadou"
                                />
                                {showError('firstName') && (
                                    <p className="text-xs text-red-400 mt-1">{showError('firstName')}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Nom <span className="text-white/40">*</span>
                                </label>
                                <input
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('lastName')}
                                    className={inputCls(!!showError('lastName'))}
                                    placeholder="Coulibaly"
                                />
                                {showError('lastName') && (
                                    <p className="text-xs text-red-400 mt-1">{showError('lastName')}</p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Email <span className="text-gray-600">(optionnel)</span>
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                onBlur={() => handleBlur('email')}
                                className={inputCls(!!showError('email'))}
                                placeholder="vous@exemple.com"
                            />
                            {showError('email') && (
                                <p className="text-xs text-red-400 mt-1">{showError('email')}</p>
                            )}
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Pays de résidence <span className="text-white/40">*</span>
                            </label>
                            <input
                                name="country"
                                value={form.country}
                                onChange={handleChange}
                                onBlur={() => handleBlur('country')}
                                className={inputCls(!!showError('country'))}
                                placeholder="Mali, France, Sénégal..."
                            />
                            {showError('country') && (
                                <p className="text-xs text-red-400 mt-1">{showError('country')}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Mot de passe <span className="text-white/40">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('password')}
                                    className={inputCls(!!showError('password'))}
                                    placeholder="••••••••"
                                />
                                {form.password && (
                                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${form.password.length >= 6 ? 'text-green-500' : 'text-gray-500'}`}>
                                        {form.password.length}/6 min
                                    </span>
                                )}
                            </div>
                            {showError('password') && (
                                <p className="text-xs text-red-400 mt-1">{showError('password')}</p>
                            )}
                        </div>

                        {error && (
                            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-white text-black font-semibold py-2.5 text-sm hover:bg-gray-100 disabled:opacity-50 transition-colors mt-2"
                        >
                            {loading ? 'Inscription...' : 'Créer mon compte →'}
                        </button>
                    </form>
                </div>

                <p className="mt-5 text-center text-sm text-gray-600">
                    Déjà un compte ?{' '}
                    <Link href="/login" className="text-white hover:text-gray-300 font-medium transition-colors">Se connecter</Link>
                </p>
                <p className="mt-2 text-center">
                    <Link href="/" className="text-xs text-gray-700 hover:text-gray-500 transition-colors">← Retour à l&apos;accueil</Link>
                </p>
            </div>
        </div>
    );
}
