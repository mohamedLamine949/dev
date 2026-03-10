'use client';

import { useState, useEffect, use } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Building, MapPin, Users, Briefcase, Calendar, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function EmployerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { token, user: adminUser } = useAuth();
    const [employer, setEmployer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal state for verification
    const [verifyModal, setVerifyModal] = useState<'VERIFY' | 'REJECT' | null>(null);
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchEmployer = async () => {
        if (token && id && adminUser?.role === 'ADMIN') {
            try {
                const data = await adminApi.getEmployerDetail(token, id);
                setEmployer(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchEmployer();
    }, [token, id, adminUser]);

    const submitVerification = async () => {
        if (!token || !employer || !verifyModal) return;
        setProcessing(true);
        const newStatus = verifyModal === 'VERIFY' ? 'VERIFIED' : 'REJECTED';
        try {
            await adminApi.verifyEmployer(token, employer.id, newStatus, note);
            setEmployer({
                ...employer,
                verificationStatus: newStatus,
                isVerified: newStatus === 'VERIFIED',
                verificationNote: note
            });
            setVerifyModal(null);
            setNote('');
        } catch (err) {
            alert('Erreur lors de la mise à jour');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <AdminLayout><div className="p-20 text-center animate-pulse text-slate-500 font-medium whitespace-pre-wrap">Chargement des détails de l&apos;entreprise...</div></AdminLayout>;
    if (!employer) return <AdminLayout><div className="p-20 text-center text-red-400">Entreprise non trouvée.</div></AdminLayout>;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-3xl bg-slate-800 flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
                            {employer.logoS3Key ? (
                                <img src={`${API_URL}/employers/${employer.id}/logo`} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Building size={48} className="text-slate-600" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h1 className="text-3xl font-black text-white tracking-tight">{employer.name}</h1>
                                {employer.verificationStatus === 'VERIFIED' ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle size={10} /> Vérifié
                                    </span>
                                ) : employer.verificationStatus === 'REJECTED' ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <XCircle size={10} /> Rejeté
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <AlertCircle size={10} /> En attente
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400 text-sm font-medium">
                                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-500">@{employer.slug}</span>
                                <span className="flex items-center gap-1.5">🏢 {employer.category}</span>
                                <span className="flex items-center gap-1.5">📅 Créé le {new Date(employer.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Link href="/employers" className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition">
                            Retour
                        </Link>
                        {employer.verificationStatus !== 'VERIFIED' && (
                            <button onClick={() => setVerifyModal('VERIFY')} className="px-5 py-2.5 bg-green-600 border border-green-500 rounded-xl text-sm font-bold text-white hover:bg-green-500 shadow-lg shadow-green-900/20 transition">
                                Valider
                            </button>
                        )}
                        {employer.verificationStatus !== 'REJECTED' && (
                            <button onClick={() => setVerifyModal('REJECT')} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition">
                                Refuser
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info Columns */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Legal & Description */}
                        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Numéro NIF</p>
                                    <p className="text-white font-bold">{employer.nif || 'Non renseigné'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Numéro RCCM</p>
                                    <p className="text-white font-bold">{employer.rccm || 'Non renseigné'}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">À propos de l&apos;entreprise</h3>
                                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                                    {employer.description || "Aucune description fournie par l'employeur."}
                                </p>
                            </div>
                        </section>

                        {/* Recent Jobs */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 px-2">
                                <Briefcase size={20} className="text-[#FCD116]" /> Offres d&apos;emploi ({employer.jobs?.length || 0})
                            </h3>
                            {employer.jobs?.length > 0 ? (
                                <div className="space-y-3">
                                    {employer.jobs.map((job: any) => (
                                        <Link href={`/jobs/${job.id}`} key={job.id} className="block bg-white/[0.02] border border-white/5 p-5 rounded-3xl hover:bg-white/[0.04] transition-all group">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-white font-bold group-hover:text-green-500 transition-colors">{job.title}</h4>
                                                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                                        <span>📍 {job.regions ? JSON.parse(job.regions).join(', ') : 'Mali'}</span>
                                                        <span>💼 {job.type}</span>
                                                        <span>📅 Posté le {new Date(job.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${job.status === 'PUBLISHED' ? 'text-green-500 bg-green-500/10' : 'text-slate-500 bg-white/5'}`}>
                                                    {job.status}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center text-slate-600 font-medium italic">
                                    Aucune offre publiée pour le moment.
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8">
                        {/* Members */}
                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Users size={16} className="text-blue-400" /> Membres ({employer.members?.length || 0})
                            </h3>
                            <div className="space-y-4">
                                {employer.members?.map((m: any) => (
                                    <div key={m.userId} className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-white/5">
                                            {m.user.avatarS3Key ? (
                                                <img src={`${API_URL}/profile/avatar/${m.userId}`} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <span className="text-sm font-bold text-slate-500">{m.user.firstName[0]}{m.user.lastName[0]}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{m.user.firstName} {m.user.lastName}</p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{m.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Quick Stats or Actions */}
                        <section className="bg-gradient-to-br from-green-600/10 to-transparent border border-green-500/10 p-6 rounded-3xl">
                            <h3 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-4">Résumé Administratif</h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Statut Verification</span>
                                    <span className={`font-bold ${employer.isVerified ? 'text-green-500' : 'text-amber-500'}`}>{employer.verificationStatus}</span>
                                </div>
                                {employer.verificationNote && (
                                    <div className="pt-3 border-t border-white/5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Note de validation</p>
                                        <p className="text-slate-400 italic text-xs">{employer.verificationNote}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Modal Verification Re-implementation for details page */}
                {verifyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-2">
                                {verifyModal === 'VERIFY' ? 'Valider le compte' : 'Refuser le compte'}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Action pour l&apos;employeur <strong className="text-white">{employer.name}</strong>.
                            </p>

                            {verifyModal === 'REJECT' && (
                                <textarea
                                    value={note} onChange={e => setNote(e.target.value)}
                                    placeholder="Motif du refus (ex: NIF invalide, RCCM manquant...)"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/50 resize-y mb-6"
                                    rows={3}
                                />
                            )}

                            <div className="flex justify-end gap-3">
                                <button onClick={() => { setVerifyModal(null); setNote(''); }} className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition">Annuler</button>
                                <button onClick={submitVerification} disabled={processing} className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition ${verifyModal === 'VERIFY' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} disabled:opacity-50`}>
                                    {processing ? 'Chargement...' : 'Confirmer'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
