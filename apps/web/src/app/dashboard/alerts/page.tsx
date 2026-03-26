'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { alertsApi } from '@/lib/api';
import { Bell, BellOff, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';

const SECTORS = ['Agriculture', 'Banque / Finance', 'BTP', 'Commerce', 'Education', 'Energie', 'IT / Télécoms', 'Mines', 'ONG / International', 'Santé', 'Sécurité / Défense', 'Transport / Logistique'];
const JOB_TYPES = ['CDI', 'CDD', 'STAGE', 'CONCOURS', 'VOLONTARIAT', 'APPRENTISSAGE'];
const REGIONS = ['Bamako', 'Gao', 'Kayes', 'Kidal', 'Koulikoro', 'Mopti', 'Ségou', 'Sikasso', 'Taoudénit', 'Ménaka', 'Tombouctou'];

interface Alert {
    id: string;
    sectors: string[];
    jobTypes: string[];
    regions: string[];
    isDiasporaOnly: boolean;
    isRemoteOnly: boolean;
    isActive: boolean;
}

function MultiSelect({ label, options, selected, onChange }: {
    label: string;
    options: string[];
    selected: string[];
    onChange: (v: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const toggle = (v: string) =>
        onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left transition hover:border-white/20">
                <span className={selected.length === 0 ? 'text-gray-500' : 'text-white'}>
                    {selected.length === 0 ? label : selected.join(', ')}
                </span>
                {open ? <ChevronUp size={14} className="text-gray-500 shrink-0" /> : <ChevronDown size={14} className="text-gray-500 shrink-0" />}
            </button>
            {open && (
                <div className="absolute z-20 mt-1 w-full bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {options.map(opt => (
                        <button key={opt} type="button" onClick={() => toggle(opt)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/[0.05] transition">
                            <span className={selected.includes(opt) ? 'text-white font-medium' : 'text-gray-400'}>{opt}</span>
                            {selected.includes(opt) && <div className="w-2 h-2 rounded-full bg-[#14B53A]" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const DEFAULT_FORM = { sectors: [] as string[], jobTypes: [] as string[], regions: [] as string[], isDiasporaOnly: false, isRemoteOnly: false };

export default function AlertsPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) { router.push('/login'); return; }
        if (token) {
            alertsApi.list(token)
                .then(setAlerts)
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    }, [user, authLoading, token, router]);

    const handleCreate = async () => {
        if (!token || form.sectors.length === 0) return;
        setCreating(true);
        try {
            const created = await alertsApi.create(token, form);
            setAlerts(prev => [...prev, created]);
            setForm(DEFAULT_FORM);
            setShowForm(false);
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (alert: Alert) => {
        if (!token) return;
        const updated = await alertsApi.update(token, alert.id, { isActive: !alert.isActive });
        setAlerts(prev => prev.map(a => a.id === alert.id ? updated : a));
    };

    const handleDelete = async (id: string) => {
        if (!token) return;
        await alertsApi.remove(token, id);
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    if (authLoading || loading) return <div className="min-h-screen bg-[#0a0a0a]" />;

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <div className="fixed top-0 left-0 right-0 flex h-[3px] z-50">
                <div className="flex-1 bg-[#14B53A]" /><div className="flex-1 bg-[#FCD116]" /><div className="flex-1 bg-[#CE1126]" />
            </div>

            <nav className="sticky top-[3px] z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="text-white font-bold tracking-tight">MaliLink</Link>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">← Tableau de bord</Link>
            </nav>

            <div className="max-w-2xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#14B53A]/10 text-[#14B53A] border border-[#14B53A]/20">
                            <Bell size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Alertes emploi</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Soyez notifié dès qu&apos;une offre correspond à vos critères</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 text-sm font-medium bg-[#14B53A] text-white px-4 py-2 rounded-xl hover:bg-[#12a133] transition"
                    >
                        <Plus size={16} /> Nouvelle alerte
                    </button>
                </div>

                {/* Create form */}
                {showForm && (
                    <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
                        <h2 className="text-sm font-semibold text-white">Créer une alerte</h2>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide font-semibold">
                                Secteurs <span className="text-[#CE1126]">*</span>
                            </label>
                            <MultiSelect label="Choisir des secteurs..." options={SECTORS} selected={form.sectors}
                                onChange={v => setForm(p => ({ ...p, sectors: v }))} />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide font-semibold">
                                Types de contrat <span className="text-gray-600 font-normal normal-case">(optionnel)</span>
                            </label>
                            <MultiSelect label="Tous les types..." options={JOB_TYPES} selected={form.jobTypes}
                                onChange={v => setForm(p => ({ ...p, jobTypes: v }))} />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide font-semibold">
                                Régions <span className="text-gray-600 font-normal normal-case">(optionnel)</span>
                            </label>
                            <MultiSelect label="Toutes les régions..." options={REGIONS} selected={form.regions}
                                onChange={v => setForm(p => ({ ...p, regions: v }))} />
                        </div>

                        <div className="flex gap-4 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isDiasporaOnly}
                                    onChange={e => setForm(p => ({ ...p, isDiasporaOnly: e.target.checked }))}
                                    className="accent-[#14B53A]" />
                                <span className="text-sm text-gray-400">Diaspora uniquement</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isRemoteOnly}
                                    onChange={e => setForm(p => ({ ...p, isRemoteOnly: e.target.checked }))}
                                    className="accent-[#14B53A]" />
                                <span className="text-sm text-gray-400">Remote uniquement</span>
                            </label>
                        </div>

                        {form.sectors.length === 0 && (
                            <p className="text-xs text-amber-400">Sélectionnez au moins un secteur</p>
                        )}

                        <div className="flex gap-3 pt-1">
                            <button onClick={handleCreate} disabled={creating || form.sectors.length === 0}
                                className="flex-1 bg-[#14B53A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#12a133] disabled:opacity-50 transition">
                                {creating ? 'Création...' : 'Créer l\'alerte'}
                            </button>
                            <button onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); }}
                                className="px-4 text-sm text-gray-500 hover:text-white transition">
                                Annuler
                            </button>
                        </div>
                    </div>
                )}

                {/* Alert list */}
                {alerts.length === 0 ? (
                    <div className="text-center py-16 text-gray-600">
                        <BellOff size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucune alerte configurée</p>
                        <p className="text-xs mt-1">Créez une alerte pour être notifié des nouvelles offres</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <div key={alert.id}
                                className={`rounded-2xl border p-5 transition-all ${alert.isActive ? 'border-white/[0.08] bg-white/[0.02]' : 'border-white/[0.04] bg-white/[0.01] opacity-60'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Sectors */}
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {alert.sectors.map(s => (
                                                <span key={s} className="text-xs bg-[#14B53A]/10 text-[#14B53A] border border-[#14B53A]/20 px-2 py-0.5 rounded-full font-medium">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Filters summary */}
                                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                            {alert.jobTypes.length > 0 && (
                                                <span className="bg-white/[0.04] px-2 py-0.5 rounded-full">
                                                    {alert.jobTypes.join(', ')}
                                                </span>
                                            )}
                                            {alert.regions.length > 0 && (
                                                <span className="bg-white/[0.04] px-2 py-0.5 rounded-full">
                                                    {alert.regions.join(', ')}
                                                </span>
                                            )}
                                            {alert.isDiasporaOnly && <span className="bg-white/[0.04] px-2 py-0.5 rounded-full">Diaspora</span>}
                                            {alert.isRemoteOnly && <span className="bg-white/[0.04] px-2 py-0.5 rounded-full">Remote</span>}
                                            {alert.jobTypes.length === 0 && alert.regions.length === 0 && !alert.isDiasporaOnly && !alert.isRemoteOnly && (
                                                <span className="text-gray-600">Toutes les offres du secteur</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => handleToggle(alert)}
                                            className={`p-2 rounded-lg transition ${alert.isActive ? 'text-[#14B53A] hover:bg-[#14B53A]/10' : 'text-gray-600 hover:bg-white/5'}`}
                                            title={alert.isActive ? 'Désactiver' : 'Activer'}>
                                            {alert.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        </button>
                                        <button onClick={() => handleDelete(alert.id)}
                                            className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition"
                                            title="Supprimer">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${alert.isActive ? 'bg-[#14B53A]/10 text-[#14B53A]' : 'bg-white/[0.04] text-gray-600'}`}>
                                        {alert.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
