'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { employerApi } from '@/lib/api';
import { motion, Variants } from 'framer-motion';
import { Building2, Building, ShieldCheck, AlertCircle, CheckCircle2, Factory, FileText, ArrowRight } from 'lucide-react';

const CATEGORIES = ['Grande Entreprise', 'PME / PMI', 'Startup', 'Administration Publique', 'ONG / Association', 'Cabinet de Recrutement', 'Institution Internationale'];

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#14B53A]/50 focus:border-[#14B53A]/50 transition-all shadow-inner";
const selectCls = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#14B53A]/50 focus:border-[#14B53A]/50 transition-all shadow-inner";
const labelCls = "block text-xs font-semibold text-gray-400 mb-2 tracking-wide uppercase";

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function RegisterEmployerPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ name: '', category: '', description: '', nif: '', rccm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [existingEmployers, setExistingEmployers] = useState<{ id: string; name: string; verificationStatus?: string; isVerified?: boolean; logoS3Key?: string }[]>([]);

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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, employerId: string) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        setUploadingLogo(true);
        try {
            await employerApi.uploadLogo(token!, file);
            // Refresh list
            const updated = await employerApi.getMyEmployers(token!);
            setExistingEmployers(updated);
        } catch (err: any) {
            alert(err.message || 'Erreur lors de l\'upload du logo');
        } finally {
            setUploadingLogo(false);
        }
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
                <div className="mb-8 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-[#14B53A]/10 text-[#14B53A] border border-[#14B53A]/20">
                        <Building2 size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Enregistrer votre entreprise</h1>
                        <p className="text-gray-400 text-sm mt-1">Créez votre profil structure pour publier des offres.</p>
                    </div>
                </div>

                {existingEmployers.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-5 rounded-2xl border border-white/[0.07] glass-card flex items-start gap-4">
                        <div className="p-2 rounded-xl bg-white/5 text-white"><Factory size={20} /></div>
                        <div>
                            <p className="text-sm text-gray-300 font-medium">Structure(s) existante(s) :</p>
                            <div className="mt-2 space-y-2">
                                {existingEmployers.map((emp, i) => (
                                    <div key={i} className="flex flex-wrap items-center gap-2">
                                        <span className="text-white font-bold">{emp.name}</span>
                                        {emp.verificationStatus === 'PENDING' && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider border border-[#FCD116]/30 text-[#FCD116] px-2 py-0.5 rounded-full"><AlertCircle size={10} /> En attente</span>
                                        )}
                                        {emp.isVerified && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider border border-[#14B53A]/30 text-[#14B53A] px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Vérifié</span>
                                        )}
                                        <label className="ml-auto cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-full hover:bg-white/10 transition-all">
                                            {uploadingLogo ? 'Upload...' : emp.logoS3Key ? 'Changer le Logo' : 'Ajouter un Logo'}
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, emp.id)} disabled={uploadingLogo} />
                                        </label>
                                        {emp.logoS3Key && (
                                            <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/employers/${emp.id}/logo`} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-white/10 bg-white" onError={(e) => e.currentTarget.style.display = 'none'} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                <motion.div variants={containerVariants} initial="hidden" animate="show" className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none scale-150 -translate-y-1/2 translate-x-1/2">
                        <Building size={200} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <motion.div variants={itemVariants}>
                            <label className={labelCls}>Nom de l&apos;entreprise <span className="text-[#CE1126]">*</span></label>
                            <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="Ex: Sotelma-Malitel, Orange Mali..." />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className={labelCls}>Type de structure <span className="text-[#CE1126]">*</span></label>
                            <select required value={form.category} onChange={set('category')} className={selectCls}>
                                <option value="">Sélectionner...</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </motion.div>

                        {/* Legal IDs */}
                        <motion.div variants={itemVariants} className="rounded-2xl border border-[#FCD116]/20 bg-[#FCD116]/[0.03] p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                <span className="text-sm font-bold text-[#FCD116] flex items-center gap-2"><ShieldCheck size={16} /> Identifiants légaux</span>
                                <span className="text-xs text-gray-500 font-medium">Recommandé pour la vérification</span>
                            </div>
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
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className={labelCls}>Description <span className="text-gray-600 font-normal lowercase">(optionnel)</span></label>
                            <textarea value={form.description} onChange={set('description')} rows={4}
                                className={inputCls + " resize-y"} placeholder="Présentez brièvement votre structure, vos missions..." />
                        </motion.div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border border-red-500/20 bg-red-500/10 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" /> {error}
                            </motion.div>
                        )}

                        <motion.button variants={itemVariants} type="submit" disabled={loading}
                            className="w-full bg-[#14B53A] text-white font-bold py-4 rounded-xl hover:bg-[#12a133] disabled:opacity-50 transition-all transform active:scale-[0.99] shadow-[0_0_20px_rgba(20,181,58,0.2)] hover:shadow-[0_0_25px_rgba(20,181,58,0.3)] flex items-center justify-center gap-2 mt-4">
                            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Enregistrer l'entreprise <ArrowRight size={18} /></>}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
