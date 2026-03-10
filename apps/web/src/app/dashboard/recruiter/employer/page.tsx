'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { employerApi } from '@/lib/api';

const CATEGORIES = ['Grande Entreprise', 'PME / PMI', 'Startup', 'Administration Publique', 'ONG / Association', 'Cabinet de Recrutement', 'Institution Internationale'];

const inputCls = "w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition";
const selectCls = "w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition";

export default function RegisterEmployerPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ name: '', category: '', description: '', nif: '', rccm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [existingEmployers, setExistingEmployers] = useState<{ name: string; verificationStatus?: string; isVerified?: boolean }[]>([]);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'RECRUITER')) { router.push('/dashboard'); return; }
        if (token) { employerApi.getMyEmployers(token).then(setExistingEmployers).catch(() => { }); }
    }, [user, authLoading, token, router]);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.category) { setError('Le nom et la catégorie sont obligatoires'); return; }
        setError(''); setLoading(true);
        try { await employerApi.create(token!, form); router.push('/dashboard/recruiter/jobs/new'); }
        catch (err: unknown) { setError((err as Error)?.message || 'Erreur lors de la création'); }
        finally { setLoading(false); }
    };

    if (authLoading) return <div className="min-h-screen bg-[#0a0a0a]" />;

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
            </div>
            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliLink</span>
                    <span className="text-[11px] text-[#FCD116]/70 border border-[#FCD116]/25 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
                </Link>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
            </nav>

            <div className="max-w-xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Enregistrer votre entreprise</h1>
                    <p className="text-gray-500 text-sm">Pour publier des offres, enregistrez votre structure. Un admin pourra valider votre badge ✓ Vérifié.</p>
                </div>

                {existingEmployers.length > 0 && (
                    <div className="mb-5 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                        <p className="text-sm text-gray-300">
                            Lié à : <strong>{existingEmployers.map(e => e.name).join(', ')}</strong>
                            {existingEmployers[0]?.verificationStatus === 'PENDING' && (
                                <span className="ml-2 text-xs border border-[#FCD116]/30 text-[#FCD116] px-2 py-0.5 rounded-full">⏳ En attente de validation</span>
                            )}
                            {existingEmployers[0]?.isVerified && (
                                <span className="ml-2 text-xs border border-[#14B53A]/30 text-[#14B53A] px-2 py-0.5 rounded-full">✓ Vérifié</span>
                            )}
                        </p>
                    </div>
                )}

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Nom de l&apos;entreprise <span className="text-white/40">*</span></label>
                            <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="Ex: Sotelma-Malitel, Orange Mali..." />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Type de structure <span className="text-white/40">*</span></label>
                            <select required value={form.category} onChange={set('category')} className={selectCls}>
                                <option value="">Sélectionner...</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Legal IDs */}
                        <div className="rounded-xl border border-[#FCD116]/20 bg-[#FCD116]/[0.03] p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-semibold text-[#FCD116]">🏛️ Identifiants légaux</span>
                                <span className="text-xs text-gray-600">Recommandé pour la vérification</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">NIF</label>
                                    <input value={form.nif} onChange={set('nif')} className={inputCls} placeholder="0001234567" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">RCCM</label>
                                    <input value={form.rccm} onChange={set('rccm')} className={inputCls} placeholder="ML-BAM-2024-B-1234" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Description <span className="text-gray-600">(optionnel)</span></label>
                            <textarea value={form.description} onChange={set('description')} rows={3}
                                className={inputCls + " resize-none"} placeholder="Présentez brièvement votre structure..." />
                        </div>

                        {error && <div className="border border-red-500/20 bg-red-500/10 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

                        <button type="submit" disabled={loading}
                            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition">
                            {loading ? 'Enregistrement...' : 'Enregistrer mon entreprise →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
