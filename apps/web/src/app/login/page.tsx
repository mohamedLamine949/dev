'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(identifier, password);
            router.push('/dashboard');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Identifiants incorrects');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
            {/* Top mali bar */}
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" />
                <div className="flex-1 bg-[#FCD116]" />
                <div className="flex-1 bg-[#CE1126]" />
            </div>

            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <span className="text-white font-bold text-xl tracking-tight">MaliEmploi</span>
                        <span className="text-[11px] text-[#FCD116]/80 font-medium border border-[#FCD116]/30 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Bienvenue</h1>
                    <p className="mt-1 text-sm text-gray-500">Connectez-vous à votre espace</p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-7">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Téléphone ou email
                            </label>
                            <input
                                type="text"
                                required
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition"
                                placeholder="+223 XX XX XX XX ou email"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Mot de passe</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-white text-black font-semibold py-2.5 text-sm hover:bg-gray-100 disabled:opacity-50 transition-colors mt-2"
                        >
                            {loading ? 'Connexion...' : 'Se connecter →'}
                        </button>
                    </form>
                </div>

                <p className="mt-5 text-center text-sm text-gray-600">
                    Pas encore de compte ?{' '}
                    <Link href="/register" className="text-white hover:text-gray-300 font-medium transition-colors">
                        Créer un compte
                    </Link>
                </p>
                <p className="mt-2 text-center">
                    <Link href="/" className="text-xs text-gray-700 hover:text-gray-500 transition-colors">
                        ← Retour à l&apos;accueil
                    </Link>
                </p>
            </div>
        </div>
    );
}
