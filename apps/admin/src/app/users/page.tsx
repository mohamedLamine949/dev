'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface User {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string;
    lastName: string;
    role: string;
    isSuspended: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const { token, user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(token!, `page=${page}&search=${search}&role=CANDIDATE`);
            setUsers(data.users);
            setTotal(data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, user, page, search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleSuspension = async (user: User) => {
        if (!token) return;
        try {
            await adminApi.suspendUser(token, user.id, !user.isSuspended);
            setUsers(users.map(u => u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u));
        } catch (err) {
            alert('Erreur lors de la modification');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <div className="relative w-96">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher un candidat (Nom, Email, Tel)..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                        />
                    </div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {total} Candidats trouvés
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Candidat</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rôle</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-500 animate-pulse font-medium">Chargement de la base candidats...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-medium">Aucun candidat trouvé</td></tr>
                            ) : users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 group-hover:bg-slate-700 transition-colors">
                                                {u.firstName[0]}{u.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{u.firstName} {u.lastName}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">{u.id.split('-')[0]}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <p className="text-slate-300 font-medium">{u.email || '—'}</p>
                                        <p className="text-slate-500 text-xs font-bold">{u.phone || '—'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : u.role === 'RECRUITER' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.isSuspended ? (
                                            <span className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Suspendu
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Actif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <Link
                                            href={`/users/${u.id}`}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition-all font-bold"
                                        >
                                            👁️ Détails
                                        </Link>
                                        <button
                                            onClick={() => handleToggleSuspension(u)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${u.isSuspended ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                        >
                                            {u.isSuspended ? 'Réactiver' : 'Suspendre'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination placeholder */}
                {total > users.length && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition"
                        >←</button>
                        <div className="px-6 h-10 bg-green-600/10 border border-green-600/20 rounded-xl flex items-center justify-center text-xs font-bold text-green-500">
                            Page {page}
                        </div>
                        <button
                            disabled={page * 20 >= total}
                            onClick={() => setPage(p => p + 1)}
                            className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition"
                        >→</button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
