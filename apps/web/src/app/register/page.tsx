'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const inputCls = "w-full rounded-lg bg-white/[0.06] border border-white/10 px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition";

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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register({
                phone: form.phone,
                firstName: form.firstName,
                lastName: form.lastName,
                password: form.password,
                country: form.country,
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

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
            {/* Mali bar */}
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" />
                <div className="flex-1 bg-[#FCD116]" />
                <div className="flex-1 bg-[#CE1126]" />
            </div>

            <div className="w-full max-w-md">
                {/* Logo */}
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
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Téléphone <span className="text-white/40">*</span>
                            </label>
                            <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                                className={inputCls} placeholder="+223 70 00 00 00" />
                            <p className="text-xs text-gray-600 mt-1">Sert d&apos;identifiant pour vous connecter</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Prénom <span className="text-white/40">*</span></label>
                                <input name="firstName" required value={form.firstName} onChange={handleChange}
                                    className={inputCls} placeholder="Mamadou" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Nom <span className="text-white/40">*</span></label>
                                <input name="lastName" required value={form.lastName} onChange={handleChange}
                                    className={inputCls} placeholder="Coulibaly" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Email <span className="text-gray-600">(optionnel)</span>
                            </label>
                            <input name="email" type="email" value={form.email} onChange={handleChange}
                                className={inputCls} placeholder="vous@exemple.com" />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Pays de résidence <span className="text-white/40">*</span></label>
                            <input name="country" required value={form.country} onChange={handleChange}
                                className={inputCls} placeholder="Mali, France, Sénégal..." />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Mot de passe <span className="text-white/40">*</span></label>
                            <input name="password" type="password" required value={form.password} onChange={handleChange}
                                className={inputCls} placeholder="••••••••" />
                        </div>

                        {error && (
                            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full rounded-lg bg-white text-black font-semibold py-2.5 text-sm hover:bg-gray-100 disabled:opacity-50 transition-colors mt-2">
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
