'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion, Variants } from 'framer-motion';
import { Briefcase, MapPin, GraduationCap, AlignLeft, FileText, DollarSign, Globe2, PlusCircle, CheckCircle2 } from 'lucide-react';

const SECTORS = ['Agriculture', 'Banque / Finance', 'BTP', 'Commerce', 'Education', 'Energie', 'IT / Télécoms', 'Mines', 'ONG / International', 'Santé', 'Sécurité / Défense', 'Transport / Logistique'];
const JOB_TYPES = [
    { value: 'CDI', label: 'CDI' }, { value: 'CDD', label: 'CDD' }, { value: 'STAGE', label: 'Stage' },
    { value: 'CONCOURS', label: 'Concours de la fonction publique' }, { value: 'VOLONTARIAT', label: 'Volontariat' }, { value: 'APPRENTISSAGE', label: 'Apprentissage' },
];
const REGIONS = ['Bamako', 'Gao', 'Kayes', 'Kidal', 'Koulikoro', 'Mopti', 'Ségou', 'Sikasso', 'Taoudénit', 'Ménaka', 'Tombouctou'];
const EDU_LEVELS = ['Aucun diplôme', 'BEPC', 'BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'Doctorat', 'Formation professionnelle'];
const EXP_LEVELS = [{ value: 'NONE', label: 'Aucune' }, { value: '1_2', label: '1 à 2 ans' }, { value: '3_5', label: '3 à 5 ans' }, { value: 'PLUS_5', label: 'Plus de 5 ans' }];
const DOC_CATEGORIES = [
    { key: 'CV', label: 'CV / Curriculum Vitae' },
    { key: 'DIPLOME', label: 'Diplôme(s)' },
    { key: 'ACTE_NAISSANCE', label: 'Acte de naissance' },
    { key: 'CERTIFICAT_NATIONALITE', label: 'Certificat de nationalité' },
    { key: 'CASIER_JUDICIAIRE', label: 'Casier judiciaire' },
    { key: 'PASSEPORT', label: 'Passeport' },
    { key: 'CARTE_NINA', label: 'Carte NINA / Biométrique' },
];

interface ReqDoc { category: string; label: string; isOptional: boolean; }

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#14B53A]/50 focus:border-[#14B53A]/50 transition-all shadow-inner";
const selectCls = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#14B53A]/50 focus:border-[#14B53A]/50 transition-all shadow-inner";
const labelCls = "block text-xs font-semibold text-gray-400 mb-2 tracking-wide uppercase";

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function NewJobPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        title: '', type: 'CDI', sector: '', experienceLevel: 'NONE',
        description: '', requirements: '', deadline: '',
        salaryMin: '', salaryMax: '', isDiasporaOpen: false, isRemoteAbroad: false, relocationAid: '',
    });
    const [regions, setRegions] = useState<string[]>([]);
    const [eduLevels, setEduLevels] = useState<string[]>([]);
    const [reqDocs, setReqDocs] = useState<ReqDoc[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [hasEmployer, setHasEmployer] = useState<boolean | null>(null);

    const toggleReqDoc = (catKey: string, catLabel: string) => {
        setReqDocs(prev => {
            const existing = prev.find(d => d.category === catKey);
            if (existing) return prev.filter(d => d.category !== catKey);
            return [...prev, { category: catKey, label: catLabel, isOptional: false }];
        });
    };
    const toggleOptional = (catKey: string) => {
        setReqDocs(prev => prev.map(d => d.category === catKey ? { ...d, isOptional: !d.isOptional } : d));
    };
    const isDocSelected = (catKey: string) => reqDocs.some(d => d.category === catKey);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        if (token) {
            fetch(`${API}/employers/me`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => { setHasEmployer(data && data.length > 0); setLoading(false); })
                .catch(() => setLoading(false));
        }
    }, [token, API]);

    if (!user || (user.role !== 'RECRUITER' && user.role !== 'ADMIN')) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-white text-sm mb-4">Accès réservé aux recruteurs</p>
                    <Link href="/dashboard" className="text-white underline text-sm">Retour</Link>
                </div>
            </div>
        );
    }

    const toggle = (arr: string[], setArr: (a: string[]) => void, val: string) => {
        setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.sector || !form.description || !form.deadline || regions.length === 0) {
            setError('Veuillez remplir tous les champs obligatoires (y compris au moins une région)'); return;
        }
        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API}/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...form, regions, educationLevel: eduLevels,
                    requiredDocs: reqDocs.map(d => ({ documentCategory: d.category, label: d.label, isOptional: d.isOptional })),
                    salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
                    salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Erreur lors de la création");
            // Publish immediately
            await fetch(`${API}/jobs/${data.id}/publish`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
            router.push(`/jobs/${data.id}`);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erreur inconnue'); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>;

    if (hasEmployer === false) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white/[0.02] border border-white/[0.07] rounded-3xl p-8 text-center backdrop-blur-md">
                    <div className="font-medium text-4xl mb-4 text-white">🏢</div>
                    <h1 className="text-xl font-bold text-white mb-2">Entreprise requise</h1>
                    <p className="text-gray-500 text-sm mb-8">Vous devez enregistrer votre entreprise avant de pouvoir publier une offre.</p>
                    <Link href="/dashboard/recruiter/employer" className="block w-full bg-white text-black font-semibold py-3 rounded-xl transition hover:bg-gray-100">
                        Enregistrer mon entreprise
                    </Link>
                    <Link href="/dashboard" className="block mt-4 text-xs text-gray-500 hover:text-white transition">Plus tard</Link>
                </div>
            </div>
        );
    }

    const cardCls = "bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 space-y-4";
    const sectionTitle = "text-white font-semibold text-sm mb-1";

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Mali Bar */}
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
            </div>
            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliLink</span>
                </Link>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
            </nav>

            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="mb-8 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-[#14B53A]/10 text-[#14B53A] border border-[#14B53A]/20">
                        <PlusCircle size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Publier une offre d&apos;emploi</h1>
                        <p className="text-sm text-gray-400 mt-1">Attirez les meilleurs talents en détaillant votre besoin.</p>
                    </div>
                </div>

                <motion.form variants={containerVariants} initial="hidden" animate="show" onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic info */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none scale-150 -translate-y-1/2 translate-x-1/2">
                            <Briefcase size={200} />
                        </div>
                        <h2 className="text-white font-bold text-lg flex items-center gap-2 pb-2 border-b border-white/5"><Briefcase size={18} className="text-[#14B53A]" /> Informations générales</h2>
                        <div className="space-y-5 relative z-10">
                            <div>
                                <label className={labelCls}>Intitulé du poste <span className="text-[#CE1126]">*</span></label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className={inputCls} placeholder="Ex: Développeur Fullstack..." />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Type de contrat <span className="text-[#CE1126]">*</span></label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={selectCls}>
                                        {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Secteur d&apos;activité <span className="text-[#CE1126]">*</span></label>
                                    <select value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} required className={selectCls}>
                                        <option value="">Choisir...</option>
                                        {SECTORS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Régions <span className="text-[#CE1126]">*</span></label>
                                <div className="flex flex-wrap gap-2">
                                    {REGIONS.map(r => (
                                        <button type="button" key={r} onClick={() => toggle(regions, setRegions, r)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${regions.includes(r) ? 'bg-[#14B53A]/10 text-[#14B53A] border-[#14B53A]/30 shadow-[0_0_10px_rgba(20,181,58,0.1)]' : 'border-white/10 text-gray-400 bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                                            <span className="flex items-center gap-1.5">{r} {regions.includes(r) && <CheckCircle2 size={12} />}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Expérience requise</label>
                                    <select value={form.experienceLevel} onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))} className={selectCls}>
                                        {EXP_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Date limite <span className="text-[#CE1126]">*</span></label>
                                    <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} required min={new Date().toISOString().split('T')[0]} className={inputCls} />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Education levels */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none scale-150 -translate-y-1/2 translate-x-1/2">
                            <GraduationCap size={200} />
                        </div>
                        <h2 className="text-white font-bold text-lg flex items-center gap-2 pb-2 border-b border-white/5"><GraduationCap size={18} className="text-[#FCD116]" /> Niveau d&apos;études requis</h2>
                        <div className="flex flex-wrap gap-2 relative z-10">
                            {EDU_LEVELS.map(l => (
                                <button type="button" key={l} onClick={() => toggle(eduLevels, setEduLevels, l)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${eduLevels.includes(l) ? 'bg-[#FCD116]/10 text-[#FCD116] border-[#FCD116]/30 shadow-[0_0_10px_rgba(252,209,22,0.1)]' : 'border-white/10 text-gray-400 bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                                    <span className="flex items-center gap-1.5">{l} {eduLevels.includes(l) && <CheckCircle2 size={12} />}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Content */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
                        <h2 className="text-white font-bold text-lg flex items-center gap-2 pb-2 border-b border-white/5"><AlignLeft size={18} className="text-gray-300" /> Description & Profil</h2>
                        <div className="space-y-5">
                            <div>
                                <label className={labelCls}>Description du poste <span className="text-[#CE1126]">*</span></label>
                                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required rows={5} className={inputCls + " resize-y"} placeholder="Missions, contexte... (min 100 char)" />
                            </div>
                            <div>
                                <label className={labelCls}>Profil recherché</label>
                                <textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} rows={4} className={inputCls + " resize-y"} placeholder="Compétences, qualités attendues..." />
                            </div>
                        </div>
                    </motion.div>

                    {/* Documents */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 md:p-8">
                        <div className="mb-4">
                            <h2 className="text-white font-bold text-lg flex items-center gap-2"><FileText size={18} className="text-blue-400" /> Documents requis</h2>
                            <p className="text-xs text-gray-500 mt-1">Sélectionnez les documents à fournir. Cochez "Optionnel" si non-bloquant.</p>
                        </div>
                        <div className="space-y-2 mt-4 bg-black/20 rounded-xl p-2 border border-white/5">
                            {DOC_CATEGORIES.map(cat => {
                                const selected = isDocSelected(cat.key);
                                const doc = reqDocs.find(d => d.category === cat.key);
                                return (
                                    <div key={cat.key} className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${selected ? 'border-blue-500/20 bg-blue-500/10' : 'border-transparent hover:bg-white/[0.02]'}`}>
                                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                                            <input type="checkbox" checked={selected} onChange={() => toggleReqDoc(cat.key, cat.label)} className="accent-blue-500 w-4 h-4 rounded" />
                                            <span className={`text-sm font-medium ${selected ? 'text-blue-100' : 'text-gray-400'}`}>{cat.label}</span>
                                        </label>
                                        {selected && (
                                            <label className="flex items-center gap-2 cursor-pointer shrink-0 ml-4 py-1 px-3 rounded-full bg-black/40 border border-white/5">
                                                <input type="checkbox" checked={doc?.isOptional ?? false} onChange={() => toggleOptional(cat.key)} className="accent-gray-500 w-3 h-3" />
                                                <span className="text-xs font-semibold text-gray-400">Optionnel</span>
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {reqDocs.length > 0 && (
                            <p className="text-xs text-gray-400 mt-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" /> {reqDocs.filter(d => !d.isOptional).length} obligatoire(s)
                                <span className="w-2 h-2 rounded-full bg-gray-500 ml-3" /> {reqDocs.filter(d => d.isOptional).length} optionnel(s)
                            </p>
                        )}
                    </motion.div>

                    {/* Salary */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
                        <h2 className="text-white font-bold text-lg flex items-center gap-2 pb-2 border-b border-white/5"><DollarSign size={18} className="text-[#14B53A]" /> Rémunération <span className="text-gray-500 font-normal text-sm ml-1">(optionnelle)</span></h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className={labelCls}>Salaire min (FCFA)</label>
                                <input type="number" value={form.salaryMin} onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))} className={inputCls} placeholder="150000" />
                            </div>
                            <div>
                                <label className={labelCls}>Salaire max (FCFA)</label>
                                <input type="number" value={form.salaryMax} onChange={e => setForm(p => ({ ...p, salaryMax: e.target.value }))} className={inputCls} placeholder="300000" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Diaspora */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
                        <h2 className="text-white font-bold text-lg flex items-center gap-2 pb-2 border-b border-white/5"><Globe2 size={18} className="text-[#CE1126]" /> Options Diaspora</h2>

                        <div className="space-y-4">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded border transition-colors ${form.isDiasporaOpen ? 'bg-[#14B53A] border-[#14B53A]' : 'border-white/20 group-hover:border-white/40'}`}>
                                    {form.isDiasporaOpen && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                                <input type="checkbox" checked={form.isDiasporaOpen} onChange={e => setForm(p => ({ ...p, isDiasporaOpen: e.target.checked }))} className="hidden" />
                                <div>
                                    <span className="text-sm font-medium text-gray-200">Ouvert aux candidats de la diaspora</span>
                                    <p className="text-xs text-gray-500 mt-1">Mise en évidence dans la catégorie "Opportunités Retour"</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded border transition-colors ${form.isRemoteAbroad ? 'bg-[#14B53A] border-[#14B53A]' : 'border-white/20 group-hover:border-white/40'}`}>
                                    {form.isRemoteAbroad && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                                <input type="checkbox" checked={form.isRemoteAbroad} onChange={e => setForm(p => ({ ...p, isRemoteAbroad: e.target.checked }))} className="hidden" />
                                <div>
                                    <span className="text-sm font-medium text-gray-200">Télétravail international accepté</span>
                                </div>
                            </label>
                        </div>

                        {(form.isDiasporaOpen || form.isRemoteAbroad) && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-white/5">
                                <label className={labelCls}>Aide à la relocalisation proposée</label>
                                <input value={form.relocationAid} onChange={e => setForm(p => ({ ...p, relocationAid: e.target.value }))} className={inputCls} placeholder="Ex: logement 3 mois, billet d'avion..." />
                            </motion.div>
                        )}
                    </motion.div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 border border-red-500/20 bg-red-500/10 rounded-xl text-center">
                            <p className="text-sm text-red-400 font-medium">{error}</p>
                        </motion.div>
                    )}

                    <motion.div variants={itemVariants} className="pt-4">
                        <button type="submit" disabled={loading}
                            className="w-full bg-[#14B53A] text-white font-bold py-4 rounded-xl hover:bg-[#12a133] disabled:opacity-50 transition-all transform active:scale-[0.99] shadow-[0_0_20px_rgba(20,181,58,0.2)] hover:shadow-[0_0_25px_rgba(20,181,58,0.3)] flex justify-center items-center gap-2">
                            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><PlusCircle size={20} /> Publier l'offre</>}
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-4">L'offre sera publiée immédiatement et visible par les candidats.</p>
                    </motion.div>
                </motion.form>
            </div>
        </div>
    );
}
