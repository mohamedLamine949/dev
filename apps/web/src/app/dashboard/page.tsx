'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import { motion, Variants } from 'framer-motion';
import {
    Briefcase, User, Lock, FileText,
    PlusCircle, Building, Megaphone, Inbox,
    Users, Layers, BarChart3, Bell
} from 'lucide-react';

const roleLabels: Record<string, string> = { RECRUITER: 'Recruteur', ADMIN: 'Admin', CANDIDATE: 'Candidat' };

function ActionCard({ title, desc, icon, href }: { title: string; desc: string; icon: React.ReactNode; href: string }) {
    return (
        <Link href={href} className="group glass-card glass-card-hover rounded-xl p-5 block relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition duration-500 scale-150 rotate-12">
                {icon}
            </div>
            <div className="text-2xl mb-3 text-white/70 group-hover:text-[#14B53A] transition-colors duration-300">
                {icon}
            </div>
            <h3 className="font-semibold text-white text-sm relative z-10">{title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed relative z-10">{desc}</p>
        </Link>
    );
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

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
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <button onClick={() => { logout(); router.push('/login'); }}
                        className="text-sm text-gray-500 hover:text-white transition">
                        Déconnexion
                    </button>
                </div>
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
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {user.role === 'CANDIDATE' && (
                        <>
                            <motion.div variants={itemVariants}><ActionCard icon={<Briefcase size={24} strokeWidth={1.5} />} title="Offres d'emploi" desc="Parcourir les offres" href="/jobs" /></motion.div>
                            <motion.div variants={itemVariants}><ActionCard icon={<User size={24} strokeWidth={1.5} />} title="Mon Profil" desc="Gérer mon CV & infos" href="/dashboard/profile" /></motion.div>
                            <motion.div variants={itemVariants}><ActionCard icon={<Lock size={24} strokeWidth={1.5} />} title="Mon Coffre-fort" desc="Documents sécurisés" href="/dashboard/documents" /></motion.div>
                            <motion.div variants={itemVariants}><ActionCard icon={<FileText size={24} strokeWidth={1.5} />} title="Mes candidatures" desc="Suivre mes dossiers" href="/dashboard/applications" /></motion.div>
                            <motion.div variants={itemVariants}><ActionCard icon={<Bell size={24} strokeWidth={1.5} />} title="Mes alertes" desc="Gérer mes alertes emploi" href="/dashboard/alerts" /></motion.div>
                        </>
                    )}
                    {user.role === 'RECRUITER' && (
                        <>
                            <motion.div variants={itemVariants}><ActionCard icon={<PlusCircle size={24} strokeWidth={1.5} />} title="Publier une offre" desc="Créer une annonce" href="/dashboard/recruiter/jobs/new" /></motion.div>
                            <motion.div variants={itemVariants}><ActionCard icon={<Building size={24} strokeWidth={1.5} />} title="Mon Entreprise" desc="Profil employeur" href="/dashboard/recruiter/employer" /></motion.div>
                            <motion.div variants={itemVariants}><ActionCard icon={<Megaphone size={24} strokeWidth={1.5} />} title="Mes offres" desc="Gérer mes annonces" href="/jobs" /></motion.div>
                            <motion.div variants={itemVariants}><ActionCard icon={<Inbox size={24} strokeWidth={1.5} />} title="Candidatures" desc="Examiner les dossiers" href="/dashboard/recruiter/applications" /></motion.div>
                        </>
                    )}
                    {user.role === 'ADMIN' && (
                        <>
                            <motion.div variants={itemVariants}><ActionCard icon={<Users size={24} strokeWidth={1.5} />} title="Utilisateurs" desc="Gérer les comptes" href="/admin/users" /></motion.div>
                            <motion.div variants={itemVariants}><ActionCard icon={<Layers size={24} strokeWidth={1.5} />} title="Offres" desc="Modérer les annonces" href="/admin/jobs" /></motion.div>
                            <motion.div variants={itemVariants}><ActionCard icon={<BarChart3 size={24} strokeWidth={1.5} />} title="Statistiques" desc="Métriques complètes" href="/admin/stats" /></motion.div>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
