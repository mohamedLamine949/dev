'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Job { id: string; title: string; }
interface RecruiterApp {
    id: string; status: string; createdAt: string;
    user: { id: string; firstName: string; lastName: string; phone: string; email?: string; country: string };
    messages: { id: string; content: string; createdAt: string }[];
}

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
    SENT: { label: 'Nouvelle', dot: 'bg-gray-400' },
    REVIEWED: { label: 'Consultée', dot: 'bg-[#FCD116]' },
    SHORTLISTED: { label: 'Présélectionné', dot: 'bg-white' },
    INTERVIEW: { label: 'Entretien', dot: 'bg-white' },
    ACCEPTED: { label: 'Accepté', dot: 'bg-[#14B53A]' },
    REJECTED: { label: 'Refusé', dot: 'bg-red-500' },
};

const actionBtnCls = "text-xs border px-3 py-1 rounded-lg transition";

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
                    <span className="text-white font-bold tracking-tight">MaliLink</span>
                    <span className="text-[11px] text-[#FCD116]/70 border border-[#FCD116]/25 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
                </Link>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
            </nav>

            <div className="max-w-5xl mx-auto px-4 py-10">
                <h1 className="text-2xl font-bold text-white tracking-tight mb-6">Candidatures reçues</h1>

                {/* Job selector */}
                <div className="mb-6 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                    <label className="block text-xs text-gray-400 mb-2">Sélectionnez une offre</label>
                    <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition">
                        <option value="">-- Choisir une offre --</option>
                        {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                </div>

                {!selectedJob ? (
                    <div className="rounded-2xl border border-white/[0.07] p-12 text-center">
                        <p className="text-3xl mb-3">📋</p>
                        <p className="text-white font-medium">Sélectionnez une offre ci-dessus</p>
                        <p className="text-gray-500 text-sm mt-1">Les candidatures reçues apparaîtront ici</p>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
                ) : applications.length === 0 ? (
                    <div className="rounded-2xl border border-white/[0.07] p-12 text-center">
                        <p className="text-3xl mb-3">📭</p>
                        <p className="text-white font-medium">Aucune candidature reçue</p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-500 text-sm mb-4">{total} candidature{total !== 1 ? 's' : ''}</p>
                        <div className="space-y-3">
                            {applications.map(app => {
                                const st = STATUS_MAP[app.status] || STATUS_MAP.SENT;
                                return (
                                    <div key={app.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-white font-medium">{app.user.firstName} {app.user.lastName}</h3>
                                                <p className="text-gray-500 text-sm">📞 {app.user.phone}{app.user.email ? ` · ${app.user.email}` : ''}</p>
                                                <p className="text-gray-600 text-xs mt-0.5">🌍 {app.user.country} · {new Date(app.createdAt).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                <span className="text-xs text-gray-300">{st.label}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.06]">
                                            {app.status === 'SENT' && (
                                                <button onClick={() => updateStatus(app.id, 'REVIEWED')}
                                                    className={actionBtnCls + " border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}>👁 Lue</button>
                                            )}
                                            {['SENT', 'REVIEWED'].includes(app.status) && (
                                                <button onClick={() => updateStatus(app.id, 'SHORTLISTED')}
                                                    className={actionBtnCls + " border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}>⭐ Présélectionner</button>
                                            )}
                                            {['SHORTLISTED', 'REVIEWED'].includes(app.status) && (
                                                <button onClick={() => updateStatus(app.id, 'INTERVIEW')}
                                                    className={actionBtnCls + " border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}>🗓 Entretien</button>
                                            )}
                                            {app.status === 'INTERVIEW' && (
                                                <button onClick={() => updateStatus(app.id, 'ACCEPTED')}
                                                    className={actionBtnCls + " border-[#14B53A]/30 text-[#14B53A] hover:bg-[#14B53A]/10"}>🎉 Accepter</button>
                                            )}
                                            {!['ACCEPTED', 'REJECTED'].includes(app.status) && (
                                                <button onClick={() => updateStatus(app.id, 'REJECTED')}
                                                    className={actionBtnCls + " border-red-500/20 text-red-400 hover:bg-red-500/10"}>✕ Refuser</button>
                                            )}
                                            <Link href={`/dashboard/applications/${app.id}`}
                                                className={actionBtnCls + " border-white/10 text-gray-400 hover:border-white/20 hover:text-white ml-auto"}>💬 Message</Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
