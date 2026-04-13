'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import { motion, Variants } from 'framer-motion';
import { Phone, Mail, Globe, Calendar, CheckCircle2, MessageSquare, Eye, Star, X, Check, Inbox, Briefcase } from 'lucide-react';

interface Job { id: string; title: string; }
interface RecruiterApp {
    id: string; status: string; createdAt: string;
    user: { id: string; firstName: string; lastName: string; phone: string; email?: string; country: string };
    messages: { id: string; content: string; createdAt: string }[];
}

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    SENT: { label: 'Nouvelle', dot: 'bg-gray-400', bg: 'bg-gray-500/10', text: 'text-gray-400' },
    REVIEWED: { label: 'Consultée', dot: 'bg-[#FCD116]', bg: 'bg-[#FCD116]/10', text: 'text-[#FCD116]' },
    SHORTLISTED: { label: 'Présélectionné', dot: 'bg-blue-400', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    INTERVIEW: { label: 'Entretien', dot: 'bg-purple-400', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    ACCEPTED: { label: 'Accepté', dot: 'bg-[#14B53A]', bg: 'bg-[#14B53A]/10', text: 'text-[#14B53A]' },
    REJECTED: { label: 'Refusé', dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
};

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

const actionBtnCls = "flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-all shadow-sm";

export default function RecruiterApplicationsPage() {
    const { user, token } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState('');
    const [applications, setApplications] = useState<RecruiterApp[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const headers: HeadersInit = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (!token) return;
        fetch(`${API}/jobs?limit=100`, { headers })
            .then(r => r.json()).then(data => { setJobs(data.jobs || []); }).catch(() => { });
    }, [token]); // eslint-disable-line

    useEffect(() => {
        if (!selectedJob || !token) return;
        setLoading(true);
        fetch(`${API}/jobs/${selectedJob}/applications`, { headers })
            .then(r => r.json()).then(data => { setApplications(data.applications || []); setTotal(data.total || 0); })
            .catch(() => { }).finally(() => setLoading(false));
    }, [selectedJob, token]); // eslint-disable-line

    const updateStatus = async (appId: string, status: string) => {
        await fetch(`${API}/applications/${appId}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
        if (selectedJob) {
            const res = await fetch(`${API}/jobs/${selectedJob}/applications`, { headers });
            const data = await res.json();
            setApplications(data.applications || []);
        }
    };

    if (!user || (user.role !== 'RECRUITER' && user.role !== 'ADMIN')) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <p className="text-white">Accès réservé aux recruteurs</p>
        </div>
    );

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
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-[#14B53A]/10 text-[#14B53A]">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Candidatures reçues</h1>
                        <p className="text-gray-400 text-sm">Gérez les postulants pour vos différentes annonces</p>
                    </div>
                </div>

                {/* Job selector */}
                <div className="mb-6 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-md">
                    <label className="block text-xs font-medium text-gray-400 mb-2">Sélectionnez une offre pour voir ses candidatures</label>
                    <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition shadow-inner">
                        <option value="">-- Choisir une offre --</option>
                        {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                </div>

                {!selectedJob ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-3xl p-12 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Inbox size={40} className="text-gray-500" />
                        </div>
                        <p className="text-xl font-bold text-white mb-2">Sélectionnez une offre ci-dessus</p>
                        <p className="text-gray-500 text-sm">Les candidatures reçues apparaîtront ici</p>
                    </motion.div>
                ) : loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#14B53A]/20 border-t-[#14B53A] rounded-full animate-spin" /></div>
                ) : applications.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-3xl p-12 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Inbox size={40} className="text-gray-500" />
                        </div>
                        <p className="text-xl font-bold text-white mb-2">Aucune candidature reçue</p>
                        <p className="text-gray-500 text-sm">Cette offre n&apos;a pas encore attiré de candidats.</p>
                    </motion.div>
                ) : (
                    <>
                        <p className="text-gray-400 text-sm mb-4 font-medium">{total} candidature{total !== 1 ? 's' : ''} trouvée{total !== 1 ? 's' : ''}</p>
                        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
                            {applications.map(app => {
                                const st = STATUS_MAP[app.status] || STATUS_MAP.SENT;
                                return (
                                    <motion.div variants={itemVariants} key={app.id} className="group rounded-2xl glass-card glass-card-hover p-6 flex flex-col relative overflow-hidden">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="min-w-0 pr-4">
                                                <h3 className="text-white font-bold text-lg mb-1 truncate">{app.user.firstName} {app.user.lastName}</h3>
                                                <div className="space-y-1.5 text-sm text-gray-400">
                                                    <div className="flex items-center gap-2"><Phone size={14} className="text-[#FCD116]" /> <span className="truncate">{app.user.phone}</span></div>
                                                    {app.user.email && <div className="flex items-center gap-2"><Mail size={14} className="text-[#CE1126]" /> <span className="truncate">{app.user.email}</span></div>}
                                                    <div className="flex items-center gap-2"><Globe size={14} className="text-[#14B53A]" /> <span className="truncate">{app.user.country}</span></div>
                                                    <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-500" /> <span className="text-xs">Postulé le {new Date(app.createdAt).toLocaleDateString('fr-FR')}</span></div>
                                                </div>
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${st.bg} ${st.text} border border-white/5 whitespace-nowrap shrink-0`}>
                                                {st.label}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/[0.04] mt-auto">
                                            {app.status === 'SENT' && (
                                                <button onClick={() => updateStatus(app.id, 'REVIEWED')}
                                                    className={actionBtnCls + " bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white"}><Eye size={14} /> Lue</button>
                                            )}
                                            {['SENT', 'REVIEWED'].includes(app.status) && (
                                                <button onClick={() => updateStatus(app.id, 'SHORTLISTED')}
                                                    className={actionBtnCls + " bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"}><Star size={14} /> Pré-sélectionner</button>
                                            )}
                                            {['SHORTLISTED', 'REVIEWED'].includes(app.status) && (
                                                <button onClick={() => updateStatus(app.id, 'INTERVIEW')}
                                                    className={actionBtnCls + " bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"}><Calendar size={14} /> Entretien</button>
                                            )}
                                            {app.status === 'INTERVIEW' && (
                                                <button onClick={() => updateStatus(app.id, 'ACCEPTED')}
                                                    className={actionBtnCls + " bg-[#14B53A]/10 border-[#14B53A]/20 text-[#14B53A] hover:bg-[#14B53A]/20"}><Check size={14} /> Accepter</button>
                                            )}
                                            {!['ACCEPTED', 'REJECTED'].includes(app.status) && (
                                                <button onClick={() => updateStatus(app.id, 'REJECTED')}
                                                    className={actionBtnCls + " bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"}><X size={14} /> Refuser</button>
                                            )}
                                            <Link href={`/dashboard/applications/${app.id}`}
                                                className={actionBtnCls + " bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white ml-auto"}><MessageSquare size={14} /> Message</Link>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}
