'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Job, savedJobsApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Briefcase, MapPin, Building, ChevronLeft, Trash2, Loader2 } from 'lucide-react';

export default function SavedJobsPage() {
    const { token, user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        fetchSavedJobs();
    }, [token]);

    const fetchSavedJobs = async () => {
        try {
            const data = await savedJobsApi.list(token!);
            // Extract the 'job' property from each SavedJob object
            const mappedJobs = data.map((item: any) => item.job);
            setJobs(mappedJobs);
        } catch (err) {
            console.error('Erreur chargement favoris:', err);
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (e: React.MouseEvent, jobId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!token) return;
        setRemovingId(jobId);
        try {
            await savedJobsApi.remove(token, jobId);
            setJobs(prev => prev.filter(j => j.id !== jobId));
        } catch (err) {
            console.error('Erreur suppression:', err);
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-20">
            {/* Mali bar */}
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
            </div>

            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliEmploi</span>
                </Link>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition flex items-center gap-1">
                    <ChevronLeft size={16} /> Tableau de bord
                </Link>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-10">
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                            <Heart size={20} fill="currentColor" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Mes Favoris</h1>
                    </div>
                    <p className="text-gray-500">Retrouvez toutes les offres que vous avez sauvegardées.</p>
                </header>

                {jobs.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center text-gray-600">
                            <Heart size={32} />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Aucun favori pour le moment</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                                Parcourez les offres d'emploi et cliquez sur l'icône cœur pour les retrouver ici.
                            </p>
                        </div>
                        <Link href="/jobs" className="mt-2 bg-white text-black px-6 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition shadow-lg">
                            Voir les offres
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {jobs.map((job) => (
                                <motion.div
                                    key={job.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group"
                                >
                                    <Link href={`/jobs/${job.id}`}>
                                        <div className="glass-card p-5 rounded-2xl border border-white/[0.06] hover:border-white/20 transition-all flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                                                    <Briefcase size={20} className="text-gray-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-white font-semibold truncate">{job.title}</h3>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Building size={12} /> {job.employer.name}
                                                        </span>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <MapPin size={12} /> {job.regions}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => removeFavorite(e, job.id)}
                                                disabled={removingId === job.id}
                                                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all shrink-0"
                                                title="Retirer des favoris"
                                            >
                                                {removingId === job.id ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
