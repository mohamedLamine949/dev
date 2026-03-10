'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

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

const inputCls = "w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition";
const selectCls = "w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition";
const labelCls = "block text-xs font-medium text-gray-400 mb-1.5";

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

            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Publier une offre d&apos;emploi</h1>
                    <p className="text-sm text-gray-500 mt-1">Remplissez les détails pour attirer les meilleurs talents.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic info */}
                    <div className={cardCls}>
                        <h2 className={sectionTitle}>Informations générales</h2>
                        <div>
                            <label className={labelCls}>Intitulé du poste <span className="text-white/30">*</span></label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className={inputCls} placeholder="Ex: Développeur Fullstack..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Type de contrat <span className="text-white/30">*</span></label>
                                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={selectCls}>
                                    {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Secteur d&apos;activité <span className="text-white/30">*</span></label>
                                <select value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} required className={selectCls}>
                                    <option value="">Choisir...</option>
                                    {SECTORS.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Régions <span className="text-white/30">*</span></label>
                            <div className="flex flex-wrap gap-2">
                                {REGIONS.map(r => (
                                    <button type="button" key={r} onClick={() => toggle(regions, setRegions, r)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${regions.includes(r) ? 'bg-white text-black border-transparent' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                                        {r} {regions.includes(r) && '✓'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Expérience requise</label>
                                <select value={form.experienceLevel} onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))} className={selectCls}>
                                    {EXP_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Date limite <span className="text-white/30">*</span></label>
                                <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} required min={new Date().toISOString().split('T')[0]} className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* Education levels */}
                    <div className={cardCls}>
                        <h2 className={sectionTitle}>Niveau d&apos;études requis</h2>
                        <div className="flex flex-wrap gap-2">
                            {EDU_LEVELS.map(l => (
                                <button type="button" key={l} onClick={() => toggle(eduLevels, setEduLevels, l)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${eduLevels.includes(l) ? 'bg-white text-black border-transparent' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                                    {l} {eduLevels.includes(l) && '✓'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className={cardCls}>
                        <h2 className={sectionTitle}>Description</h2>
                        <div>
                            <label className={labelCls}>Description du poste <span className="text-white/30">*</span></label>
                            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required rows={5} className={inputCls + " resize-y"} placeholder="Missions, contexte... (min 100 char)" />
                        </div>
                        <div>
                            <label className={labelCls}>Profil recherché</label>
                            <textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} rows={4} className={inputCls + " resize-y"} placeholder="Compétences, qualités attendues..." />
                        </div>
                    </div>

                    {/* Documents */}
                    <div className={cardCls}>
                        <div>
                            <h2 className={sectionTitle}>Documents requis</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Séléctionnez les documents à fournir. Cochez "Optionnel" si non-bloquant.</p>
                        </div>
                        <div className="space-y-2 mt-3">
                            {DOC_CATEGORIES.map(cat => {
                                const selected = isDocSelected(cat.key);
                                const doc = reqDocs.find(d => d.category === cat.key);
                                return (
                                    <div key={cat.key} className={`flex items-center justify-between p-3 rounded-xl border transition ${selected ? 'border-white/20 bg-white/[0.03]' : 'border-white/[0.04] hover:bg-white/[0.02]'}`}>
                                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                                            <input type="checkbox" checked={selected} onChange={() => toggleReqDoc(cat.key, cat.label)} className="accent-white w-4 h-4" />
                                            <span className="text-sm text-gray-300">{cat.label}</span>
                                        </label>
                                        {selected && (
                                            <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                                <input type="checkbox" checked={doc?.isOptional ?? false} onChange={() => toggleOptional(cat.key)} className="accent-white/50 w-3.5 h-3.5" />
                                                <span className="text-xs text-gray-500">Optionnel</span>
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {reqDocs.length > 0 && (
                            <p className="text-xs text-gray-400 pt-2 border-t border-white/[0.05]">
                                {reqDocs.filter(d => !d.isOptional).length} obligatoire(s), {reqDocs.filter(d => d.isOptional).length} optionnel(s)
                            </p>
                        )}
                    </div>

                    {/* Salary */}
                    <div className={cardCls}>
                        <h2 className={sectionTitle}>Rémunération <span className="text-gray-500 font-normal ml-1">(optionnelle)</span></h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Salaire min (FCFA)</label>
                                <input type="number" value={form.salaryMin} onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))} className={inputCls} placeholder="150000" />
                            </div>
                            <div>
                                <label className={labelCls}>Salaire max (FCFA)</label>
                                <input type="number" value={form.salaryMax} onChange={e => setForm(p => ({ ...p, salaryMax: e.target.value }))} className={inputCls} placeholder="300000" />
                            </div>
                        </div>
                    </div>

                    {/* Diaspora */}
                    <div className={cardCls}>
                        <h2 className={sectionTitle}>Options Diaspora</h2>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked={form.isDiasporaOpen} onChange={e => setForm(p => ({ ...p, isDiasporaOpen: e.target.checked }))} className="accent-white w-4 h-4 mt-0.5" />
                            <div>
                                <span className="text-sm text-gray-200">Ouvert aux candidats diaspora</span>
                                <p className="text-xs text-gray-500 mt-0.5">Mise en avant dans "Opportunités Retour"</p>
                            </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer mt-3">
                            <input type="checkbox" checked={form.isRemoteAbroad} onChange={e => setForm(p => ({ ...p, isRemoteAbroad: e.target.checked }))} className="accent-white w-4 h-4 mt-0.5" />
                            <div>
                                <span className="text-sm text-gray-200">Télétravail international accepté</span>
                            </div>
                        </label>
                        {(form.isDiasporaOpen || form.isRemoteAbroad) && (
                            <div className="mt-4 pt-4 border-t border-white/[0.05]">
                                <label className={labelCls}>Aide à la relocalisation proposée</label>
                                <input value={form.relocationAid} onChange={e => setForm(p => ({ ...p, relocationAid: e.target.value }))} className={inputCls} placeholder="Ex: logement 3 mois, billet..." />
                            </div>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-400 p-4 border border-red-500/20 bg-red-500/10 rounded-xl">{error}</p>}

                    <button type="submit" disabled={loading}
                        className="w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition transform active:scale-[0.99] border border-white">
                        {loading ? 'Publication...' : 'Publier l\'offre'}
                    </button>
                    <p className="text-center text-xs text-gray-600 mt-2">L'offre sera publiée immédiatement sur la plateforme.</p>
                </form>
            </div>
        </div>
    );
}
