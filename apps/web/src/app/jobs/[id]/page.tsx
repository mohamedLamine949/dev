'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { documentsApi, savedJobsApi, Job } from '@/lib/api';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    MapPin, Building, Activity, CalendarDays,
    Clock, Users, GraduationCap, Briefcase,
    FileText, CheckCircle2, ChevronLeft, Send,
    Share2, AlertCircle, Globe2, Heart, Eye
} from 'lucide-react';

interface VaultDoc { id: string; name: string; category: string; }

const EXP_MAP: Record<string, string> = { NONE: 'Aucune', '1_2': '1 à 2 ans', '3_5': '3 à 5 ans', PLUS_5: '+5 ans' };
const TYPE_MAP: Record<string, string> = { CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', CONCOURS: 'Concours', VOLONTARIAT: 'Volontariat', APPRENTISSAGE: 'Apprentissage' };

function formatDate(d: string) { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
function daysLeft(deadline: string) { return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000); }

const cardCls = "glass-card rounded-2xl p-6";
const rowCls = "flex justify-between items-center text-sm py-2 border-b border-white/[0.04] last:border-0";
const pageVariants: Variants = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1, transition: { duration: 0.4 } } };
const modalVariants: Variants = { hidden: { opacity: 0, scale: 0.95, y: 20 }, show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } }, exit: { opacity: 0, scale: 0.95, y: 20 } };

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, token } = useAuth();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applied, setApplied] = useState(false);
    const [isFavoriteProcessing, setIsFavoriteProcessing] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [vaultDocs, setVaultDocs] = useState<VaultDoc[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<Record<string, string>>({});
    const [coverLetter, setCoverLetter] = useState('');
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState('');

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const fetchJob = useCallback(async () => {
        try {
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${API}/jobs/${id}`, { headers });
            if (!res.ok) throw new Error('Offre introuvable');
            const data = await res.json();
            setJob(data);
        } catch { router.push('/jobs'); }
        finally { setLoading(false); }
    }, [id, API, router, token]);

    useEffect(() => { fetchJob(); }, [fetchJob]);

    const toggleFavorite = async () => {
        if (!token || !user || user.role !== 'CANDIDATE' || !job) return;
        setIsFavoriteProcessing(true);
        try {
            if (job.isSaved) {
                await savedJobsApi.remove(token, job.id);
            } else {
                await savedJobsApi.save(token, job.id);
            }
            setJob(prev => prev ? { ...prev, isSaved: !prev.isSaved } : null);
        } catch (err) {
            console.error('Erreur favori:', err);
        } finally {
            setIsFavoriteProcessing(false);
        }
    };

    const openApplyModal = async () => {
        if (!token || !job) return;
        setShowModal(true); setApplyError('');
        if (job.requiredDocs && job.requiredDocs.length > 0) {
            setLoadingDocs(true);
            try {
                const docs = await documentsApi.list(token);
                setVaultDocs(docs);
                const initialSelected: Record<string, string> = {};
                job.requiredDocs.forEach(req => {
                    const match = docs.find(d => d.category === req.documentCategory);
                    if (match) initialSelected[req.id] = match.id;
                });
                setSelectedDocs(initialSelected);
            } catch { setApplyError("Impossible de charger votre coffre-fort."); }
            finally { setLoadingDocs(false); }
        }
    };

    const submitApplication = async () => {
        if (!token || !job) return;
        const applicationDocs: { category: string; documentId: string }[] = [];
        if (job.requiredDocs) {
            for (const req of job.requiredDocs) {
                const docId = selectedDocs[req.id];
                if (!docId && !req.isOptional) {
                    setApplyError(`Le document "${req.label}" est requis.`);
                    return;
                }
                if (docId) applicationDocs.push({ category: req.documentCategory, documentId: docId });
            }
        }
        setApplying(true); setApplyError('');
        try {
            const res = await fetch(`${API}/jobs/${id}/apply`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ coverLetter, applicationDocs }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erreur lors de la candidature');
            setApplied(true); setShowModal(false);
        } catch (err: unknown) { setApplyError(err instanceof Error ? err.message : 'Erreur'); }
        finally { setApplying(false); }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>;
    if (!job) return null;

    const dl = daysLeft(job.deadline);
    const regions = (() => { try { return JSON.parse(job.regions); } catch { return [job.regions]; } })();
    const eduLevels = (() => { try { return job.educationLevel ? JSON.parse(job.educationLevel) : []; } catch { return [job.educationLevel || '']; } })();

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50"><div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" /></div>
            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2"><span className="text-white font-bold tracking-tight">MaliTravail</span><span className="text-[11px] text-[#FCD116]/70 border border-[#FCD116]/25 rounded px-1.5 py-0.5 leading-none">🇲🇱</span></Link>
                <Link href="/jobs" className="text-sm text-gray-400 hover:text-white transition group flex items-center gap-1"><span className="group-hover:-translate-x-1 transition-transform">←</span> Retour aux offres</Link>
            </nav>

            <motion.div variants={pageVariants} initial="hidden" animate="show" className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
                <div className="lg:col-span-2 space-y-4">
                    <div className={cardCls + " relative overflow-hidden"}>
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none scale-150 rotate-12"><Activity size={120} /></div>
                        <div className="flex gap-2 flex-wrap mb-4 relative z-10">
                            <span className="text-[11px] font-semibold border border-white/20 text-white rounded-full px-2.5 py-0.5">{TYPE_MAP[job.type] || job.type}</span>
                            {job.isDiasporaOpen && <span className="text-[11px] border border-white/10 text-gray-300 rounded-full px-2.5 py-0.5 flex items-center gap-1">🌍 Diaspora</span>}
                            {job.isRemoteAbroad && <span className="text-[11px] border border-white/10 text-gray-300 rounded-full px-2.5 py-0.5 flex items-center gap-1">💻 Télétravail</span>}
                            {dl <= 2 && dl > 0 && <span className="text-[11px] border border-red-500/30 text-red-400 rounded-full px-2.5 py-0.5 animate-pulse flex items-center gap-1">⚡ Urgent</span>}
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight mb-2 relative z-10">{job.title}</h1>
                        <p className="text-gray-400 flex items-center gap-2 relative z-10">
                            <Building size={16} /> {job.isExternal ? job.externalCompany : job.employer?.name}{job.employer?.isVerified && <CheckCircle2 size={16} className="text-[#14B53A]" />}
                        </p>
                        <div className="flex flex-wrap gap-x-5 gap-y-3 mt-5 text-sm text-gray-500 relative z-10">
                            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400" /> {regions.join(', ')}</span>
                            <span className="flex items-center gap-1.5"><Activity size={16} className="text-gray-400" /> {job.sector}</span>
                            <span className="flex items-center gap-1.5"><Eye size={16} className="text-gray-400" /> {job.viewCount || 0} vues</span>
                            <span className="flex items-center gap-1.5"><Users size={16} className="text-gray-400" /> {job.applicationCount || 0} candidature{job.applicationCount !== 1 && 's'}</span>
                        </div>
                    </div>
                    <div className={cardCls}><h2 className="flex items-center gap-2 text-white font-semibold mb-4 text-lg"><FileText size={20} className="text-[#14B53A]" /> Description du poste</h2><p className="text-gray-400 whitespace-pre-line leading-relaxed text-sm">{job.description}</p></div>
                    {job.requirements && <div className={cardCls}><h2 className="flex items-center gap-2 text-white font-semibold mb-4 text-lg"><CheckCircle2 size={20} className="text-[#FCD116]" /> Profil recherché</h2><p className="text-gray-400 whitespace-pre-line leading-relaxed text-sm">{job.requirements}</p></div>}
                    {job.requiredDocs && job.requiredDocs.length > 0 && (
                        <div className={cardCls}>
                            <h2 className="text-white font-semibold mb-3">Documents requis</h2>
                            <ul className="space-y-2">
                                {job.requiredDocs.map(doc => (
                                    <li key={doc.id} className="flex items-center gap-3 text-sm">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${doc.isOptional ? 'bg-gray-600' : 'bg-white'}`} />
                                        <span className="text-gray-300">{doc.label}</span>
                                        {doc.isOptional && <span className="text-gray-600 text-xs">(optionnel)</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="sticky top-20 space-y-4">
                        <div className={cardCls + " space-y-4"}>
                            {user?.role === 'CANDIDATE' && (
                                <button
                                    onClick={toggleFavorite}
                                    disabled={isFavoriteProcessing}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-300 ${job.isSaved ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}
                                >
                                    <Heart size={18} fill={job.isSaved ? "currentColor" : "none"} className={isFavoriteProcessing ? 'animate-pulse' : ''} />
                                    {job.isSaved ? 'Enregistré' : 'Enregistrer'}
                                </button>
                            )}
                            {(job.salaryMin || job.salaryMax) && (
                                <div className="text-center py-2 border-b border-white/[0.06]"><p className="text-gray-500 text-xs mb-1">Salaire</p><p className="text-white font-bold">{job.salaryMin?.toLocaleString()} – {job.salaryMax?.toLocaleString()} FCFA</p></div>
                            )}
                            <div className="space-y-0">
                                <div className={rowCls}><span className="text-gray-500">Niveau d&apos;études</span><span className="text-white text-right">{eduLevels.join(', ') || '—'}</span></div>
                                <div className={rowCls}><span className="text-gray-500">Expérience</span><span className="text-white">{EXP_MAP[job.experienceLevel || 'NONE'] || job.experienceLevel}</span></div>
                                <div className={rowCls}><span className="text-gray-500">Date limite</span><span className={dl <= 7 ? 'text-red-400' : 'text-white'}>{formatDate(job.deadline)}</span></div>
                            </div>
                            {user ? (
                                user.role === 'CANDIDATE' ? (
                                    job.isExternal ? (
                                        <a href={job.externalApplyUrl || '#'} target="_blank" rel="noopener noreferrer" className="group relative w-full bg-[#0077b5] text-white font-semibold py-3.5 rounded-xl hover:bg-[#005580] transition shadow-[0_0_20px_rgba(0,119,181,0.2)] hover:shadow-[0_0_25px_rgba(0,119,181,0.4)] flex items-center justify-center gap-2 overflow-hidden">
                                            <Send size={18} /> Postuler sur le site d'origine
                                        </a>
                                    ) : applied ? (
                                        <div className="text-center p-4 bg-[#14B53A]/10 border border-[#14B53A]/20 rounded-xl">
                                            <p className="text-[#14B53A] font-medium flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Candidature envoyée !</p>
                                            <Link href="/dashboard/applications" className="text-sm text-[#14B53A]/80 hover:text-[#14B53A] underline mt-2 inline-block transition">Suivre mon dossier</Link>
                                        </div>
                                    ) : (
                                        <button onClick={openApplyModal} className="group relative w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-gray-100 transition shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 overflow-hidden">
                                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" /><Send size={18} /> Postuler maintenant
                                        </button>
                                    )
                                ) : (
                                    <div className="text-center p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-gray-400 text-sm flex flex-col items-center gap-2"><AlertCircle size={20} className="text-gray-500" />{user.role === 'RECRUITER' ? 'Seuls les candidats peuvent postuler.' : 'Les admins ne peuvent pas postuler.'}</div>
                                )
                            ) : (
                                <div className="space-y-2">
                                    {job.isExternal ? (
                                        <a href={job.externalApplyUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-[#0077b5] text-white font-semibold py-3 rounded-xl hover:bg-[#005580] transition shadow-[0_0_20px_rgba(0,119,181,0.2)]">Postuler sur le site d'origine</a>
                                    ) : (
                                        <Link href="/login" className="block w-full text-center bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 transition">Postuler (connexion requise)</Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div variants={modalVariants} initial="hidden" animate="show" exit="exit" className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02] relative z-10"><div><h3 className="text-xl font-bold text-white flex items-center gap-2"><Send size={20} className="text-[#14B53A]" /> Envoyer ma candidature</h3><p className="text-sm text-gray-400 mt-1">{job.title} chez {job.employer.name}</p></div><button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white p-2 text-2xl leading-none transition-colors">&times;</button></div>
                            <div className="p-6 overflow-y-auto flex-1 space-y-6 relative z-10">
                                {job.requiredDocs && job.requiredDocs.length > 0 && (
                                    <div><h4 className="text-white font-medium mb-3 flex items-center gap-2">📄 Documents requis</h4>
                                        {loadingDocs ? <div className="py-4 text-center"><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" /></div> : (
                                            <div className="space-y-3">{job.requiredDocs.map(req => {
                                                const matches = vaultDocs.filter(d => d.category === req.documentCategory);
                                                return (<div key={req.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"><label className="block text-sm font-medium text-gray-200 mb-2">{req.label} {!req.isOptional && <span className="text-red-400">*</span>}</label>
                                                    {matches.length > 0 ? (<select value={selectedDocs[req.id] || ''} onChange={e => setSelectedDocs(prev => ({ ...prev, [req.id]: e.target.value }))} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30"><option value="">Sélectionner...</option>{matches.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>) : (<div className="text-sm text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex flex-col gap-2"><span>Aucun document <b>{req.documentCategory}</b> trouvé.</span><Link href="/dashboard/documents" className="text-white underline hover:text-amber-300 w-fit">Aller au coffre-fort →</Link></div>)}</div>);
                                            })}</div>
                                        )}</div>
                                )}
                                <div><h4 className="text-white font-medium mb-3">Lettre de motivation (optionnelle)</h4><textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={4} placeholder="Votre motivation..." className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 resize-y" /></div>
                                {applyError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{applyError}</div>}
                            </div>
                            <div className="p-6 border-t border-white/10 bg-white/[0.01] flex justify-end gap-3"><button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-white hover:bg-white/5 rounded-xl transition">Annuler</button><button onClick={submitApplication} disabled={applying || loadingDocs} className="px-5 py-2.5 text-sm font-semibold bg-white text-black hover:bg-gray-100 rounded-xl transition disabled:opacity-50 flex items-center gap-2">{applying ? 'Envoi...' : <><Send size={16} /> Confirmer</>}</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
