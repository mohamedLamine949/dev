'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { documentsApi } from '@/lib/api';

const CATEGORIES = [
    { key: 'CV', label: 'Curriculum Vitae', emoji: '📄', desc: 'Votre CV à jour', required: true },
    { key: 'DIPLOME', label: 'Diplôme(s)', emoji: '🎓', desc: 'Votre dernier diplôme obtenu' },
    { key: 'ACTE_NAISSANCE', label: 'Acte de naissance', emoji: '📋', desc: 'Acte de naissance officiel' },
    { key: 'CERTIFICAT_NATIONALITE', label: 'Certificat de nationalité', emoji: '🇲🇱', desc: 'Nationalité malienne' },
    { key: 'CASIER_JUDICIAIRE', label: 'Casier judiciaire', emoji: '⚖️', desc: 'Extrait casier N°3' },
    { key: 'PASSEPORT', label: 'Passeport', emoji: '🛂', desc: 'En cours de validité' },
    { key: 'CARTE_NINA', label: 'Carte NINA / Biométrique', emoji: '🪪', desc: 'Carte NINA ou biométrique' },
    { key: 'AUTRE', label: 'Autre document', emoji: '📁', desc: 'Tout autre document utile' },
] as const;

type DocCategory = typeof CATEGORIES[number]['key'];
interface Document { id: string; name: string; category: DocCategory; s3Key: string; mimeType: string; size: number; createdAt: string; }

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsVaultPage() {
    const { token } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const load = async () => {
        if (!token) return;
        try { const docs = await documentsApi.list(token); setDocuments(docs); }
        catch { setError('Impossible de charger vos documents'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [token]); // eslint-disable-line

    const getDoc = (category: string) => documents.find(d => d.category === category);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !activeCategory || !token) return;
        const file = e.target.files[0];
        setUploading(activeCategory); setError('');
        try {
            await documentsApi.upload(token, file, activeCategory);
            setSuccess(`Document mis à jour avec succès`);
            await load();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erreur upload'); }
        finally { setUploading(null); setActiveCategory(null); if (inputRef.current) inputRef.current.value = ''; }
    };

    const handleDelete = async (doc: Document) => {
        if (!token || !confirm(`Supprimer "${doc.name}" ?`)) return;
        try { await documentsApi.remove(token, doc.id); setDocuments(prev => prev.filter(d => d.id !== doc.id)); }
        catch { setError('Erreur lors de la suppression'); }
    };

    const triggerUpload = (category: string) => {
        setActiveCategory(category);
        setTimeout(() => inputRef.current?.click(), 50);
    };

    const completionCount = CATEGORIES.filter(c => getDoc(c.key)).length;
    const completionPct = Math.round((completionCount / CATEGORIES.length) * 100);

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

            <div className="max-w-4xl mx-auto px-4 py-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-1">🔐 Mon Coffre-fort</h1>
                    <p className="text-gray-500 text-sm">Déposez vos documents une seule fois — réutilisables pour toutes vos candidatures</p>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 bg-white/10 rounded-full h-1.5">
                            <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{completionCount}/{CATEGORIES.length} documents</span>
                    </div>
                </div>

                {error && <div className="mb-4 border border-red-500/20 bg-red-500/10 rounded-xl p-4 text-red-400 text-sm">{error}</div>}
                {success && <div className="mb-4 border border-[#14B53A]/20 bg-[#14B53A]/10 rounded-xl p-4 text-[#14B53A] text-sm">✅ {success}</div>}

                <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

                {loading ? (
                    <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {CATEGORIES.map(cat => {
                            const doc = getDoc(cat.key);
                            const isUploading = uploading === cat.key;
                            return (
                                <div key={cat.key} className={`rounded-xl border p-5 transition-all ${doc ? 'border-white/[0.12] bg-white/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{cat.emoji}</span>
                                                <span className="font-medium text-white text-sm">{cat.label}</span>
                                                {(cat as { required?: boolean }).required && (
                                                    <span className="text-[10px] border border-white/20 text-gray-300 px-1.5 py-0.5 rounded-full">Requis</span>
                                                )}
                                                {doc && <span className="text-[10px] text-[#14B53A]">✓</span>}
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">{cat.desc}</p>
                                            {doc ? (
                                                <div className="text-xs text-gray-400">
                                                    <div className="font-medium truncate">{doc.name}</div>
                                                    <div className="text-gray-600 mt-0.5">{formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-700 italic">Aucun document</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                            <button onClick={() => triggerUpload(cat.key)} disabled={isUploading}
                                                className="text-xs bg-white text-black font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition">
                                                {isUploading ? '⏳' : doc ? 'Modifier' : 'Déposer'}
                                            </button>
                                            {doc && (
                                                <button onClick={() => handleDelete(doc)} className="text-xs text-gray-600 hover:text-red-400 px-3 py-1.5 rounded-lg transition">
                                                    Supprimer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tip */}
                <div className="mt-6 rounded-xl border border-white/[0.06] p-4">
                    <p className="text-xs text-gray-500">
                        💡 Gardez vos documents à jour. Lors de chaque candidature, vous pourrez sélectionner les documents requis directement depuis ce coffre-fort.
                    </p>
                </div>
            </div>
        </div>
    );
}
