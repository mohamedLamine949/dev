'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion, Variants } from 'framer-motion';
import { Briefcase, MapPin, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, MessageSquare, ChevronRight, Inbox } from 'lucide-react';

interface Application {
    id: string; status: string; coverLetter?: string; createdAt: string;
    job: { id: string; title: string; type: string; sector: string; regions: string; deadline: string; status: string; employer: { name: string; isVerified: boolean } };
    messages: { id: string; content: string; createdAt: string }[];
}

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    SENT: { label: 'Envoyée', dot: 'bg-gray-400', bg: 'bg-gray-500/10', text: 'text-gray-400' },
    REVIEWED: { label: 'Consultée', dot: 'bg-[#FCD116]', bg: 'bg-[#FCD116]/10', text: 'text-[#FCD116]' },
    SHORTLISTED: { label: 'Présélectionné(e)', dot: 'bg-blue-400', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    INTERVIEW: { label: 'Entretien', dot: 'bg-purple-400', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    ACCEPTED: { label: 'Acceptée 🎉', dot: 'bg-[#14B53A]', bg: 'bg-[#14B53A]/10', text: 'text-[#14B53A]' },
    REJECTED: { label: 'Non retenue', dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
};

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

const pillCls = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium border transition ${active
        ? 'border-white/40 text-white bg-white/10'
        : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'}`;

const NavBar = () => (
    <>
        <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
            <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
        </div>
        <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
                <span className="text-white font-bold tracking-tight">MaliTravail</span>
                <span className="text-[11px] text-[#FCD116]/70 border border-[#FCD116]/25 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
        </nav>
    </>
);

export default function MyApplicationsPage() {
    const { user, token } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        if (!token) return;
        const params = new URLSearchParams();
        if (filter) params.set('status', filter);
        fetch(`${API}/applications/mine?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { setApplications(data.applications || []); setTotal(data.total || 0); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [token, filter, API]);

    if (!user) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <Link href="/login" className="text-white underline">Se connecter</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <NavBar />
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Mes candidatures</h1>
                        <p className="text-gray-500 text-sm mt-1">{total} candidature{total !== 1 ? 's' : ''}</p>
                    </div>
                    <Link href="/jobs" className="text-sm bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition">Parcourir les offres</Link>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button onClick={() => setFilter('')} className={pillCls(!filter)}>Toutes</button>
                    {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                        <button key={key} onClick={() => setFilter(key)} className={pillCls(filter === key)}>{label}</button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#14B53A]/20 border-t-[#14B53A] rounded-full animate-spin" /></div>
                ) : applications.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-12 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Inbox size={40} className="text-gray-500" />
                        </div>
                        <p className="text-xl font-bold text-white tracking-tight mb-2">Aucune candidature</p>
                        <p className="text-gray-500 text-sm max-w-sm mb-8">Vous n&apos;avez pas encore postulé à une offre. Parcourez nos annonces et trouvez votre prochain défi !</p>
                        <Link href="/jobs" className="text-sm bg-[#14B53A] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#12a133] transition-all shadow-[0_0_20px_rgba(20,181,58,0.2)] hover:shadow-[0_0_25px_rgba(20,181,58,0.3)]">Parcourir les offres</Link>
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                        {applications.map(app => {
                            const st = STATUS_MAP[app.status] || STATUS_MAP.SENT;
                            const regions = (() => { try { return JSON.parse(app.job.regions).slice(0, 2); } catch { return [app.job.regions]; } })();

                            return (
                                <motion.div variants={itemVariants} key={app.id}>
                                    <Link href={`/dashboard/applications/${app.id}`}
                                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl glass-card glass-card-hover transition-all">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-white font-semibold text-lg truncate tracking-tight">{app.job.title}</h3>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${st.bg} ${st.text} border border-white/5 whitespace-nowrap`}>
                                                    {st.label}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                                                <div className="flex items-center gap-1.5"><Briefcase size={14} className="text-[#FCD116]" /> {app.job.employer.name}{app.job.employer.isVerified && <CheckCircle2 size={12} className="text-[#14B53A]" />}</div>
                                                <div className="flex items-center gap-1.5"><MapPin size={14} className="text-[#CE1126]" /> {regions.join(', ')}{regions.length < (() => { try { return JSON.parse(app.job.regions).length; } catch { return 1; } })() ? '...' : ''}</div>
                                                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-500" /> Postulé le {new Date(app.createdAt).toLocaleDateString('fr-FR')}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-3 shrink-0 pt-4 sm:pt-0 border-t border-white/5 sm:border-0 w-full sm:w-auto mt-2 sm:mt-0">
                                            <div className="flex flex-col items-start sm:items-end gap-1.5">
                                                {app.messages.length > 0 && <span className="flex items-center gap-1.5 text-xs font-semibold text-[#14B53A] bg-[#14B53A]/10 px-2.5 py-1 rounded-lg border border-[#14B53A]/20">
                                                    <MessageSquare size={12} /> {app.messages.length} message{app.messages.length > 1 ? 's' : ''}
                                                </span>}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium group-hover:text-white transition-colors">
                                                <span>Détails</span>
                                                <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
