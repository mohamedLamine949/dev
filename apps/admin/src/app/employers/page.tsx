'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Employer {
    id: string;
    name: string;
    slug: string;
    category: string;
    isVerified: boolean;
    createdAt: string;
}

export default function EmployersPage() {
    const { token } = useAuth();
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
    const [page, setPage] = useState(1);

    const fetchEmployers = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            let params = `page=${page}`;
            if (filter === 'VERIFIED') params += '&isVerified=true';
            if (filter === 'PENDING') params += '&isVerified=false';

            const data = await adminApi.getEmployers(token, params);
            setEmployers(data.employers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, page, filter]);

    useEffect(() => {
        fetchEmployers();
    }, [fetchEmployers]);

    const handleToggleVerification = async (employer: Employer) => {
        if (!token) return;
        try {
            await adminApi.verifyEmployer(token, employer.id, !employer.isVerified);
            setEmployers(employers.map(e => e.id === employer.id ? { ...e, isVerified: !employer.isVerified } : e));
        } catch (err) {
            alert('Erreur lors de la vérification');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex gap-4">
                    {['ALL', 'PENDING', 'VERIFIED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f as any); setPage(1); }}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filter === f ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                        >
                            {f === 'ALL' ? 'Tous' : f === 'PENDING' ? 'En attente' : 'Vérifiés'}
                        </button>
                    ))}
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entreprise</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Catégorie</th>
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
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-lg font-bold">🏢</div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{e.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">@{e.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{e.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {e.isVerified ? (
                                            <span className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" /> Vérifié ✓
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> En attente ⌛
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleToggleVerification(e)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${e.isVerified ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' : 'bg-green-600 border-green-500 text-white hover:bg-green-500 shadow-lg shadow-green-900/10'}`}
                                        >
                                            {e.isVerified ? 'Révoquer' : 'Valider le compte'}
                                        </button>
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
