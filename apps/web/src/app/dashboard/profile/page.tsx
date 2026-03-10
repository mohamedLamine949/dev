'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Experience { id: string; title: string; company: string; type: string; startDate: string; endDate?: string; description?: string; }
interface Education { id: string; title: string; institution: string; country: string; year: number; level: string; }
interface Skill { id: string; name: string; level: string; }
interface Profile {
    id: string; title?: string; summary?: string; availability?: string;
    salaryMin?: number; salaryMax?: number; isDiaspora: boolean; completionScore: number;
    experiences: Experience[]; educations: Education[]; skills: Skill[];
    user: { firstName: string; lastName: string; country: string; region?: string; };
}

const TABS = [
    { key: 'info', label: 'Infos' }, { key: 'exp', label: 'Expériences' },
    { key: 'edu', label: 'Formations' }, { key: 'skills', label: 'Compétences' },
] as const;

type Tab = typeof TABS[number]['key'];

const inputCls = "w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition";
const selectCls = "w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition";
const addBtnCls = "text-sm bg-white text-black font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition";

export default function ProfilePage() {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('info');
    const [msg, setMsg] = useState('');
    const [form, setForm] = useState({ title: '', summary: '', availability: '', salaryMin: '', salaryMax: '', isDiaspora: false });
    const [expForm, setExpForm] = useState({ title: '', company: '', type: 'PRIVATE', startDate: '', endDate: '', description: '' });
    const [eduForm, setEduForm] = useState({ title: '', institution: '', country: 'Mali', year: new Date().getFullYear(), level: 'BAC' });
    const [skillForm, setSkillForm] = useState({ name: '', level: 'INTERMEDIATE' });

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API}/profile/me`, { headers });
            const data = await res.json();
            setProfile(data);
            setForm({ title: data.title || '', summary: data.summary || '', availability: data.availability || '', salaryMin: data.salaryMin?.toString() || '', salaryMax: data.salaryMax?.toString() || '', isDiaspora: data.isDiaspora || false });
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { if (token) fetchProfile(); }, [token]); // eslint-disable-line

    const saveProfile = async (e: FormEvent) => {
        e.preventDefault(); setSaving(true); setMsg('');
        try {
            const res = await fetch(`${API}/profile/me`, { method: 'PATCH', headers, body: JSON.stringify({ ...form, salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null, salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null }) });
            const updated = await res.json(); setProfile(updated); setMsg('✅ Profil mis à jour !');
        } catch { setMsg('❌ Erreur de sauvegarde'); }
        setSaving(false);
    };

    const addExperience = async (e: FormEvent) => {
        e.preventDefault();
        await fetch(`${API}/profile/me/experiences`, { method: 'POST', headers, body: JSON.stringify(expForm) });
        setExpForm({ title: '', company: '', type: 'PRIVATE', startDate: '', endDate: '', description: '' });
        fetchProfile();
    };
    const addEducation = async (e: FormEvent) => {
        e.preventDefault();
        await fetch(`${API}/profile/me/educations`, { method: 'POST', headers, body: JSON.stringify(eduForm) });
        setEduForm({ title: '', institution: '', country: 'Mali', year: new Date().getFullYear(), level: 'BAC' });
        fetchProfile();
    };
    const addSkill = async (e: FormEvent) => {
        e.preventDefault();
        await fetch(`${API}/profile/me/skills`, { method: 'POST', headers, body: JSON.stringify(skillForm) });
        setSkillForm({ name: '', level: 'INTERMEDIATE' }); fetchProfile();
    };
    const removeItem = async (type: string, id: string) => {
        await fetch(`${API}/profile/me/${type}/${id}`, { method: 'DELETE', headers }); fetchProfile();
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
                    <span className="text-white font-bold tracking-tight">MaliLink</span>
                    <span className="text-[11px] text-[#FCD116]/70 border border-[#FCD116]/25 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
                </Link>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
            </nav>

            <div className="max-w-3xl mx-auto px-4 py-10">
                {/* Score */}
                <div className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-lg font-bold text-white">Mon Profil</h1>
                        <span className={`text-2xl font-bold ${score >= 80 ? 'text-[#14B53A]' : score >= 50 ? 'text-[#FCD116]' : 'text-red-400'}`}>{score}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all duration-500 ${score >= 80 ? 'bg-[#14B53A]' : score >= 50 ? 'bg-[#FCD116]' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {score < 50 ? 'Complétez votre profil pour être visible des recruteurs' : score < 80 ? 'Bon début ! Ajoutez plus de détails' : 'Excellent ! Votre profil est bien rempli 🎉'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    {TABS.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.key ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Info tab */}
                {activeTab === 'info' && (
                    <form onSubmit={saveProfile} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-4">
                        <h2 className="text-white font-semibold text-sm">Informations professionnelles</h2>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Titre professionnel</label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Ex: Comptable OHADA, Développeur Web..." />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Résumé profil</label>
                            <textarea value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} rows={4}
                                className={inputCls + " resize-y"} placeholder="Décrivez vos compétences et ce que vous recherchez..." />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Disponibilité</label>
                            <select value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))} className={selectCls}>
                                <option value="">Choisir...</option>
                                <option value="IMMEDIATE">🟢 Disponible immédiatement</option>
                                <option value="NOTICE">🟡 Sous préavis</option>
                                <option value="LISTENING">🔵 En veille</option>
                                <option value="UNAVAILABLE">🔴 Non disponible</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5">Salaire min (FCFA)</label>
                                <input type="number" value={form.salaryMin} onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))} className={inputCls} placeholder="150 000" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5">Salaire max (FCFA)</label>
                                <input type="number" value={form.salaryMax} onChange={e => setForm(p => ({ ...p, salaryMax: e.target.value }))} className={inputCls} placeholder="300 000" />
                            </div>
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked={form.isDiaspora} onChange={e => setForm(p => ({ ...p, isDiaspora: e.target.checked }))} className="accent-white w-4 h-4 mt-0.5" />
                            <div>
                                <span className="text-sm text-white">Je suis membre de la diaspora malienne</span>
                                <p className="text-xs text-gray-500 mt-0.5">Je réside actuellement hors du Mali</p>
                            </div>
                        </label>
                        {msg && <p className={`text-sm ${msg.startsWith('✅') ? 'text-[#14B53A]' : 'text-red-400'}`}>{msg}</p>}
                        <button type="submit" disabled={saving} className={addBtnCls + " w-full py-2.5"}>
                            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                    </form>
                )}

                {/* Experiences tab */}
                {activeTab === 'exp' && (
                    <div className="space-y-3">
                        {profile?.experiences.map(exp => (
                            <div key={exp.id} className="flex justify-between items-start rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                                <div>
                                    <h3 className="text-white font-medium text-sm">{exp.title}</h3>
                                    <p className="text-gray-500 text-xs">{exp.company} · {exp.type === 'PUBLIC' ? 'Public' : exp.type === 'ONG' ? 'ONG' : 'Privé'}</p>
                                    <p className="text-gray-600 text-xs mt-0.5">{new Date(exp.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} — {exp.endDate ? new Date(exp.endDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : 'Aujourd\'hui'}</p>
                                </div>
                                <button onClick={() => removeItem('experiences', exp.id)} className="text-xs text-gray-600 hover:text-red-400 transition">Supprimer</button>
                            </div>
                        ))}
                        <form onSubmit={addExperience} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-3">
                            <h3 className="text-white font-semibold text-sm">Ajouter une expérience</h3>
                            <input value={expForm.title} onChange={e => setExpForm(p => ({ ...p, title: e.target.value }))} required className={inputCls} placeholder="Intitulé du poste" />
                            <div className="grid grid-cols-2 gap-3">
                                <input value={expForm.company} onChange={e => setExpForm(p => ({ ...p, company: e.target.value }))} required className={inputCls} placeholder="Entreprise / Organisme" />
                                <select value={expForm.type} onChange={e => setExpForm(p => ({ ...p, type: e.target.value }))} className={selectCls}>
                                    <option value="PRIVATE">Secteur privé</option>
                                    <option value="PUBLIC">Secteur public</option>
                                    <option value="ONG">ONG / International</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Début</label>
                                    <input type="date" value={expForm.startDate} onChange={e => setExpForm(p => ({ ...p, startDate: e.target.value }))} required className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Fin (vide si en cours)</label>
                                    <input type="date" value={expForm.endDate} onChange={e => setExpForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                                </div>
                            </div>
                            <textarea value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inputCls + " resize-y"} placeholder="Missions et réalisations (optionnel)" />
                            <button type="submit" className={addBtnCls}>+ Ajouter</button>
                        </form>
                    </div>
                )}

                {/* Education tab */}
                {activeTab === 'edu' && (
                    <div className="space-y-3">
                        {profile?.educations.map(edu => (
                            <div key={edu.id} className="flex justify-between items-start rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                                <div>
                                    <h3 className="text-white font-medium text-sm">{edu.title}</h3>
                                    <p className="text-gray-500 text-xs">{edu.institution}, {edu.country}</p>
                                    <p className="text-gray-600 text-xs mt-0.5">{edu.year} · {edu.level}</p>
                                </div>
                                <button onClick={() => removeItem('educations', edu.id)} className="text-xs text-gray-600 hover:text-red-400 transition">Supprimer</button>
                            </div>
                        ))}
                        <form onSubmit={addEducation} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-3">
                            <h3 className="text-white font-semibold text-sm">Ajouter une formation</h3>
                            <input value={eduForm.title} onChange={e => setEduForm(p => ({ ...p, title: e.target.value }))} required className={inputCls} placeholder="Intitulé du diplôme" />
                            <div className="grid grid-cols-2 gap-3">
                                <input value={eduForm.institution} onChange={e => setEduForm(p => ({ ...p, institution: e.target.value }))} required className={inputCls} placeholder="Établissement" />
                                <input value={eduForm.country} onChange={e => setEduForm(p => ({ ...p, country: e.target.value }))} required className={inputCls} placeholder="Pays" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Année d&apos;obtention</label>
                                    <input type="number" value={eduForm.year} onChange={e => setEduForm(p => ({ ...p, year: parseInt(e.target.value) || 0 }))} required className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Niveau</label>
                                    <select value={eduForm.level} onChange={e => setEduForm(p => ({ ...p, level: e.target.value }))} className={selectCls}>
                                        {['Aucun diplôme', 'BEPC', 'BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'Doctorat', 'Formation professionnelle'].map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className={addBtnCls}>+ Ajouter</button>
                        </form>
                    </div>
                )}

                {/* Skills tab */}
                {activeTab === 'skills' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {profile?.skills.map(sk => (
                                <div key={sk.id} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                                    <span className="text-white text-sm">{sk.name}</span>
                                    <span className="text-gray-500 text-xs">({sk.level === 'BEGINNER' ? 'Débutant' : sk.level === 'INTERMEDIATE' ? 'Intermédaire' : sk.level === 'ADVANCED' ? 'Avancé' : 'Expert'})</span>
                                    <button onClick={() => removeItem('skills', sk.id)} className="text-gray-600 hover:text-red-400 text-xs ml-0.5 transition">×</button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={addSkill} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-3">
                            <h3 className="text-white font-semibold text-sm">Ajouter une compétence</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <input value={skillForm.name} onChange={e => setSkillForm(p => ({ ...p, name: e.target.value }))} required className={inputCls} placeholder="Ex: Excel, Comptabilité..." />
                                <select value={skillForm.level} onChange={e => setSkillForm(p => ({ ...p, level: e.target.value }))} className={selectCls}>
                                    <option value="BEGINNER">Débutant</option>
                                    <option value="INTERMEDIATE">Intermédiaire</option>
                                    <option value="ADVANCED">Avancé</option>
                                    <option value="EXPERT">Expert</option>
                                </select>
                            </div>
                            <button type="submit" className={addBtnCls}>+ Ajouter</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
