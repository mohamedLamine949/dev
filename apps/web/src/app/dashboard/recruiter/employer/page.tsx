'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { employerApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
    Building2, ShieldCheck, AlertCircle, CheckCircle2, Clock, ShieldX,
    ArrowRight, Pencil, ImagePlus, PartyPopper
} from 'lucide-react';

const CATEGORIES = [
    'Grande Entreprise', 'PME / PMI', 'Startup', 'Administration Publique',
    'ONG / Association', 'Cabinet de Recrutement', 'Institution Internationale'
];

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#14B53A]/50 focus:border-[#14B53A]/50 transition-all shadow-inner";
const selectCls = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#14B53A]/50 focus:border-[#14B53A]/50 transition-all shadow-inner";
const labelCls = "block text-xs font-semibold text-gray-400 mb-2 tracking-wide uppercase";

type Employer = {
    id: string;
    name: string;
    slug: string;
    category: string;
    description?: string;
    nif?: string;
    rccm?: string;
    logoS3Key?: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verificationNote?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function EmployerProfilePage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isOnboarding = searchParams.get('onboarding') === '1';

    const [employer, setEmployer] = useState<Employer | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [justCreated, setJustCreated] = useState(false);

    const [form, setForm] = useState({
        name: '', category: '', description: '', nif: '', rccm: ''
    });

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'RECRUITER')) {
            router.push('/dashboard');
            return;
        }
        if (token) {
            employerApi.getMyEmployers(token)
                .then((list: Employer[]) => {
                    if (list && list.length > 0) {
                        const emp = list[0];
                        setEmployer(emp);
                        setForm({
                            name: emp.name,
                            category: emp.category,
                            description: emp.description || '',
                            nif: emp.nif || '',
                            rccm: emp.rccm || '',
                        });
                    }
                })
                .catch(() => { })
                .finally(() => setPageLoading(false));
        }
    }, [user, authLoading, token, router]);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.category) { setError('Le nom et la catégorie sont obligatoires'); return; }
        setError(''); setSuccess(''); setSaving(true);
        try {
            if (employer) {
                // Update
                const updated = await employerApi.update(token!, {
                    category: form.category,
                    description: form.description,
                    nif: form.nif,
                    rccm: form.rccm,
                }) as Employer;
                setEmployer(updated);
                setSuccess('Profil mis à jour. Si vous avez modifié NIF/RCCM après un refus, votre dossier repassera en vérification.');
            } else {
                // Create — then update localStorage so dashboard banner refreshes immediately
                const created = await employerApi.create(token!, form) as Employer;
                setEmployer(created);
                setForm(f => ({ ...f, name: created.name }));
                // Update cached user with new employerStatus
                try {
                    const stored = localStorage.getItem('malilink_user');
                    if (stored) {
                        const u = JSON.parse(stored);
                        u.employerStatus = 'PENDING';
                        localStorage.setItem('malilink_user', JSON.stringify(u));
                    }
                } catch (_) {}
                setJustCreated(true);
            }
        } catch (err: unknown) {
            setError((err as Error)?.message || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploadingLogo(true);
        try {
            const updated = await employerApi.uploadLogo(token!, e.target.files[0]);
            setEmployer(prev => prev ? { ...prev, logoS3Key: updated.logoS3Key } : prev);
        } catch (err: any) {
            setError(err.message || 'Erreur upload logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    if (authLoading || pageLoading) return <div className="min-h-screen bg-[#0a0a0a]" />;

    // Success screen after first company creation
    if (justCreated) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
                <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                    <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="max-w-md w-full bg-white/[0.03] border border-[#FCD116]/20 rounded-3xl p-10 text-center">
                    <div className="flex justify-center mb-5 text-[#FCD116]"><PartyPopper size={48} strokeWidth={1.5} /></div>
                    <h1 className="text-2xl font-bold text-white mb-2">Profil soumis !</h1>
                    <p className="text-gray-400 text-sm mb-2">
                        Votre profil entreprise a été envoyé pour vérification. Un administrateur va examiner votre <strong className="text-white">NIF</strong> et votre <strong className="text-white">RCCM</strong> sous peu.
                    </p>
                    <p className="text-[#FCD116]/60 text-xs mb-8">Vous recevrez une notification dès que votre compte sera validé.</p>
                    <Link href="/dashboard"
                        className="block w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2">
                        Aller au tableau de bord <ArrowRight size={16} />
                    </Link>
                </motion.div>
            </div>
        );
    }

    const statusBanner = employer ? (
        employer.verificationStatus === 'VERIFIED' ? (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-2xl border border-[#14B53A]/30 bg-[#14B53A]/10 mb-8">
                <CheckCircle2 size={20} className="text-[#14B53A] mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-bold text-[#14B53A]">Compte entreprise vérifié</p>
                    <p className="text-xs text-gray-400 mt-0.5">Vous pouvez publier des offres d'emploi.</p>
                </div>
            </motion.div>
        ) : employer.verificationStatus === 'REJECTED' ? (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 mb-8">
                <ShieldX size={20} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-bold text-red-400">Vérification refusée</p>
                    {employer.verificationNote && (
                        <p className="text-xs text-red-300/70 mt-0.5">Motif : {employer.verificationNote}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Corrigez votre NIF / RCCM ci-dessous. Votre dossier repassera automatiquement en vérification.</p>
                </div>
            </motion.div>
        ) : (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-2xl border border-[#FCD116]/30 bg-[#FCD116]/10 mb-8">
                <Clock size={20} className="text-[#FCD116] mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-bold text-[#FCD116]">En attente de validation</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Un administrateur va vérifier vos informations légales. Vous recevrez une notification dès validation.
                        {(!employer.nif || !employer.rccm) && (
                            <span className="text-[#FCD116]/70"> Pensez à renseigner votre NIF et RCCM pour accélérer la vérification.</span>
                        )}
                    </p>
                </div>
            </motion.div>
        )
    ) : null;

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
            </div>
            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliEmploi</span>
                    <span className="text-[11px] text-[#FCD116]/70 border border-[#FCD116]/25 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
                </Link>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
            </nav>

            <div className="max-w-xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="relative">
                        {employer?.logoS3Key ? (
                            <img
                                src={`${API}/employers/${employer.id}/logo`}
                                alt="Logo"
                                className="w-16 h-16 rounded-2xl object-cover border border-white/10 bg-white"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                        ) : (
                            <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/10">
                                <Building2 size={28} className="text-gray-500" />
                            </div>
                        )}
                        {employer && (
                            <label className="absolute -bottom-2 -right-2 cursor-pointer w-7 h-7 rounded-full bg-[#14B53A] flex items-center justify-center border-2 border-[#0a0a0a] hover:bg-[#12a133] transition">
                                {uploadingLogo
                                    ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                    : <ImagePlus size={12} className="text-white" />
                                }
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                            </label>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            {employer ? 'Ma fiche entreprise' : 'Créer mon profil entreprise'}
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {employer
                                ? 'Mettez à jour vos informations légales pour la vérification.'
                                : 'Renseignez les informations de votre structure pour commencer à recruter.'}
                        </p>
                    </div>
                </div>

                {/* Onboarding welcome banner */}
                {isOnboarding && !employer && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03] mb-6">
                        <span className="text-xl shrink-0">🎉</span>
                        <div>
                            <p className="text-sm font-bold text-white">Bienvenue sur MaliEmploi !</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Pour commencer à publier des offres, remplissez le profil de votre entreprise. L&apos;admin validera votre dossier sous peu.
                            </p>
                        </div>
                    </motion.div>
                )}

                {statusBanner}

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div>
                            <label className={labelCls}>Nom de l'entreprise <span className="text-[#CE1126]">*</span></label>
                            <input
                                required
                                value={form.name}
                                onChange={set('name')}
                                disabled={!!employer}
                                className={inputCls + (employer ? ' opacity-50 cursor-not-allowed' : '')}
                                placeholder="Ex: Sotelma-Malitel, Orange Mali..."
                            />
                            {employer && (
                                <p className="text-[10px] text-gray-600 mt-1.5 flex items-center gap-1">
                                    <Pencil size={9} /> Le nom ne peut pas être modifié après création.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelCls}>Type de structure <span className="text-[#CE1126]">*</span></label>
                            <select required value={form.category} onChange={set('category')} className={selectCls}>
                                <option value="">Sélectionner...</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Legal IDs — highlighted as required for verification */}
                        <div className="rounded-2xl border border-[#FCD116]/20 bg-[#FCD116]/[0.03] p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck size={15} className="text-[#FCD116]" />
                                <span className="text-sm font-bold text-[#FCD116]">Identifiants légaux</span>
                                <span className="text-[10px] text-gray-500 ml-auto">Requis pour la vérification admin</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-4">
                                L'administrateur vérifiera votre NIF et RCCM avant de valider votre compte. Sans ces informations, votre dossier ne pourra pas être approuvé.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>NIF</label>
                                    <input value={form.nif} onChange={set('nif')} className={inputCls} placeholder="0001234567" />
                                </div>
                                <div>
                                    <label className={labelCls}>RCCM</label>
                                    <input value={form.rccm} onChange={set('rccm')} className={inputCls} placeholder="ML-BAM-2024-B-1234" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Description <span className="text-gray-600 font-normal lowercase">(optionnel)</span></label>
                            <textarea
                                value={form.description}
                                onChange={set('description')}
                                rows={4}
                                className={inputCls + " resize-y"}
                                placeholder="Présentez votre structure, vos missions..."
                            />
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="border border-red-500/20 bg-red-500/10 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" /> {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="border border-[#14B53A]/20 bg-[#14B53A]/10 rounded-xl p-4 text-[#14B53A] text-sm flex items-center gap-2">
                                <CheckCircle2 size={16} className="shrink-0" /> {success}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-[#14B53A] text-white font-bold py-4 rounded-xl hover:bg-[#12a133] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,181,58,0.2)]"
                        >
                            {saving
                                ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                : employer
                                    ? <><Pencil size={17} /> Enregistrer les modifications</>
                                    : <>Créer mon profil entreprise <ArrowRight size={17} /></>
                            }
                        </button>
                    </form>
                </motion.div>

                {employer?.verificationStatus === 'VERIFIED' && (
                    <div className="mt-6 text-center">
                        <Link
                            href="/dashboard/recruiter/jobs/new"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#14B53A] hover:text-[#12a133] transition"
                        >
                            Publier une offre d'emploi <ArrowRight size={15} />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
