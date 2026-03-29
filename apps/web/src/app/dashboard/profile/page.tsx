'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { profileApi } from '@/lib/api';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Briefcase, GraduationCap, Star, Info, CheckCircle2, AlertCircle, Trash2, Globe, Save, Plus } from 'lucide-react';

interface Experience { id: string; title: string; company: string; type: string; startDate: string; endDate?: string; description?: string; }
interface Education { id: string; title: string; institution: string; country: string; year: number; level: string; }
interface Skill { id: string; name: string; level: string; }
interface Profile {
    id: string; title?: string; summary?: string; availability?: string;
    salaryMin?: number; salaryMax?: number; isDiaspora: boolean; completionScore: number;
    experiences: Experience[]; educations: Education[]; skills: Skill[];
    user: { firstName: string; lastName: string; country: string; region?: string; avatarS3Key?: string };
}

const TABS = [
    { key: 'info', label: 'Infos', icon: Info }, { key: 'exp', label: 'Expériences', icon: Briefcase },
    { key: 'edu', label: 'Formations', icon: GraduationCap }, { key: 'skills', label: 'Compétences', icon: Star },
] as const;

type Tab = typeof TABS[number]['key'];

const inputCls = "w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all shadow-inner";
const selectCls = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner";
const addBtnCls = "text-sm bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2";

