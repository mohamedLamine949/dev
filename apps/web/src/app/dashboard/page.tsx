'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const roleLabels: Record<string, string> = { RECRUITER: 'Recruteur', ADMIN: 'Admin', CANDIDATE: 'Candidat' };

function ActionCard({ title, desc, icon, href }: { title: string; desc: string; icon: string; href: string }) {
    return (
        <Link href={href} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all block">
            <div className="text-2xl mb-3">{icon}</div>
            <h3 className="font-semibold text-white text-sm">{title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
        </Link>
    );
}

export default function DashboardPage() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    );
    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Mali bar */}
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
            </div>

            {/* Nav */}
            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliLink</span>
                    <span className="text-[11px] text-[#FCD116]/70 border border-[#FCD116]/25 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
                </Link>
                <button onClick={() => { logout(); router.push('/login'); }}
                    className="text-sm text-gray-500 hover:text-white transition">
                    Déconnexion
                </button>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-10">
                {/* Welcome card */}
                <div className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                        <h2 className="text-white font-semibold">Bonjour, {user.firstName} {user.lastName} 👋</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] border border-white/15 text-gray-400 rounded-full px-2 py-0.5">
                                {roleLabels[user.role] || user.role}
                            </span>
                            <span className="text-xs text-gray-600">{user.phone}</span>
                        </div>
                    </div>
                </div>

                {/* Action cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {user.role === 'CANDIDATE' && (
                        <>
                            <ActionCard icon="💼" title="Offres d'emploi" desc="Parcourir les offres disponibles" href="/jobs" />
                            <ActionCard icon="📄" title="Mon Profil" desc="Compléter mon profil" href="/dashboard/profile" />
                            <ActionCard icon="🔐" title="Mon Coffre-fort" desc="Gérer mes documents" href="/dashboard/documents" />
                            <ActionCard icon="📋" title="Mes candidatures" desc="Suivre mes dossiers" href="/dashboard/applications" />
                        </>
                    )}
                    {user.role === 'RECRUITER' && (
                        <>
                            <ActionCard icon="➕" title="Publier une offre" desc="Créer une nouvelle offre" href="/dashboard/recruiter/jobs/new" />
                            <ActionCard icon="🏢" title="Mon Entreprise" desc="Gérer ma structure" href="/dashboard/recruiter/employer" />
                            <ActionCard icon="📢" title="Mes offres" desc="Gérer mes annonces" href="/jobs" />
                            <ActionCard icon="📬" title="Candidatures" desc="Examiner les dossiers" href="/dashboard/recruiter/applications" />
                        </>
                    )}
                    {user.role === 'ADMIN' && (
                        <>
                            <ActionCard icon="👥" title="Utilisateurs" desc="Gérer les comptes" href="/admin/users" />
                            <ActionCard icon="🗂️" title="Offres" desc="Modérer les annonces" href="/admin/jobs" />
                            <ActionCard icon="📊" title="Statistiques" desc="Métriques de la plateforme" href="/admin/stats" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
