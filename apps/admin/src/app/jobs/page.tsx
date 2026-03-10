'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Job {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    employer: { name: string };
}

export default function JobsModerationPage() {
    const { token, user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'PUBLISHED' | 'DRAFT' | 'CLOSED'>('PUBLISHED');

    const fetchJobs = useCallback(async () => {
        if (!token || !user || user?.role !== 'ADMIN') return;
        setLoading(true);
        try {
            const data = await adminApi.getJobs(token, `status=${filter}`);
            setJobs(data.jobs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, user, filter]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        if (!token) return;
        try {
            await adminApi.updateJobStatus(token, id, newStatus);
            setJobs(jobs.filter(j => j.id !== id)); // Move away from current list after change
        } catch (err) {
            alert('Erreur lors de la modération');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex gap-4">
                    {['PUBLISHED', 'DRAFT', 'CLOSED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filter === f ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                        >
                            {f === 'PUBLISHED' ? 'En ligne' : f === 'DRAFT' ? 'Brouillons' : 'Archivées'}
                        </button>
                    ))}
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offre d&apos;emploi</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entreprise</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions de modération</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-500 animate-pulse font-medium">Scrutage des offres en cours...</td></tr>
                            ) : jobs.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-500 font-medium">Aucune offre dans cette catégorie</td></tr>
                            ) : jobs.map((j) => (
                                <tr key={j.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-white text-sm">{j.title}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">{j.id.split('-')[0]}...</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{j.employer.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 font-bold uppercase tracking-widest">
                                        {new Date(j.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <Link
                                            href={`/jobs/${j.id}`}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition-all font-bold"
                                        >
                                            👁️ Voir
                                        </Link>
                                        {filter === 'PUBLISHED' && (
                                            <button
                                                onClick={() => handleUpdateStatus(j.id, 'CLOSED')}
                                                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all uppercase tracking-widest"
                                            >
                                                Suspendre
                                            </button>
                                        )}
                                        {filter === 'DRAFT' && (
                                            <button
                                                onClick={() => handleUpdateStatus(j.id, 'PUBLISHED')}
                                                className="px-4 py-2 bg-green-600/10 border border-green-600/20 text-green-500 rounded-xl text-xs font-bold hover:bg-green-600/20 transition-all uppercase tracking-widest"
                                            >
                                                Valider
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