const tabVariants: Variants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const listVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants: Variants = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function ProfilePage() {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('info');
    const [msg, setMsg] = useState('');
    const [form, setForm] = useState({ title: '', summary: '', availability: '', salaryMin: '', salaryMax: '', isDiaspora: false });
    const [expForm, setExpForm] = useState({ title: '', company: '', type: 'PRIVATE', startDate: '', endDate: '', description: '' });
    const [eduForm, setEduForm] = useState({ title: '', institution: '', country: 'Mali', year: new Date().getFullYear(), level: 'BAC' });
    const [skillForm, setSkillForm] = useState({ name: '', level: 'INTERMEDIATE' });

    const fetchProfile = async () => {
        if (!token) return;
        try {
            const data = await profileApi.get(token);
            setProfile(data);
            setForm({ title: data.title || '', summary: data.summary || '', availability: data.availability || '', salaryMin: data.salaryMin?.toString() || '', salaryMax: data.salaryMax?.toString() || '', isDiaspora: data.isDiaspora || false });
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { if (token) fetchProfile(); }, [token]); // eslint-disable-line

    const saveProfile = async (e: FormEvent) => {
        e.preventDefault(); setSaving(true); setMsg('');
        if (!token) return;
        try {
            const updated = await profileApi.update(token, { ...form, salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null, salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null });
            setProfile(updated); setMsg('✅ Profil mis à jour !');
        } catch { setMsg('❌ Erreur de sauvegarde'); }
        setSaving(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setUploadingAvatar(true);
        try {
            await profileApi.uploadAvatar(token!, e.target.files[0]);
            fetchProfile();
        } catch (err: any) {
            alert(err.message || 'Erreur lors de l\'upload de l\'avatar');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const addExperience = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            await profileApi.addExperience(token, expForm);
            setExpForm({ title: '', company: '', type: 'PRIVATE', startDate: '', endDate: '', description: '' });
            fetchProfile();
        } catch { setMsg('❌ Erreur lors de l\'ajout de l\'expérience'); }
    };
    const addEducation = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            await profileApi.addEducation(token, eduForm);
            setEduForm({ title: '', institution: '', country: 'Mali', year: new Date().getFullYear(), level: 'BAC' });
            fetchProfile();
        } catch { setMsg('❌ Erreur lors de l\'ajout de la formation'); }
    };
    const addSkill = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            await profileApi.addSkill(token, skillForm);
            setSkillForm({ name: '', level: 'INTERMEDIATE' }); fetchProfile();
        } catch { setMsg('❌ Erreur lors de l\'ajout de la compétence'); }
    };
    const removeItem = async (type: 'experiences' | 'educations' | 'skills', id: string) => {
        if (!token) return;
        try {
            if (type === 'experiences') await profileApi.removeExperience(token, id);
            else if (type === 'educations') await profileApi.removeEducation(token, id);
            else if (type === 'skills') await profileApi.removeSkill(token, id);
            fetchProfile();
        } catch { }
    };

    if (!user) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <Link href="/login" className="text-white underline text-sm">Se connecter</Link>
        </div>
    );
    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    );

    const score = profile?.completionScore ?? 0;

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
            </div>
            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliTravail</span>
                    <span className="text-[11px] text-[#FCD116]/70 border border-[#FCD116]/25 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
                </Link>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
            </nav>

            <div className="max-w-3xl mx-auto px-4 py-10">
                {/* Score */}
                <div className="mb-6 glass-card rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none scale-150 -rotate-12">
                        <CheckCircle2 size={120} />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-4">
                            <label className="relative block group cursor-pointer shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                    {profile?.user.avatarS3Key ? (
                                        <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/profile/avatar/${user.id}`} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-slate-400">{profile?.user.firstName[0] || '?'}{profile?.user.lastName[0] || '?'}</span>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                    {uploadingAvatar ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus size={20} className="text-white" />}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                            </label>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">Mon Profil</h1>
                                <p className="text-sm text-gray-400">{profile?.user.firstName} {profile?.user.lastName}</p>
                            </div>
                        </div>
                        <span className={`text-3xl font-bold tracking-tighter ${score >= 80 ? 'text-[#14B53A]' : score >= 50 ? 'text-[#FCD116]' : 'text-red-400'}`}>{score}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 relative z-10 overflow-hidden">
                        <div className={`h-2 rounded-full transition-all duration-1000 ease-out ${score >= 80 ? 'bg-gradient-to-r from-[#14B53A]/80 to-[#14B53A]' : score >= 50 ? 'bg-[#FCD116]' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 relative z-10 flex items-center gap-1.5">
                        {score < 50 ? <><AlertCircle size={14} className="text-red-400" /> Complétez votre profil pour être visible des recruteurs</> : score < 80 ? <><AlertCircle size={14} className="text-[#FCD116]" /> Bon début ! Ajoutez plus de détails</> : <><CheckCircle2 size={14} className="text-[#14B53A]" /> Excellent ! Votre profil est bien rempli</>}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 p-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-md overflow-x-auto hide-scrollbar">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'}`}>
                                <Icon size={16} className={activeTab === tab.key ? "text-black" : "text-gray-500"} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Info tab */}
                {activeTab === 'info' && (
                    <motion.form variants={tabVariants} initial="hidden" animate="show" onSubmit={saveProfile} className="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
                        <h2 className="text-white font-semibold text-lg flex items-center gap-2"><Info size={20} className="text-[#14B53A]" /> Informations professionnelles</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Titre professionnel</label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Ex: Comptable OHADA, Développeur Web..." />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Résumé profil</label>
                                <textarea value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} rows={4}
                                    className={inputCls + " resize-y"} placeholder="Décrivez vos compétences et ce que vous recherchez..." />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Disponibilité</label>
                                <select value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))} className={selectCls}>
                                    <option value="">Choisir...</option>
                                    <option value="IMMEDIATE">Disponible immédiatement</option>
                                    <option value="NOTICE">Sous préavis</option>
                                    <option value="LISTENING">En veille</option>
                                    <option value="UNAVAILABLE">Non disponible</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Salaire min (FCFA)</label>
                                    <input type="number" value={form.salaryMin} onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))} className={inputCls} placeholder="150 000" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Salaire max (FCFA)</label>
                                    <input type="number" value={form.salaryMax} onChange={e => setForm(p => ({ ...p, salaryMax: e.target.value }))} className={inputCls} placeholder="300 000" />
                                </div>
                            </div>
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                            <input type="checkbox" checked={form.isDiaspora} onChange={e => setForm(p => ({ ...p, isDiaspora: e.target.checked }))} className="accent-[#14B53A] w-5 h-5 mt-0.5 rounded" />
                            <div>
                                <span className="text-sm font-medium text-white flex items-center gap-1.5"><Globe size={16} className="text-[#FCD116]" /> Je suis membre de la diaspora malienne</span>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Je réside actuellement hors du Mali et je suis ouvert(e) aux opportunités locales ou en télétravail.</p>
                            </div>
                        </label>
                        {msg && <p className={`text-sm flex items-center gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 ${msg.includes('Erreur') ? 'text-red-400' : 'text-[#14B53A]'}`}>
                            {msg.includes('Erreur') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                            {msg.replace(/[✅❌]/g, '').trim()}
                        </p>}
                        <button type="submit" disabled={saving} className={addBtnCls + " w-full py-3.5 mt-2"}>
                            {saving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save size={18} />}
                            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                    </motion.form>
                )}

                {/* Experiences tab */}
                {activeTab === 'exp' && (
                    <motion.div variants={tabVariants} initial="hidden" animate="show" className="space-y-4">
                        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
                            {profile?.experiences.map(exp => (
                                <motion.div variants={itemVariants} key={exp.id} className="group glass-card glass-card-hover flex justify-between items-start rounded-2xl p-5">
                                    <div>
                                        <h3 className="text-white font-semibold text-base mb-1">{exp.title}</h3>
                                        <p className="text-gray-400 text-sm flex items-center gap-2"><Briefcase size={14} className="text-[#FCD116]" /> {exp.company} <span className="opacity-50">·</span> <span className="text-gray-500">{exp.type === 'PUBLIC' ? 'Public' : exp.type === 'ONG' ? 'ONG' : 'Privé'}</span></p>
                                        <p className="text-gray-500 text-xs mt-1.5 font-medium">{new Date(exp.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} — {exp.endDate ? new Date(exp.endDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : 'Aujourd\'hui'}</p>
                                        {exp.description && <p className="text-gray-500 text-sm mt-3 whitespace-pre-line border-l-2 border-white/10 pl-3 py-0.5">{exp.description}</p>}
                                    </div>
                                    <button onClick={() => removeItem('experiences', exp.id)} className="text-gray-600 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                </motion.div>
                            ))}
                        </motion.div>
                        <form onSubmit={addExperience} className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 mt-6 border-t border-white/[0.04]">
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2"><Plus size={18} className="text-[#14B53A]" /> Ajouter une expérience</h3>
                            <input value={expForm.title} onChange={e => setExpForm(p => ({ ...p, title: e.target.value }))} required className={inputCls} placeholder="Intitulé du poste" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input value={expForm.company} onChange={e => setExpForm(p => ({ ...p, company: e.target.value }))} required className={inputCls} placeholder="Entreprise / Organisme" />
                                <select value={expForm.type} onChange={e => setExpForm(p => ({ ...p, type: e.target.value }))} className={selectCls}>
                                    <option value="PRIVATE">Secteur privé</option>
                                    <option value="PUBLIC">Secteur public</option>
                                    <option value="ONG">ONG / International</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Début</label>
                                    <input type="date" value={expForm.startDate} onChange={e => setExpForm(p => ({ ...p, startDate: e.target.value }))} required className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Fin (vide si en cours)</label>
                                    <input type="date" value={expForm.endDate} onChange={e => setExpForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                                </div>
                            </div>
                            <textarea value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} rows={3} className={inputCls + " resize-y"} placeholder="Missions et réalisations (optionnel)" />
                            <button type="submit" className={addBtnCls + " w-full sm:w-auto"}><Plus size={16} /> Ajouter l&apos;expérience</button>
                        </form>
                    </motion.div>
                )}

                {/* Education tab */}
                {activeTab === 'edu' && (
                    <motion.div variants={tabVariants} initial="hidden" animate="show" className="space-y-4">
                        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
                            {profile?.educations.map(edu => (
                                <motion.div variants={itemVariants} key={edu.id} className="group glass-card glass-card-hover flex justify-between items-start rounded-2xl p-5">
                                    <div>
                                        <h3 className="text-white font-semibold text-base mb-1">{edu.title}</h3>
                                        <p className="text-gray-400 text-sm flex items-center gap-2"><GraduationCap size={14} className="text-[#CE1126]" /> {edu.institution} <span className="opacity-50">·</span> <span className="text-gray-500">{edu.country}</span></p>
                                        <p className="text-[#14B53A] text-xs mt-1.5 font-medium border border-[#14B53A]/20 bg-[#14B53A]/5 inline-block px-2 py-0.5 rounded-md">{edu.year} · {edu.level}</p>
                                    </div>
                                    <button onClick={() => removeItem('educations', edu.id)} className="text-gray-600 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                </motion.div>
                            ))}
                        </motion.div>
                        <form onSubmit={addEducation} className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 mt-6 border-t border-white/[0.04]">
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2"><Plus size={18} className="text-[#14B53A]" /> Ajouter une formation</h3>
                            <input value={eduForm.title} onChange={e => setEduForm(p => ({ ...p, title: e.target.value }))} required className={inputCls} placeholder="Intitulé du diplôme ou certification" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input value={eduForm.institution} onChange={e => setEduForm(p => ({ ...p, institution: e.target.value }))} required className={inputCls} placeholder="Établissement (ex: FSEG Bamako)" />
                                <input value={eduForm.country} onChange={e => setEduForm(p => ({ ...p, country: e.target.value }))} required className={inputCls} placeholder="Pays" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Année d&apos;obtention</label>
                                    <input type="number" value={eduForm.year} onChange={e => setEduForm(p => ({ ...p, year: parseInt(e.target.value) || 0 }))} required className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Niveau</label>
                                    <select value={eduForm.level} onChange={e => setEduForm(p => ({ ...p, level: e.target.value }))} className={selectCls}>
                                        {['Aucun diplôme', 'BEPC', 'BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'Doctorat', 'Formation professionnelle'].map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className={addBtnCls + " w-full sm:w-auto"}><Plus size={16} /> Ajouter la formation</button>
                        </form>
                    </motion.div>
                )}

                {/* Skills tab */}
                {activeTab === 'skills' && (
                    <motion.div variants={tabVariants} initial="hidden" animate="show" className="space-y-6">
                        <motion.div variants={listVariants} initial="hidden" animate="show" className="flex flex-wrap gap-2.5">
                            {profile?.skills.map(sk => (
                                <motion.div variants={itemVariants} key={sk.id} className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-colors px-4 py-2">
                                    <Star size={14} className={sk.level === 'EXPERT' ? "text-[#FCD116]" : sk.level === 'ADVANCED' ? "text-[#14B53A]" : "text-gray-500"} />
                                    <span className="text-white text-sm font-medium">{sk.name}</span>
                                    <span className="text-gray-500 text-xs">({sk.level === 'BEGINNER' ? 'Débutant' : sk.level === 'INTERMEDIATE' ? 'Intermédiaire' : sk.level === 'ADVANCED' ? 'Avancé' : 'Expert'})</span>
                                    <button onClick={() => removeItem('skills', sk.id)} className="text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-full w-5 h-5 flex items-center justify-center transition-all ml-1"><Trash2 size={12} /></button>
                                </motion.div>
                            ))}
                        </motion.div>
                        <form onSubmit={addSkill} className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 border-t border-white/[0.04]">
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2"><Plus size={18} className="text-[#14B53A]" /> Ajouter une compétence</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input value={skillForm.name} onChange={e => setSkillForm(p => ({ ...p, name: e.target.value }))} required className={inputCls} placeholder="Ex: Microsoft Excel, JavaScript, Node..." />
                                <select value={skillForm.level} onChange={e => setSkillForm(p => ({ ...p, level: e.target.value }))} className={selectCls}>
                                    <option value="BEGINNER">Débutant (Notions basiques)</option>
                                    <option value="INTERMEDIATE">Intermédiaire (Opérationnel)</option>
                                    <option value="ADVANCED">Avancé (Très bonne maîtrise)</option>
                                    <option value="EXPERT">Expert (Maîtrise totale / Formateur)</option>
                                </select>
                            </div>
                            <button type="submit" className={addBtnCls + " w-full sm:w-auto"}><Plus size={16} /> Ajouter la compétence</button>
                        </form>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
