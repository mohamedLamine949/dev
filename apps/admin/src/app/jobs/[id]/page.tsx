'use client';

import { useState, useEffect, use } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { token, user: adminUser } = useAuth();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && id && adminUser?.role === 'ADMIN') {
            adminApi.getJobDetail(token, id)
                .then(setJob)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [token, id, adminUser]);

    if (loading) return <AdminLayout><div className="p-20 text-center animate-pulse text-slate-500 font-medium">Chargement des détails de l'offre...</div></AdminLayout>;
    if (!job) return <AdminLayout><div className="p-20 text-center text-red-400">Offre non trouvée.</div></AdminLayout>;

    const handleToggleStatus = async () => {
        if (!token) return;
        const nextStatus = job.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
        try {
            await adminApi.updateJobStatus(token, id, nextStatus);
            setJob({ ...job, status: nextStatus });
        } catch (err) {
            alert('Erreur lors de la modification');
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                {/* Header Info */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-3xl shadow-xl">
                            {job.employer?.logoS3Key ? '🏢' : '💼'}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-white">{job.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${job.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {job.status === 'PUBLISHED' ? 'En Ligne' : 'Hors Ligne'}
                                </span>
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-4">
                                <span className="text-green-500">{job.employer?.name}</span>
                                <span>📍 {job.regions}</span>
                                <span>📅 Publiée le {new Date(job.createdAt).toLocaleDateString()}</span>
                            </p>
                        </div>
                    </div>
                    <Link href="/jobs" className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition">
                        Retour
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Description */}
                        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="text-amber-500">📄</span> Mission & Descriptif
                            </h3>
                            <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </section>

                        {/* Requirements */}
                        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="text-purple-400">⚡</span> Profil Recherché
                            </h3>
                            <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                                {job.requirements}
                            </div>
                        </section>

                        {/* Required Docs */}
                        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <span className="text-blue-400">📎</span> Dossier Candidature
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {job.requiredDocs?.length > 0 ? (
                                    job.requiredDocs.map((rd: any) => (
                                        <span key={rd.id} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300">
                                            {rd.label} {rd.isOptional && '(Optionnel)'}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-slate-600 text-xs font-bold italic">Aucun document spécifique requis.</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Side Panel: Actions & Quick Stats */}
                    <div className="space-y-6">
                        {/* Status Management */}
                        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Actions Admin</h3>
                            <button
                                onClick={handleToggleStatus}
                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border ${job.status === 'PUBLISHED' ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'}`}
                            >
                                {job.status === 'PUBLISHED' ? '🔴 Suspendre l\'offre' : '🟢 Activer l\'offre'}
                            </button>
                            <p className="text-[10px] text-slate-600 font-bold mt-4 text-center">
                                {job.status === 'PUBLISHED' ? "L'offre ne sera plus visible par les candidats." : "L'offre sera à nouveau visible sur la plateforme."}
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6 text-sm">
                            <div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Candidatures reçues</p>
                                <p className="text-2xl font-black text-white">{job._count?.applications || 0}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Type de contrat</p>
                                <p className="text-white font-bold">{job.type}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Secteur</p>
                                <p className="text-white font-bold">{job.sector}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Niveau d'études</p>
                                <p className="text-white font-bold">{job.educationLevel}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
