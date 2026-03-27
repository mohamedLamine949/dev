'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { talentsApi } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import { motion, Variants } from 'framer-motion';
import {
    Search, MapPin, Briefcase, GraduationCap,
    Globe, User as UserIcon, Star, ArrowRight, ChevronDown, Check
} from 'lucide-react';

const SECTORS = ['IT / Digital', 'Finance / Gestion', 'BTP / Ingénierie', 'Santé', 'Éducation', 'Cyber-sécurité', 'Agriculture', 'Transport / Logistique'];
const REGIONS = ['Bamako', 'Kayes', 'Koulikoro', 'Sikasso', 'Ségou', 'Mopti', 'Tombouctou', 'Gao', 'Kidal'];
const LEVELS = ['BAC', 'Licence', 'Master', 'Doctorat', 'Autre'];
const EXPERIENCE_LEVELS = ['Débutant', '1-3 ans', '3-5 ans', '5-10 ans', '10+ ans'];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
};

export default function TalentSearchPage() {
    const { user, token } = useAuth();
    const [talents, setTalents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useState({
        q: '',
        sectors: [] as string[],
        regions: [] as string[],
        isDiaspora: '',
        experienceLevel: '',
        educationLevel: ''
    });

    const fetchTalents = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await talentsApi.search(token, searchParams);
            setTalents(data);
        } catch (error) {
            console.error('Error fetching talents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchTalents();
    }, [token]); // eslint-disable-line

    const handleFilterChange = (key: string, value: any) => {
        setSearchParams(prev => ({ ...prev, [key]: value }));
    };

    const toggleMultiSelect = (key: 'sectors' | 'regions', value: string) => {
        setSearchParams(prev => {
            const list = prev[key] as string[];
            if (list.includes(value)) {
                return { ...prev, [key]: list.filter(v => v !== value) };
            }
            return { ...prev, [key]: [...list, value] };
        });
    };

    if (!user || (user.role !== 'RECRUITER' && user.role !== 'ADMIN')) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <p className="text-white">Accès réservé aux recruteurs</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#14B53A]/30">
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" />
                <div className="flex-1 bg-[#FCD116]" />
                <div className="flex-1 bg-[#CE1126]" />
            </div>
            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliLink</span>
                </Link>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#14B53A]/20 to-[#14B53A]/5 text-[#14B53A] border border-[#14B53A]/10">
                            <Star size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-white">Recherche de Talents</h1>
                            <p className="text-gray-400 font-medium">Trouvez les meilleurs candidats pour vos besoins</p>
                        </div>
                    </div>

                    <div className="relative group max-w-2xl">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#14B53A]/20 to-[#FCD116]/20 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000"></div>
                        <div className="relative flex bg-[#111] border border-white/10 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#14B53A]/30 transition shadow-2xl">
                            <div className="flex items-center pl-5 text-gray-500"><Search size={22} /></div>
                            <input
                                type="text"
                                placeholder="Rechercher par nom, métier, compétence..."
                                className="w-full bg-transparent px-4 py-5 text-lg font-medium outline-none placeholder:text-gray-600"
                                value={searchParams.q}
                                onChange={e => handleFilterChange('q', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchTalents()}
                            />
                            <button
                                onClick={fetchTalents}
                                className="bg-[#14B53A] text-black font-bold px-8 hover:bg-[#14B53A]/90 transition-colors"
                            >
                                Trouver
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-72 shrink-0 space-y-8">
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4 text-[#FCD116]">
                                <Briefcase size={18} />
                                <h3 className="font-bold text-sm tracking-wide uppercase">Secteurs</h3>
                            </div>
                            <div className="space-y-2">
                                {SECTORS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleMultiSelect('sectors', s)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                            searchParams.sectors.includes(s)
                                            ? 'bg-[#14B53A]/10 text-[#14B53A] border border-[#14B53A]/20'
                                            : 'text-gray-400 hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        {s}
                                        {searchParams.sectors.includes(s) && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4 text-[#14B53A]">
                                <MapPin size={18} />
                                <h3 className="font-bold text-sm tracking-wide uppercase">Régions</h3>
                            </div>
                            <div className="space-y-2">
                                {REGIONS.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => toggleMultiSelect('regions', r)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                            searchParams.regions.includes(r)
                                            ? 'bg-[#14B53A]/10 text-[#14B53A] border border-[#14B53A]/20'
                                            : 'text-gray-400 hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        {r}
                                        {searchParams.regions.includes(r) && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4 text-[#14B53A]">
                                <Globe size={18} />
                                <h3 className="font-bold text-sm tracking-wide uppercase">Diaspora</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleFilterChange('isDiaspora', searchParams.isDiaspora === 'true' ? '' : 'true')}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        searchParams.isDiaspora === 'true'
                                        ? 'bg-[#14B53A]/10 border-[#14B53A]/30 text-[#14B53A]'
                                        : 'border-white/10 text-gray-500 hover:border-white/20'
                                    }`}
                                >
                                    À l&apos;étranger
                                </button>
                                <button
                                    onClick={() => handleFilterChange('isDiaspora', searchParams.isDiaspora === 'false' ? '' : 'false')}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        searchParams.isDiaspora === 'false'
                                        ? 'bg-[#FCD116]/10 border-[#FCD116]/30 text-[#FCD116]'
                                        : 'border-white/10 text-gray-500 hover:border-white/20'
                                    }`}
                                >
                                    Au Mali
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4 text-[#CE1126]">
                                <GraduationCap size={18} />
                                <h3 className="font-bold text-sm tracking-wide uppercase">Diplôme</h3>
                            </div>
                            <div className="space-y-2">
                                {LEVELS.map(l => (
                                    <button
                                        key={l}
                                        onClick={() => handleFilterChange('educationLevel', searchParams.educationLevel === l ? '' : l)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                            searchParams.educationLevel === l
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            : 'text-gray-400 hover:bg-white/5'
                                        }`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4 text-[#FCD116]">
                                <Briefcase size={18} />
                                <h3 className="font-bold text-sm tracking-wide uppercase">Expérience</h3>
                            </div>
                            <div className="space-y-2">
                                {EXPERIENCE_LEVELS.map(exp => (
                                    <button
                                        key={exp}
                                        onClick={() => handleFilterChange('experienceLevel', searchParams.experienceLevel === exp ? '' : exp)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                            searchParams.experienceLevel === exp
                                            ? 'bg-[#FCD116]/10 text-[#FCD116] border border-[#FCD116]/20'
                                            : 'text-gray-400 hover:bg-white/5'
                                        }`}
                                    >
                                        {exp}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-400 text-sm font-medium">
                                <span className="text-white">{talents.length}</span> talent{talents.length > 1 ? 's' : ''} correspondant{talents.length > 1 ? 's' : ''}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 border border-white/10 rounded-lg px-3 py-1.5">
                                Trier par : <span className="text-[#14B53A] font-bold">Récent</span> <ChevronDown size={14} />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-10 h-10 border-2 border-[#14B53A]/20 border-t-[#14B53A] rounded-full animate-spin"></div>
                                <p className="text-gray-500 animate-pulse font-medium">Chargement des talents...</p>
                            </div>
                        ) : talents.length === 0 ? (
                            <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-[32px] p-24 text-center">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <UserIcon size={32} className="text-gray-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Aucun talent trouvé</h3>
                                <p className="text-gray-500 max-w-xs mx-auto">Essayez de modifier vos filtres ou d&apos;élargir votre recherche.</p>
                            </div>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="grid gap-5 md:grid-cols-2"
                            >
                                {talents.map(talent => (
                                    <Link
                                        href={`/dashboard/recruiter/talents/${talent.id}`}
                                        key={talent.id}
                                        className="block"
                                    >
                                        <motion.div
                                            variants={itemVariants}
                                            className="group h-full rounded-[32px] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-[#14B53A]/20 transition-all p-6 relative flex flex-col"
                                        >
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-[#222] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#14B53A]/30 transition-colors">
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/profile/avatar/${talent.id}`}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(talent.firstName + ' ' + talent.lastName) + '&background=111&color=fff&size=64';
                                                        }}
                                                    />
                                                </div>
                                                <div className="min-w-0 pr-4">
                                                    <h3 className="font-bold text-xl group-hover:text-[#14B53A] transition-colors truncate">
                                                        {talent.firstName} {talent.lastName}
                                                    </h3>
                                                    <p className="text-[#FCD116] text-sm font-semibold mb-1 truncate">
                                                        {talent.candidateProfile?.title || 'Candidat MaliLink'}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                                        <MapPin size={12} className="text-[#CE1126]" />
                                                        {talent.city}, {talent.country}
                                                        {talent.candidateProfile?.isDiaspora && (
                                                            <span className="bg-[#14B53A]/10 text-[#14B53A] px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border border-[#14B53A]/20 ml-2">Diaspora</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mb-8">
                                                {talent.candidateProfile?.skills?.slice(0, 3).map((s: any) => (
                                                    <span key={s.id} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-gray-300 uppercase tracking-tight">
                                                        {s.name}
                                                    </span>
                                                ))}
                                                {(talent.candidateProfile?.skills?.length || 0) > 3 && (
                                                    <span className="px-2 py-1 text-[10px] font-bold text-gray-500">+{talent.candidateProfile.skills.length - 3}</span>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-5 border-t border-white/[0.05] flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Dispo : <span className="text-gray-400">{talent.candidateProfile?.availability || 'À débattre'}</span></span>
                                                <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-[#14B53A] group-hover:text-black transition-all text-gray-500">
                                                    <ArrowRight size={18} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
