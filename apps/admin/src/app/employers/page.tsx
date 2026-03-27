'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Employer {
    id: string;
    name: string;
    slug: string;
    category: string;
    nif?: string;
    rccm?: string;
    isVerified: boolean;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verificationNote?: string;
    createdAt: string;
}

export default function EmployersPage() {
    const { token, user } = useAuth();
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Modal state for rejection note
    const [verifyModal, setVerifyModal] = useState<{ employer: Employer | null, type: 'VERIFY' | 'REJECT' | null }>({ employer: null, type: null });
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchEmployers = useCallback(async () => {
        if (!token || !user || user?.role !== 'ADMIN') return;
        setLoading(true);
        try {
            let params = `page=${page}&search=${search}`;
            if (filter !== 'ALL') params += `&status=${filter}`;
            const data = await adminApi.getEmployers(token, params);
            setTotal(data.total);
            setEmployers(data.employers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, user, page, filter, search]);

    useEffect(() => {
        fetchEmployers();
    }, [fetchEmployers]);

    const submitVerification = async () => {
        if (!token || !verifyModal.employer || !verifyModal.type) return;
        setProcessing(true);
        const newStatus = verifyModal.type === 'VERIFY' ? 'VERIFIED' : 'REJECTED';
        try {
            await adminApi.verifyEmployer(token, verifyModal.employer.id, newStatus, note);
            setEmployers(employers.map(e => e.id === verifyModal.employer!.id ? {
                ...e,
                verificationStatus: newStatus,
                isVerified: newStatus === 'VERIFIED',
                verificationNote: note
            } : e));
            setVerifyModal({ employer: null, type: null });
            setNote('');
        } catch (err) {
            alert('Erreur lors de la mise à jour');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 relative">
                <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <div className="flex gap-2">
                        {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((f) => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f as any); setPage(1); }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filter === f ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                                {f === 'ALL' ? 'Tous' : f === 'PENDING' ? 'En attente' : f === 'VERIFIED' ? 'Vérifiés' : 'Rejetés'}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-80">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher (Nom, NIF, RCCM)..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entreprise</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Infos Légales (NIF/RCCM)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-500 animate-pulse font-medium">Analyse des comptes entreprises...</td></tr>
                            ) : employers.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-500 font-medium">Aucun employeur trouvé</td></tr>
                            ) : employers.map((e) => (
                                <tr key={e.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <Link href={`/employers/${e.id}`} className="flex items-center gap-3 group/link">
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-lg font-bold border border-white/5 group-hover/link:border-green-500/30 transition-all">🏢</div>
                                            <div>
                                                <p className="font-bold text-white text-sm group-hover/link:text-green-500 transition-colors">{e.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">@{e.slug} · {e.category}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-slate-300"><span className="text-slate-500">NIF:</span> {e.nif || 'Non renseigné'}</span>
                                            <span className="text-xs text-slate-300"><span className="text-slate-500">RCCM:</span> {e.rccm || 'Non renseigné'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {e.verificationStatus === 'VERIFIED' ? (
                                            <span className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" /> Vérifié ✓
                                            </span>
                                        ) : e.verificationStatus === 'REJECTED' ? (
                                            <span className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Rejeté ✕
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> En attente ⌛
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Link
                                            href={`/employers/${e.id}`}
                                            className="px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                                        >
                                            Détails
                                        </Link>
                                        {e.verificationStatus !== 'VERIFIED' && (
                                            <button
                                                onClick={() => setVerifyModal({ employer: e, type: 'VERIFY' })}
                                                className="px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-green-600 border-green-500 text-white hover:bg-green-500 shadow-lg shadow-green-900/10"
                                            >
                                                Valider
                                            </button>
                                        )}
                                        {e.verificationStatus !== 'REJECTED' && (
                                            <button
                                                onClick={() => setVerifyModal({ employer: e, type: 'REJECT' })}
                                                className="px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-white/5 border-white/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                                            >
                                                Refuser
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Verification Modal */}
                {verifyModal.employer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-2">
                                {verifyModal.type === 'VERIFY' ? 'Valider le compte' : 'Refuser le compte'}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Action pour l'employeur <strong className="text-white">{verifyModal.employer.name}</strong>.
                                {verifyModal.type === 'REJECT' && " Un motif de refus peut être fourni pour informer le compte."}
                            </p>

                            {verifyModal.type === 'REJECT' && (
                                <textarea
                                    value={note} onChange={e => setNote(e.target.value)}
                                    placeholder="Motif du refus (ex: NIF invalide, RCCM manquant...)"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/50 resize-y mb-6"
                                    rows={3}
                                />
                            )}

                            {verifyModal.type === 'VERIFY' && (
                                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-6">
                                    <span>⚠️</span>
                                    Assurez-vous que le NIF ({verifyModal.employer.nif || 'N/A'}) et le RCCM ({verifyModal.employer.rccm || 'N/A'}) sont valides.
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button onClick={() => { setVerifyModal({ employer: null, type: null }); setNote(''); }} className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition">Annuler</button>
                                <button onClick={submitVerification} disabled={processing} className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition ${verifyModal.type === 'VERIFY' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} disabled:opacity-50`}>
                                    {processing ? 'Chargement...' : verifyModal.type === 'VERIFY' ? 'Confirmer la validation' : 'Confirmer le refus'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
