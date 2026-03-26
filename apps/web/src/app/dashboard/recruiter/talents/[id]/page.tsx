'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { talentsApi } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import { motion, Variants } from 'framer-motion';
import { 
    Briefcase, GraduationCap, Star, Info, 
    Globe, User as UserIcon, MapPin, Calendar, Mail, Phone, ArrowLeft
} from 'lucide-react';

interface Experience { id: string; title: string; company: string; type: string; startDate: string; endDate?: string; description?: string; }
interface Education { id: string; title: string; institution: string; country: string; year: number; level: string; }
interface Skill { id: string; name: string; level: string; }
interface Talent {
    id: string; firstName: string; lastName: string; email?: string; phone: string; country: string; region?: string;
    candidateProfile?: {
        title?: string; summary?: string; availability?: string; isDiaspora: boolean;
        experiences: Experience[]; educations: Education[]; skills: Skill[];
    };
}

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function TalentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, token } = useAuth();
    const [talent, setTalent] = useState<Talent | null>(null);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        if (!token || !id) return;
        setLoading(true);
        talentsApi.getOne(token, id)
            .then(data => {
                if (!data) router.push('/dashboard/recruiter/talents');
                else setTalent(data);
            })
            .catch(() => router.push('/dashboard/recruiter/talents'))
            .finally(() => setLoading(false));
    }, [token, id, router]);

    if (!user || (user.role !== 'RECRUITER' && user.role !== 'ADMIN')) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Accès restreint aux recruteurs.</div>;
    }

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#14B53A]/20 border-t-[#14B53A] rounded-full animate-spin" /></div>;

    if (!talent) return null;

    const profile = talent.candidateProfile;
    const avatarUrl = `${API_URL}/profile/avatar/${talent.id}`;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#14B53A]/30">
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
            </div>
            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliLink</span>
                </Link>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <Link href="/dashboard/recruiter/talents" className="text-sm text-gray-500 hover:text-white transition flex items-center gap-1.5"><ArrowLeft size={14} /> Retour à la recherche</Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-10">
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
                    {/* Header Card */}
                    <motion.div variants={itemVariants} className="glass-card rounded-[32px] p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none scale-150 -rotate-12 text-[#14B53A]">
                            <UserIcon size={120} />
                        </div>
                        
                        <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
                            <img 
                                src={avatarUrl} 
                                alt={`${talent.firstName} ${talent.lastName}`} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(talent.firstName + ' ' + talent.lastName) + '&background=111&color=fff&size=128';
                                }}
                            />
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter text-white">{talent.firstName} {talent.lastName}</h1>
                                <p className="text-[#FCD116] text-xl font-bold mt-1">{profile?.title || 'Candidat MaliLink'}</p>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400 font-medium">
                                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5"><MapPin size={14} className="text-[#CE1126]" /> {talent.city || talent.country}</span>
                                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5"><Globe size={14} className="text-[#14B53A]" /> {profile?.isDiaspora ? 'Diaspora Malienne' : 'Au Mali'}</span>
                                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5"><Calendar size={14} className="text-[#FCD116]" /> {profile?.availability === 'IMMEDIATE' ? 'Disponible Immédiatement' : 'Disponibilité à discuter'}</span>
                            </div>

                            <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-3">
                                {talent.email && (
                                    <a href={`mailto:${talent.email}`} className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                                        <Mail size={16} /> {talent.email}
                                    </a>
                                )}
                                <a href={`tel:${talent.phone}`} className="flex items-center gap-2 bg-white/5 border border-white/10 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                                    <Phone size={16} /> {talent.phone}
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column (Main Info) */}
                        <div className="md:col-span-2 space-y-8">
                            {/* Summary */}
                            <motion.section variants={itemVariants} className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-8">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#14B53A]"><Info size={20} /> À propos</h2>
                                <p className="text-gray-400 leading-relaxed whitespace-pre-line text-sm md:text-base">
                                    {profile?.summary || "Ce candidat n'a pas encore ajouté de résumé à son profil."}
                                </p>
                            </motion.section>

                            {/* Experience */}
                            <motion.section variants={itemVariants} className="space-y-4">
                                <h2 className="text-lg font-bold flex items-center gap-2 text-[#FCD116] ml-2"><Briefcase size={20} /> Parcours Professionnel</h2>
                                <div className="space-y-4">
                                    {profile?.experiences && profile.experiences.length > 0 ? profile.experiences.map(exp => (
                                        <div key={exp.id} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 relative group hover:bg-white/[0.04] transition-colors">
                                            <div className="absolute left-0 top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#FCD116] to-transparent opacity-50"></div>
                                            <div className="pl-4">
                                                <h3 className="font-bold text-white text-lg">{exp.title}</h3>
                                                <p className="text-gray-400 font-medium text-sm mb-2">{exp.company} <span className="text-gray-600 mx-2">·</span> {exp.type}</p>
                                                <p className="text-xs text-gray-500 mb-4 bg-white/5 px-2 py-1 rounded-md inline-block">
                                                    {new Date(exp.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} — {exp.endDate ? new Date(exp.endDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : "Aujourd'hui"}
                                                </p>
                                                <p className="text-gray-400 text-sm whitespace-pre-line leading-relaxed">{exp.description}</p>
                                            </div>
                                        </div>
                                    )) : <p className="text-gray-600 italic ml-2">Aucune expérience renseignée.</p>}
                                </div>
                            </motion.section>

                            {/* Education */}
                            <motion.section variants={itemVariants} className="space-y-4">
                                <h2 className="text-lg font-bold flex items-center gap-2 text-[#CE1126] ml-2"><GraduationCap size={20} /> Éducation & Formations</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {profile?.educations && profile.educations.length > 0 ? profile.educations.map(edu => (
                                        <div key={edu.id} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
                                            <p className="text-[#CE1126] text-[10px] font-black uppercase tracking-widest mb-1">{edu.level}</p>
                                            <h3 className="font-bold text-white text-base mb-1">{edu.title}</h3>
                                            <p className="text-gray-500 text-sm">{edu.institution}</p>
                                            <p className="text-gray-600 text-xs mt-3 flex items-center justify-between">
                                                <span>{edu.country}</span>
                                                <span className="font-bold">{edu.year}</span>
                                            </p>
                                        </div>
                                    )) : <p className="text-gray-600 italic ml-2 col-span-2">Aucune formation renseignée.</p>}
                                </div>
                            </motion.section>
                        </div>

                        {/* Right Column (Skills & Meta) */}
                        <div className="space-y-8">
                            {/* Skills */}
                            <motion.section variants={itemVariants} className="bg-white/[0.03] border border-white/[0.08] rounded-[32px] p-8">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-[#14B53A]"><Star size={20} /> Compétences</h2>
                                <div className="flex flex-wrap gap-2.5">
                                    {profile?.skills && profile.skills.length > 0 ? profile.skills.map(skill => (
                                        <div key={skill.id} className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-xs font-bold text-gray-300 flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${skill.level === 'EXPERT' ? 'bg-[#FCD116]' : skill.level === 'ADVANCED' ? 'bg-[#14B53A]' : 'bg-gray-600'}`}></div>
                                            {skill.name}
                                        </div>
                                    )) : <p className="text-gray-600 italic text-sm">Aucune compétence ajoutée.</p>}
                                </div>
                            </motion.section>

                            {/* Contact Box */}
                            <motion.section variants={itemVariants} className="bg-gradient-to-br from-[#14B53A]/20 to-transparent border border-[#14B53A]/20 rounded-[32px] p-8 text-center space-y-6">
                                <h3 className="font-bold text-lg">Intéressé par ce profil ?</h3>
                                <p className="text-sm text-[#14B53A]/80 font-medium">Contactez directement le candidat pour discuter de vos opportunités.</p>
                                <button className="w-full bg-[#14B53A] text-black font-black py-4 rounded-2xl hover:bg-[#14B53A]/90 transition-all transform active:scale-95 shadow-xl">
                                    Contacter {talent.firstName}
                                </button>
                            </motion.section>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
