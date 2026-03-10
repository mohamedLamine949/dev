'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { documentsApi } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FileText, GraduationCap, ClipboardList, Flag, Scale, Book, CreditCard, FolderOpen, CheckCircle2, AlertCircle, Download, UploadCloud, Trash2, Info, Replace } from 'lucide-react';

const CATEGORIES = [
    { key: 'CV', label: 'Curriculum Vitae', icon: FileText, desc: 'Votre CV à jour', required: true },
    { key: 'DIPLOME', label: 'Diplôme(s)', icon: GraduationCap, desc: 'Votre dernier diplôme obtenu' },
    { key: 'ACTE_NAISSANCE', label: 'Acte de naissance', icon: ClipboardList, desc: 'Acte de naissance officiel' },
    { key: 'CERTIFICAT_NATIONALITE', label: 'Certificat de nationalité', icon: Flag, desc: 'Nationalité malienne' },
    { key: 'CASIER_JUDICIAIRE', label: 'Casier judiciaire', icon: Scale, desc: 'Extrait casier N°3' },
    { key: 'PASSEPORT', label: 'Passeport', icon: Book, desc: 'En cours de validité' },
    { key: 'CARTE_NINA', label: 'Carte NINA / Biométrique', icon: CreditCard, desc: 'Carte NINA ou biométrique' },
    { key: 'AUTRE', label: 'Autre document', icon: FolderOpen, desc: 'Tout autre document utile' },
] as const;

type DocCategory = typeof CATEGORIES[number]['key'];
interface Document { id: string; name: string; category: DocCategory; s3Key: string; mimeType: string; size: number; createdAt: string; }

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function DocumentsVaultPage() {
    const { token } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

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

    const handleDownload = async (doc: Document) => {
        if (!token) return;
        setDownloadingFile(doc.id);
        try {
            await documentsApi.download(token, doc.id, doc.name);
        } catch (err: any) {
            setError(err.message || 'Erreur lors du téléchargement');
        } finally {
            setDownloadingFile(null);
        }
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
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-10">
                {/* Header */}
                <div className="mb-8 glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] pointer-events-none scale-150 rotate-12">
                        <FolderOpen size={200} />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Mon Coffre-fort Numérique</h1>
                        <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">Centralisez vos documents obligatoires une seule fois en toute sécurité. Ils seront rattachables en un clic lors de vos futures candidatures.</p>
                        <div className="mt-6 flex items-center gap-4">
                            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden shadow-inner">
                                <div className={`h-2 rounded-full transition-all duration-1000 ease-out ${completionPct === 100 ? 'bg-[#14B53A]' : completionPct >= 50 ? 'bg-[#FCD116]' : 'bg-white/40'}`} style={{ width: `${completionPct}%` }} />
                            </div>
                            <span className={`text-xs font-semibold shrink-0 ${completionPct === 100 ? 'text-[#14B53A]' : 'text-gray-400'}`}>{completionCount}/{CATEGORIES.length} ajoutés</span>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                            <div className="border border-red-500/20 bg-red-500/10 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                            <div className="border border-[#14B53A]/20 bg-[#14B53A]/10 rounded-xl p-4 text-[#14B53A] text-sm flex items-center gap-2"><CheckCircle2 size={16} /> {success}</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#14B53A]/20 border-t-[#14B53A] rounded-full animate-spin" /></div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
                        {CATEGORIES.map(cat => {
                            const doc = getDoc(cat.key);
                            const isUploading = uploading === cat.key;
                            const Icon = cat.icon;

                            return (
                                <motion.div variants={itemVariants} key={cat.key} className={`group rounded-2xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${doc ? 'border border-[#14B53A]/20 bg-[#14B53A]/[0.02] hover:bg-[#14B53A]/[0.04] shadow-[0_0_15px_rgba(20,181,58,0.03)]' : 'border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                                    {doc && <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none -rotate-12"><CheckCircle2 size={100} /></div>}
                                    <div className="flex flex-col h-full relative z-10">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl transition-colors ${doc ? 'bg-[#14B53A]/10 text-[#14B53A]' : 'bg-white/5 text-gray-400'}`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-white text-sm tracking-tight">{cat.label}</span>
                                                        {(cat as { required?: boolean }).required && !doc && (
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Requis</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                                                </div>
                                            </div>
                                            {doc && <CheckCircle2 size={20} className="text-[#14B53A] shrink-0" />}
                                        </div>

                                        <div className="flex-1 mb-4">
                                            {doc ? (
                                                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                                    <div className="font-medium text-gray-300 text-sm truncate flex items-center gap-2 mb-1"><FileText size={14} className="text-gray-500 shrink-0" /> {doc.name}</div>
                                                    <div className="text-gray-500 text-xs flex items-center gap-3">
                                                        <span>{formatSize(doc.size)}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                        <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex items-center">
                                                    <span className="text-sm text-gray-600 font-medium">Aucun document déposé</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 pt-4 border-t border-white/[0.04] mt-auto">
                                            {doc ? (
                                                <>
                                                    <button onClick={() => handleDownload(doc)} disabled={downloadingFile === doc.id}
                                                        className="flex-1 flex items-center justify-center gap-2 text-xs border border-white/10 bg-white/5 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-white/10 hover:border-white/20 disabled:opacity-40 transition-all shadow-sm">
                                                        {downloadingFile === doc.id ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Download size={14} /> Voir</>}
                                                    </button>
                                                    <button onClick={() => triggerUpload(cat.key)} disabled={isUploading}
                                                        className="flex-1 flex items-center justify-center gap-2 text-xs border border-white/10 bg-white/5 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-white/10 hover:border-white/20 disabled:opacity-40 transition-all shadow-sm">
                                                        {isUploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Replace size={14} /> Refaire</>}
                                                    </button>
                                                    <button onClick={() => handleDelete(doc)} className="flex items-center justify-center w-[42px] h-[42px] text-gray-500 bg-white/5 border border-white/10 shrink-0 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/30 rounded-xl transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => triggerUpload(cat.key)} disabled={isUploading}
                                                    className={`w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl transition-all shadow-md ${(cat as { required?: boolean }).required ? 'bg-[#14B53A]/10 text-[#14B53A] hover:bg-[#14B53A]/20 border border-[#14B53A]/30' : 'bg-white text-black hover:bg-gray-100'}`}>
                                                    {isUploading ? <div className={`w-4 h-4 border-2 rounded-full animate-spin ${(cat as { required?: boolean }).required ? 'border-[#14B53A]/30 border-t-[#14B53A]' : 'border-black/20 border-t-black'}`} /> : <><UploadCloud size={16} /> Parcourir</>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Tip */}
                <div className="mt-8 rounded-2xl glass-card p-5 flex gap-4 items-start">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0"><Info size={20} /></div>
                    <p className="text-sm text-gray-400 leading-relaxed mt-1">
                        Toutes vos données sont chiffrées en base. Nous ne partageons vos documents qu&apos;avec les recruteurs dont vous acceptez explicitement les offres.
                    </p>
                </div>
            </div>
        </div>
    );
}
