'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user && user.role === 'ADMIN') {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const loggedUser = await login(identifier, password);
            if (loggedUser.role !== 'ADMIN') {
                setError('Accès refusé. Ce panneau est réservé aux administrateurs.');
                return;
            }
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Identifiants invalides');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            <div className="w-full max-w-md bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="flex flex-col items-center mb-10 relative">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-green-600/40 mb-4 animate-bounce-subtle">ML</div>
                    <h1 className="text-2xl font-bold tracking-tight">MaliLink Admin</h1>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">Connexion Réservée</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Identifiant (Tél ou Email)</label>
                        <input
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-white placeholder-slate-600"
                            placeholder="votre.nom@malilink.ml"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Mot de passe</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-white placeholder-slate-600"
                            placeholder="••••••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl font-medium animate-shake">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? 'Authentification...' : 'Se connecter'}
                    </button>
                </form>

                <p className="mt-10 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                    Accès strictement monitoré
                </p>
            </div>
        </div>
    );
}
