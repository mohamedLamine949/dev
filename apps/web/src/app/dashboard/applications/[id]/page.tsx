'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { documentsApi } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';

interface Message { id: string; content: string; type: string; summonDate?: string; summonLocation?: string; isRead: boolean; createdAt: string; sender: { firstName: string; lastName: string; role: string }; }
interface ApplicationDetail {
    id: string; status: string; coverLetter?: string; introMessage?: string; createdAt: string;
    job: { id: string; title: string; type: string; sector: string; deadline: string; employer: { name: string } };
    user: { id: string; firstName: string; lastName: string; phone: string; email?: string; country: string };
    messages: Message[];
    documents?: { documentId: string; document: { category: string; name: string; size: number } }[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
    SENT: { label: 'Envoyée', color: 'border-blue-500/30 text-blue-400 bg-blue-500/10', icon: '📨' },
    REVIEWED: { label: 'Consultée', color: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10', icon: '👀' },
    SHORTLISTED: { label: 'Présélectionné(e)', color: 'border-green-400/30 text-green-400 bg-green-500/10', icon: '⭐' },
    INTERVIEW: { label: 'Entretien prévu', color: 'border-purple-500/30 text-purple-400 bg-purple-500/10', icon: '🗓' },
    ACCEPTED: { label: 'Acceptée', color: 'border-[#14B53A]/30 text-[#14B53A] bg-[#14B53A]/10', icon: '🎉' },
    REJECTED: { label: 'Non retenue', color: 'border-red-500/30 text-red-500 bg-red-500/10', icon: '✕' },
};

export default function ApplicationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, token } = useAuth();
    const [app, setApp] = useState<ApplicationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [msgText, setMsgText] = useState('');
    const [sending, setSending] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchApp = async () => {
        try {
            const res = await fetch(`${API}/applications/${id}`, { headers });
            if (!res.ok) { router.push('/dashboard/applications'); return; }
            setApp(await res.json());
        } catch { router.push('/dashboard/applications'); }
        setLoading(false);
    };

    useEffect(() => { if (token) fetchApp(); }, [token, id]); // eslint-disable-line

