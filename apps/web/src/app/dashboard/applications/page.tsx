'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Application {
    id: string; status: string; coverLetter?: string; createdAt: string;
    job: { id: string; title: string; type: string; sector: string; regions: string; deadline: string; status: string; employer: { name: string; isVerified: boolean } };
    messages: { id: string; content: string; createdAt: string }[];
}

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
    SENT: { label: 'Envoyée', dot: 'bg-gray-400' },
    REVIEWED: { label: 'Consultée', dot: 'bg-[#FCD116]' },
    SHORTLISTED: { label: 'Présélectionné(e)', dot: 'bg-white' },
    INTERVIEW: { label: 'Entretien prévu', dot: 'bg-white' },
    ACCEPTED: { label: 'Acceptée 🎉', dot: 'bg-[#14B53A]' },
    REJECTED: { label: 'Non retenue', dot: 'bg-red-500' },
};

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
                <span className="text-white font-bold tracking-tight">MaliLink</span>
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
                    <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
                ) : applications.length === 0 ? (
                    <div className="rounded-2xl border border-white/[0.07] p-12 text-center">
                        <p className="text-3xl mb-3">📭</p>
                        <p className="text-white font-medium mb-1">Aucune candidature</p>
                        <p className="text-gray-500 text-sm mb-4">Parcourez les offres et postulez !</p>
                        <Link href="/jobs" className="text-sm bg-white text-black font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition">Voir les offres</Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {applications.map(app => {
                            const st = STATUS_MAP[app.status] || STATUS_MAP.SENT;
                            const regions = (() => { try { return JSON.parse(app.job.regions); } catch { return [app.job.regions]; } })();
                            return (
                                <Link key={app.id} href={`/dashboard/applications/${app.id}`}
                                    className="flex items-start justify-between gap-4 px-5 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate">{app.job.title}</h3>
                                        <p className="text-gray-500 text-sm">
                                            {app.job.employer.name}{app.job.employer.isVerified ? <span className="text-[#14B53A] ml-1">✓</span> : ''} · {app.job.sector} · {regions.join(', ')}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                            <span className="text-xs text-gray-300">{st.label}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{new Date(app.createdAt).toLocaleDateString('fr-FR')}</p>
                                        {app.messages.length > 0 && <p className="text-xs text-[#14B53A] mt-0.5">💬 Message</p>}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
