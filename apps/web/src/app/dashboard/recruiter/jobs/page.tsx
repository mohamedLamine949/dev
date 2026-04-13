'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Job, employerApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { Megaphone, MapPin, Activity, PlusCircle, ArrowRight, ActivityIcon, FileText } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function RecruiterJobsPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'RECRUITER')) {
            router.push('/dashboard');
            return;
        }

        if (token) {
            fetch(`${API}/employers/me/jobs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                setJobs(data.jobs || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
        }
    }, [user, authLoading, token, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#14B53A]/20 border-t-[#14B53A] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Mali bar */}
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
            </div>

            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliEmploi</span>
                    <span className="text-[11px] text-[#FCD116]/70 border border-[#FCD116]/25 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
                </Link>
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
                    ← Tableau de bord
                </Link>
            </nav>

            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Megaphone className="text-[#14B53A]" size={28} />
                            Mes Annonces
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Gérez les offres publiées par votre entreprise.</p>
                    </div>
                    <Link
                        href="/dashboard/recruiter/jobs/new"
                        className="bg-[#14B53A] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#12a133] transition shadow-[0_0_15px_rgba(20,181,58,0.3)]"
                    >
                        <PlusCircle size={16} /> Créer une offre
                    </Link>
                </div>

                {jobs.length === 0 ? (
                    <div className="p-10 border border-white/10 bg-white/[0.02] rounded-3xl text-center">
                        <FileText size={48} className="text-white/10 mx-auto mb-4" />
                        <h2 className="text-white font-bold mb-1">Aucune annonce</h2>
                        <p className="text-gray-500 text-sm mb-6">Vous n'avez pas encore publié d'offres d'emploi.</p>
                        <Link
                            href="/dashboard/recruiter/jobs/new"
                            className="inline-flex items-center gap-2 bg-white text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition"
                        >
                            Publier ma première offre <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map((job, i) => {
                            let regions = [job.regions];
                            try { regions = JSON.parse(job.regions) || []; } catch {}
                            return (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="border border-white/10 bg-white/[0.02] rounded-2xl p-5 hover:bg-white/[0.04] transition flex flex-col md:flex-row md:items-center justify-between gap-6"
                                >
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 ${
                                                job.status === 'PUBLISHED' ? 'text-[#14B53A] border-[#14B53A]/30 bg-[#14B53A]/10' :
                                                job.status === 'CLOSED' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                                                'text-gray-400 bg-white/5'
                                            }`}>
                                                {job.status === 'PUBLISHED' ? 'PUBLIÉE' : job.status === 'CLOSED' ? 'CLÔTURÉE' : 'BROUILLON'}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-500 px-2 py-0.5 rounded border border-white/10 uppercase">
                                                {job.type}
                                            </span>
                                            <span className="text-[10px] text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">
                                            <Link href={`/jobs/${job.id}`} className="hover:text-[#14B53A] transition">{job.title}</Link>
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><Activity size={12}/> {job.sector}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12}/> {regions.join(', ')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link href={`/jobs/${job.id}`} className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition">Voir</Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