    const sendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!msgText.trim()) return;
        setSending(true);
        await fetch(`${API}/applications/${id}/messages`, { method: 'POST', headers, body: JSON.stringify({ content: msgText }) });
        setMsgText(''); setSending(false); fetchApp();
    };

    if (!user) return null;
    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex justify-center items-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>;
    if (!app) return null;

    const handleDownload = async (docId: string, name: string) => {
        if (!token) return;
        setDownloadingFile(docId);
        try {
            await documentsApi.download(token, docId, name);
        } catch (err: any) {
            alert(err.message || 'Erreur lors du téléchargement');
        } finally {
            setDownloadingFile(null);
        }
    };

    const st = STATUS_MAP[app.status] || STATUS_MAP.SENT;

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Mali Bar */}
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
            </div>
            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight">MaliEmploi</span>
                </Link>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <Link href="/dashboard/applications" className="text-sm text-gray-500 hover:text-white transition">← Mes candidatures</Link>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
                {/* Job info + status */}
                <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">{app.job.title}</h1>
                            <p className="text-gray-500 text-sm mt-1">{app.job.employer.name} · <span className="text-gray-400">{app.job.type}</span> · {app.job.sector}</p>
                            <p className="text-gray-600 text-xs mt-2">
                                Envoyée le {new Date(app.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}>
                            {st.icon} {st.label}
                        </span>
                    </div>
                    {app.coverLetter && (
                        <div className="mt-5 pt-5 border-t border-white/[0.07]">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Votre lettre de motivation :</p>
                            <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/[0.04]">{app.coverLetter}</p>
                        </div>
                    )}

                    {/* Attached Documents */}
                    {app.documents && app.documents.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-white/[0.07]">
                            <p className="text-xs text-gray-500 mb-3 font-medium">Documents joints ({app.documents.length}) :</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {app.documents.map(d => {
                                    const isDownloading = downloadingFile === d.documentId;
                                    return (
                                        <div key={d.documentId} className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm shrink-0">📄</div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-white truncate">{d.document.name}</p>
                                                    <p className="text-[10px] text-gray-500">{d.document.category} · {(d.document.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(d.documentId, d.document.name)}
                                                disabled={isDownloading}
                                                className="ml-2 text-xs text-[#14B53A] hover:text-[#14B53A]/80 transition flex items-center gap-1 disabled:opacity-50"
                                            >
                                                {isDownloading ? '⏳' : '📥'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Status timeline */}
                <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
                    <h2 className="text-white font-semibold text-sm mb-5">Suivi de votre candidature</h2>
                    <div className="flex items-center gap-1">
                        {['SENT', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED'].map((step, i) => {
                            const steps = ['SENT', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED'];
                            const currentIdx = steps.indexOf(app.status);
                            const isRejected = app.status === 'REJECTED';
                            const isActive = i <= currentIdx && !isRejected;
                            const stepInfo = STATUS_MAP[step];
                            return (
                                <div key={step} className="flex-1 text-center group">
                                    <div className={`h-1.5 rounded-full transition-all ${isActive ? 'bg-white' : isRejected && i === 0 ? 'bg-red-500/50' : 'bg-white/10'}`} />
                                    <p className={`text-xs mt-2 font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity mr-1">{stepInfo.icon}</span>
                                        {isActive || i === 0 ? stepInfo.label : ''}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    {app.status === 'REJECTED' && (
                        <div className="mt-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-red-400 text-sm">Votre candidature n'a pas été retenue pour ce poste. N'hésitez pas à postuler à d'autres offres !</p>
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 flex flex-col h-[500px]">
                    <h2 className="text-white font-semibold text-sm mb-4">Messages avec le recruteur</h2>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {app.messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-center px-4">
                                <p className="text-gray-500 text-sm">Aucun message pour le moment. Le recruteur vous contactera ici s'il souhaite discuter de votre candidature.</p>
                            </div>
                        ) : (
                            app.messages.map(msg => {
                                const isMe = msg.sender.role === user.role;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isMe ? 'bg-white text-black rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm border border-white/5'}`}>
                                            {!isMe && <p className="text-[11px] text-gray-400 mb-1 font-medium">{msg.sender.firstName} {msg.sender.lastName} • Recruteur</p>}
                                            <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>

                                            {msg.type === 'SUMMON' && msg.summonDate && (
                                                <div className={`mt-3 border rounded-xl px-3 py-2.5 ${isMe ? 'border-black/10 bg-black/5' : 'border-white/10 bg-white/5'}`}>
                                                    <p className="text-xs font-medium flex items-center gap-1.5 mb-1">
                                                        <span>📅</span> Convocation à un entretien
                                                    </p>
                                                    <p className={`text-sm ${isMe ? 'text-black' : 'text-white'}`}>
                                                        {new Date(msg.summonDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                    {msg.summonLocation && <p className={`text-xs mt-1 ${isMe ? 'text-gray-600' : 'text-gray-400'}`}>📍 {msg.summonLocation}</p>}
                                                </div>
                                            )}

                                            <p className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-black/50' : 'text-white/40'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <form onSubmit={sendMessage} className="flex gap-2 shrink-0 pt-4 border-t border-white/10">
                        <input value={msgText} onChange={e => setMsgText(e.target.value)}
                            className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                            placeholder="Message au recruteur..." />
                        <button type="submit" disabled={sending || !msgText.trim()}
                            className="bg-white hover:bg-gray-100 text-black disabled:opacity-50 disabled:hover:bg-white font-medium px-5 py-3 rounded-xl text-sm transition transition-transform active:scale-95">
                            {sending ? '...' : 'Envoyer'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
