'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion, Variants } from 'framer-motion';
import { Search, MapPin, Building, Activity, CalendarDays, ExternalLink } from 'lucide-react';

const SECTORS = ['Agriculture', 'Banque / Finance', 'BTP', 'Commerce', 'Education', 'Energie', 'IT / Télécoms', 'Mines', 'ONG / International', 'Santé', 'Sécurité / Défense', 'Transport / Logistique'];
const JOB_TYPES = ['CDI', 'CDD', 'STAGE', 'CONCOURS', 'VOLONTARIAT', 'APPRENTISSAGE'];
const REGIONS = ['Bamako', 'Gao', 'Kayes', 'Kidal', 'Koulikoro', 'Mopti', 'Ségou', 'Sikasso', 'Taoudénit', 'Ménaka', 'Tombouctou'];

interface Job {
    id: string;
    title: string;
    type: string;
    sector: string;
    regions: string;
    salaryMin?: number;
    salaryMax?: number;
    deadline: string;
    publishedAt: string;
    isDiasporaOpen: boolean;
    applicationCount: number;
    employer: { name: string; logoS3Key?: string; isVerified: boolean };
}

function formatDeadline(deadline: string) {
    const d = new Date(deadline);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return { label: 'Clôturé', urgent: false };
    if (diff === 1) return { label: 'Demain !', urgent: true };
    if (diff <= 7) return { label: `J-${diff}`, urgent: true };
    return { label: `J-${diff}`, urgent: false };
}

const typeColors: Record<string, string> = {
    CDI: 'text-white border-white/20', CDD: 'text-gray-300 border-white/10',
    STAGE: 'text-gray-300 border-white/10', CONCOURS: 'text-[#FCD116] border-[#FCD116]/20',
    VOLONTARIAT: 'text-gray-300 border-white/10', APPRENTISSAGE: 'text-gray-300 border-white/10',
};

const typeLabels: Record<string, string> = {
    CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', CONCOURS: 'Concours', VOLONTARIAT: 'Volontariat', APPRENTISSAGE: 'Apprentissage'
};

const selectCls = "bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function JobsPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ q: '', sector: '', type: '', region: '', diaspora: '' });

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (filters.q) params.set('q', filters.q);
        if (filters.sector) params.set('sector', filters.sector);
        if (filters.type) params.set('type', filters.type);
        if (filters.region) params.set('region', filters.region);
        if (filters.diaspora) params.set('diaspora', filters.diaspora);
        if (user) params.set('userId', user.id);
        
        try {
            const res = await fetch(`${API}/jobs?${params}`);
            const data = await res.json();
            setJobs(data.jobs || []);
            setTotal(data.total || 0);
        } catch { setJobs([]); }
        setLoading(false);
    }, [API, page, filters, user]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const updateFilter = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Mali bar */}
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" />
                <div className="flex-1 bg-[#FCD116]" />
                <div className="flex-1 bg-[#CE1126]" />
            </div>

            {/* Nav */}
            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliLink</span>
                    <span className="text-[11px] text-[#FCD116]/70 border border-[#FCD116]/25 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
                </Link>
                <div className="flex gap-2">
                    {user ? (
                        <Link href="/dashboard" className="text-sm bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                            Mon espace
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg transition">Connexion</Link>
                            <Link href="/register" className="text-sm bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition">Créer un compte</Link>
                        </>
                    )}
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 py-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Offres d&apos;emploi</h1>
                    <p className="text-gray-500 text-sm">{total} offre{total !== 1 ? 's' : ''} publiée{total !== 1 ? 's' : ''} au Mali</p>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-3 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                    <input
                        type="text" placeholder="Rechercher..."
                        value={filters.q} onChange={e => updateFilter('q', e.target.value)}
                        className="flex-1 min-w-48 bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                    />
                    <select value={filters.sector} onChange={e => updateFilter('sector', e.target.value)} className={selectCls}>
                        <option value="">Tous secteurs</option>
                        {SECTORS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select value={filters.type} onChange={e => updateFilter('type', e.target.value)} className={selectCls}>
                        <option value="">Tous types</option>
                        {JOB_TYPES.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
                    </select>
                    <select value={filters.region} onChange={e => updateFilter('region', e.target.value)} className={selectCls}>
                        <option value="">Toutes régions</option>
                        {REGIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={filters.diaspora === 'true'} onChange={e => updateFilter('diaspora', e.target.checked ? 'true' : '')}
                            className="w-4 h-4 accent-white" />
                        Diaspora
                    </label>
                </div>

                {/* Jobs list */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-4xl mb-4">🔍</p>
                        <p className="text-white font-medium">Aucune offre trouvée</p>
                        <p className="text-gray-500 text-sm mt-2">Essayez d&apos;ajuster vos filtres</p>
                    </div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                        {jobs.map(job => {
                            const dl = formatDeadline(job.deadline);
                            const regions = (() => { try { return JSON.parse(job.regions); } catch { return [job.regions]; } })();
                            return (
                                <motion.div key={job.id} variants={itemVariants}>
                                    <Link href={`/jobs/${job.id}`}
                                        className="group glass-card glass-card-hover flex items-start justify-between gap-4 px-6 py-5 block rounded-2xl">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`text-[11px] font-semibold border rounded-full px-2.5 py-0.5 ${typeColors[job.type] || 'text-gray-300 border-white/10'}`}>
                                                    {typeLabels[job.type] || job.type}
                                                </span>
                                                {job.isDiasporaOpen && <span className="text-[11px] text-gray-400 border border-white/10 rounded-full px-2.5 py-0.5">🌍 Diaspora</span>}
                                                {dl.urgent && <span className="text-[11px] text-red-400 border border-red-500/20 rounded-full px-2.5 py-0.5 animate-pulse">{dl.label}</span>}
                                            </div>
                                            <h2 className="text-lg font-semibold text-white group-hover:text-[#14B53A] transition-colors truncate">{job.title}</h2>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mt-2">
                                                <span className="flex items-center gap-1.5"><Building size={14} className="text-gray-400" /> {job.employer.name}{job.employer.isVerified && <span className="text-[#14B53A]">✓</span>}</span>
                                                <span className="flex items-center gap-1.5"><Activity size={14} className="text-gray-400" /> {job.sector}</span>
                                                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> {regions.join(', ')}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 flex flex-col justify-between items-end h-[88px]">
                                            <div className="p-2 rounded-full border border-white/10 text-gray-400 group-hover:text-white group-hover:border-white/30 group-hover:bg-white/5 transition-all">
                                                <ExternalLink size={16} />
                                            </div>
                                            <div className="text-right">
                                                {(job.salaryMin || job.salaryMax) && (
                                                    <p className="text-white text-sm font-medium mb-1">
                                                        {job.salaryMin?.toLocaleString()} – {job.salaryMax?.toLocaleString()} FCFA
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-600 flex items-center justify-end gap-1"><CalendarDays size={12} /> Expir. : {new Date(job.deadline).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}


                {/* Pagination */}
                {
                    total > 20 && (
                        <div className="flex justify-center items-center gap-4 mt-10">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 rounded-lg border border-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/[0.05] transition">
                                ← Précédent
                            </button>
                            <span className="text-gray-500 text-sm">Page {page} / {Math.ceil(total / 20)}</span>
                            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 rounded-lg border border-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/[0.05] transition">
                                Suivant →
                            </button>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
