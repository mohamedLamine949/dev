'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Job {
    id: string; title: string; type: string; sector: string; regions: string;
    educationLevel: string; experienceLevel: string; description: string; requirements: string;
    deadline: string; publishedAt: string; salaryMin?: number; salaryMax?: number;
    isDiasporaOpen: boolean; isRemoteAbroad: boolean; relocationAid?: string;
    applicationCount: number; viewCount: number;
    employer: { id: string; name: string; slug: string; isVerified: boolean; description?: string };
    requiredDocs: { id: string; documentCategory: string; label: string; isOptional: boolean }[];
}

const EXP_MAP: Record<string, string> = { NONE: 'Aucune', '1_2': '1 à 2 ans', '3_5': '3 à 5 ans', PLUS_5: '+5 ans' };
const TYPE_MAP: Record<string, string> = { CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', CONCOURS: 'Concours', VOLONTARIAT: 'Volontariat', APPRENTISSAGE: 'Apprentissage' };

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function daysLeft(deadline: string) {
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

const cardCls = "rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6";
const rowCls = "flex justify-between items-center text-sm py-2 border-b border-white/[0.04] last:border-0";

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, token } = useAuth();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [applyError, setApplyError] = useState('');

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        fetch(`${API}/jobs/${id}`)
            .then(r => r.json()).then(setJob)
            .catch(() => router.push('/jobs'))
            .finally(() => setLoading(false));
    }, [id, API, router]);

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    );
    if (!job) return null;

    const dl = daysLeft(job.deadline);
    const regions = (() => { try { return JSON.parse(job.regions); } catch { return [job.regions]; } })();
    const eduLevels = (() => { try { return JSON.parse(job.educationLevel); } catch { return [job.educationLevel]; } })();

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
                <Link href="/jobs" className="text-sm text-gray-500 hover:text-white transition">← Offres</Link>
            </nav>

            <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Header */}
                    <div className={cardCls}>
                        <div className="flex gap-2 flex-wrap mb-4">
                            <span className="text-[11px] font-semibold border border-white/20 text-white rounded-full px-2.5 py-0.5">{TYPE_MAP[job.type] || job.type}</span>
                            {job.isDiasporaOpen && <span className="text-[11px] border border-white/10 text-gray-300 rounded-full px-2.5 py-0.5">🌍 Diaspora</span>}
                            {job.isRemoteAbroad && <span className="text-[11px] border border-white/10 text-gray-300 rounded-full px-2.5 py-0.5">💻 Télétravail international</span>}
                            {dl <= 2 && dl > 0 && <span className="text-[11px] border border-red-500/30 text-red-400 rounded-full px-2.5 py-0.5 animate-pulse">⚡ Urgent</span>}
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">{job.title}</h1>
                        <p className="text-gray-400">
                            {job.employer.name}
                            {job.employer.isVerified && <span className="text-[#14B53A] ml-2 text-sm">✓ Vérifié</span>}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                            <span>📍 {regions.join(', ')}</span>
                            <span>🏭 {job.sector}</span>
                            <span>👁 {job.viewCount} vues</span>
                            <span>👥 {job.applicationCount} candidature{job.applicationCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className={cardCls}>
                        <h2 className="text-white font-semibold mb-3">Description du poste</h2>
                        <p className="text-gray-400 whitespace-pre-line leading-relaxed text-sm">{job.description}</p>
                    </div>

                    {/* Requirements */}
                    {job.requirements && (
                        <div className={cardCls}>
                            <h2 className="text-white font-semibold mb-3">Profil recherché</h2>
                            <p className="text-gray-400 whitespace-pre-line leading-relaxed text-sm">{job.requirements}</p>
                        </div>
                    )}

                    {/* Required docs */}
                    {job.requiredDocs.length > 0 && (
                        <div className={cardCls}>
                            <h2 className="text-white font-semibold mb-3">Documents requis à la candidature</h2>
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

                    {/* Relocation */}
                    {job.relocationAid && (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                            <h2 className="text-white font-semibold mb-2">🚁 Aide à la relocalisation</h2>
                            <p className="text-gray-400 text-sm">{job.relocationAid}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Apply CTA */}
                    <div className="sticky top-20 space-y-4">
                        <div className={cardCls + " space-y-4"}>
                            {(job.salaryMin || job.salaryMax) && (
                                <div className="text-center py-2 border-b border-white/[0.06]">
                                    <p className="text-gray-500 text-xs mb-1">Salaire mensuel</p>
                                    <p className="text-white font-bold">{job.salaryMin?.toLocaleString()} – {job.salaryMax?.toLocaleString()} FCFA</p>
                                </div>
                            )}

                            <div className="space-y-0">
                                <div className={rowCls}><span className="text-gray-500">Niveau d&apos;études</span><span className="text-white text-right">{eduLevels.join(', ') || '—'}</span></div>
                                <div className={rowCls}><span className="text-gray-500">Expérience</span><span className="text-white">{EXP_MAP[job.experienceLevel] || job.experienceLevel}</span></div>
                                <div className={rowCls}><span className="text-gray-500">Date limite</span><span className={dl <= 7 ? 'text-red-400' : 'text-white'}>{formatDate(job.deadline)}</span></div>
                                <div className={rowCls}><span className="text-gray-500">Publiée le</span><span className="text-white">{formatDate(job.publishedAt)}</span></div>
                            </div>

                            {user ? (
                                applied ? (
                                    <div className="text-center">
                                        <p className="text-[#14B53A] font-medium">✅ Candidature envoyée !</p>
                                        <Link href="/dashboard/applications" className="text-sm text-gray-400 hover:text-white mt-1 inline-block transition">Voir mes candidatures →</Link>
                                    </div>
                                ) : (
                                    <>
                                        <button onClick={async () => {
                                            setApplying(true); setApplyError('');
                                            try {
                                                const res = await fetch(`${API}/jobs/${id}/apply`, {
                                                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                    body: JSON.stringify({}),
                                                });
                                                const data = await res.json();
                                                if (!res.ok) throw new Error(data.message || 'Erreur');
                                                setApplied(true);
                                            } catch (err: unknown) { setApplyError(err instanceof Error ? err.message : 'Erreur'); }
                                            setApplying(false);
                                        }} disabled={applying}
                                            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition">
                                            {applying ? 'Envoi...' : 'Postuler maintenant →'}
                                        </button>
                                        {applyError && <p className="text-red-400 text-xs mt-2">{applyError}</p>}
                                    </>
                                )
                            ) : (
                                <div className="space-y-2">
                                    <Link href="/login" className="block w-full text-center bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 transition">
                                        Postuler (connexion requise)
                                    </Link>
                                    <Link href="/register" className="block w-full text-center border border-white/10 text-gray-400 hover:text-white font-medium py-2.5 rounded-xl transition text-sm">
                                        Créer un compte gratuit
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Employer */}
                        <div className={cardCls}>
                            <h3 className="text-white font-semibold mb-1">{job.employer.name}</h3>
                            {job.employer.isVerified && <span className="text-xs text-[#14B53A]">✓ Employeur vérifié MaliLink</span>}
                            {job.employer.description && <p className="text-gray-500 text-xs mt-3 leading-relaxed line-clamp-4">{job.employer.description}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
