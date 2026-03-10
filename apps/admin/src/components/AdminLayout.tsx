'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'ADMIN')) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
            <div className="animate-pulse">Chargement de MaliLink Admin...</div>
        </div>
    );

    if (!user || user.role !== 'ADMIN') return null;

    const NavItem = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
        const isActive = pathname === href;
        return (
            <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <span className="text-xl">{icon}</span>
                <span className="font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 p-6 flex flex-col gap-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-600/30">ML</div>
                    <div>
                        <h1 className="font-bold text-lg leading-none">MaliLink</h1>
                        <span className="text-[10px] text-green-500 font-bold tracking-widest uppercase">Admin Panel</span>
                    </div>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    <NavItem href="/" label="Tableau de bord" icon="📊" />
                    <NavItem href="/users" label="Utilisateurs" icon="👥" />
                    <NavItem href="/employers" label="Employeurs" icon="🏢" />
                    <NavItem href="/jobs" label="Modération Offres" icon="📋" />
                </nav>

                <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="px-4 py-3 bg-white/5 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{user.firstName[0]}{user.lastName[0]}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Administrateur</p>
                        </div>
                    </div>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition font-medium text-sm">
                        <span>🚪</span> Se déconnecter
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        {pathname === '/' ? 'Vue d\'ensemble' : pathname === '/users' ? 'Gestion Utilisateurs' : pathname === '/employers' ? 'Validation Employeurs' : 'Modération des Offres'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] text-green-500 font-bold uppercase">Système En Ligne</span>
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
