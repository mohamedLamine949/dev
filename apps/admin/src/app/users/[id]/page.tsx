'use client';

import { useState, useEffect, use } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { token, user: adminUser } = useAuth();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && id && adminUser?.role === 'ADMIN') {
            adminApi.getUserDetail(token, id)
                .then(setUser)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [token, id, adminUser]);

    if (loading) return <AdminLayout><div className="p-20 text-center animate-pulse text-slate-500 font-medium">Chargement du profil complet...</div></AdminLayout>;
    if (!user) return <AdminLayout><div className="p-20 text-center text-red-400">Utilisateur non trouvé.</div></AdminLayout>;

    const profile = user.candidateProfile;
    const isRecruiter = user.role === 'RECRUITER';

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                {/* Header / Basic Info */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-3xl bg-slate-800 flex items-center justify-center text-4xl font-bold text-slate-400 border border-white/5">
                            {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-white">{user.firstName} {user.lastName}</h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : user.role === 'RECRUITER' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-slate-400 font-medium flex items-center gap-4">
                                <span className="flex items-center gap-1">📧 {user.email || 'Pas d\'email'}</span>
                                <span className="flex items-center gap-1">📞 {user.phone}</span>
                                <span className="flex items-center gap-1">📍 {user.country}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/users" className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition">
                            Retour à la liste
                        </Link>
                    </div>
                </div>

                {isRecruiter ? (
                    <div className="grid grid-cols-1 gap-8">
                        {/* Enterprises */}
                        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="text-blue-400">🏢</span> Entreprises Associées
                            </h3>
                            {user.employerMembers?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.employerMembers.map((em: any) => (
                                        <div key={em.employer.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl border border-white/10">
                                                    {em.employer.logoS3Key ? '🏢' : '💼'}
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-lg">{em.employer.name}</h4>
                                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{em.role === 'OWNER' ? 'Propriétaire' : 'Membre'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${em.employer.isVerified ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                    {em.employer.isVerified ? 'Vérifié' : em.employer.verificationStatus === 'REJECTED' ? 'Rejeté' : 'En attente'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center text-slate-600 font-medium">Ce recruteur n'est associé à aucune entreprise.</div>
                            )}
                        </section>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Profile Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Summary */}
                            <section className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="text-blue-400">📝</span> Résumé Professionnel
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                                    {profile?.summary || "Aucun résumé renseigné par le candidat."}
                                </p>
                                {profile?.title && (
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Intitulé du poste</p>
                                        <p className="text-white font-bold">{profile.title}</p>
                                    </div>
                                )}
                            </section>

                            {/* Experiences */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 px-2">
                                    <span className="text-[#14B53A]">💼</span> Expériences Professionnelles
                                </h3>
                                {profile?.experiences?.length > 0 ? (
                                    <div className="space-y-4">
                                        {profile.experiences.map((exp: any) => (
                                            <div key={exp.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl group hover:bg-white/[0.03] transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-white font-bold">{exp.title}</h4>
                                                    <span className="text-[10px] font-black text-slate-500 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                                                        {new Date(exp.startDate).getFullYear()} — {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Présent'}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">{exp.company} · {exp.type}</p>
                                                <p className="text-slate-500 text-sm leading-relaxed">{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center text-slate-600">Aucune expérience renseignée.</div>
                                )}
                            </section>

                            {/* Education */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 px-2">
                                    <span className="text-[#FCD116]">🎓</span> Formations & Diplômes
                                </h3>
                                {profile?.educations?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {profile.educations.map((edu: any) => (
                                            <div key={edu.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{edu.year}</p>
                                                <h4 className="text-white font-bold text-sm mb-1">{edu.title}</h4>
                                                <p className="text-slate-500 text-xs font-bold truncate">{edu.institution} · {edu.country}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center text-slate-600">Aucune formation renseignée.</div>
                                )}
                            </section>
                        </div>

                        {/* Right Column: Skills & Docs */}
                        <div className="space-y-8">
                            {/* Status Check (Diaspora) */}
                            <div className={`p-6 rounded-3xl border ${profile?.isDiaspora ? 'bg-amber-600/10 border-amber-500/20' : 'bg-green-600/10 border-green-500/20'}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-2xl">{profile?.isDiaspora ? '🌍' : '🇲🇱'}</span>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut Géographique</p>
                                        <p className={`font-bold ${profile?.isDiaspora ? 'text-amber-500' : 'text-green-500'}`}>
                                            {profile?.isDiaspora ? 'Profil Diaspora' : 'Profil Local (Mali)'}
                                        </p>
                                    </div>
                                </div>
                                {profile?.isDiaspora && (
                                    <div className="text-xs text-slate-400 space-y-1 mt-3 pt-3 border-t border-white/5">
                                        <p>Souhaite revenir : <span className="text-white font-bold">{profile.returnType || 'Non spécifié'}</span></p>
                                        <p>Horizon : <span className="text-white font-bold">{profile.returnHorizon || 'Non spécifié'}</span></p>
                                    </div>
                                )}
                            </div>

                            {/* Skills */}
                            <section className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Compétences</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile?.skills?.length > 0 ? (
                                        profile.skills.map((s: any) => (
                                            <span key={s.id} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300">
                                                {s.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-600 text-xs italic">Aucune compétence listée.</span>
                                    )}
                                </div>
                            </section>

                            {/* Documents */}
                            <section className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Documents Coffre-Fort</h3>
                                {user.documents?.length > 0 ? (
                                    <div className="space-y-3">
                                        {user.documents.map((doc: any) => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group hover:border-white/20 transition-all">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-xl shrink-0">📄</span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{doc.category}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/documents/${doc.id}/download`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs hover:bg-white/10 transition"
                                                    title="Télécharger"
                                                >
                                                    ⬇️
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center py-6 text-slate-600 text-xs font-bold italic">Aucun document téléversé.</p>
                                )}
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
