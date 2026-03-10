'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

interface DetailedStats {
  users: { total: number; candidates: number; recruiters: number; admins: number; diaspora: number; local: number; };
  jobs: { active: number; draft: number; closed: number; bySector: { name: string; value: number }[] };
  applications: { total: number; today: number; timeline: { date: string; count: number }[] };
  employers: { byStatus: { name: string; value: number }[] };
  completion: { averageScore: number; };
}

const COLORS = ['#14B53A', '#FCD116', '#CE1126', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user?.role === 'ADMIN') {
      adminApi.getStats(token)
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (!token || (user && user.role !== 'ADMIN')) {
      setLoading(false);
    }
  }, [token, user]);

  const StatCard = ({ title, value, icon, color, subtext }: { title: string; value: number | string; icon: string; color: string; subtext?: string }) => (
    <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl group hover:bg-white/[0.04] transition-all relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[50px] opacity-20 ${color.split(' ')[0]}`} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/10 ${color}`}>{icon}</span>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-black/40 px-2 py-1 rounded-full border border-white/5">Temps réel</span>
      </div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">{title}</p>
      <div className="flex items-baseline gap-2 relative z-10">
        <h3 className="text-4xl font-black text-white">{loading ? '...' : value}</h3>
        {subtext && <span className="text-xs text-gray-500 font-medium">{subtext}</span>}
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111] border border-white/10 p-3 rounded-xl shadow-2xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className="text-white font-bold text-sm">
            {payload[0].name !== 'value' && <span className="text-gray-500 mr-2">{payload[0].name}:</span>}
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!stats && !loading) return <AdminLayout><div className="flex justify-center p-20 text-red-400">Erreur de chargement des statistiques.</div></AdminLayout>;

  // Prepare data for UI
  const userDistData = [
    { name: 'Candidats Locaux', value: stats?.users?.local || 0 },
    { name: 'Candidats Diaspora', value: stats?.users?.diaspora || 0 },
    { name: 'Recruteurs', value: stats?.users?.recruiters || 0 },
    { name: 'Admins', value: stats?.users?.admins || 0 },
  ];

  const employerStatusMap: Record<string, string> = { VERIFIED: 'Vérifiés', PENDING: 'En Attente', REJECTED: 'Rejetés' };
  const empDistData = (stats?.employers?.byStatus || []).map(s => ({ name: employerStatusMap[s.name] || s.name, value: s.value }));

  // Format dates for timeline properly
  const timelineData = (stats?.applications?.timeline || []).map(t => ({
    date: new Date(t.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    'Candidatures': t.count
  }));

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        {/* Headers */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Centre de Pilotage (CRM)</h1>
          <p className="text-gray-400 text-sm">Vue globale de l'activité, des conversions et des vérifications sur MaliLink.</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="Inscriptions Totales" value={stats?.users.total || 0} icon="👥" color="bg-blue-600/30 text-blue-400" subtext={`${stats?.users.candidates} Candidats`} />
          <StatCard title="Offres d'emploi" value={stats?.jobs.active || 0} icon="💼" color="bg-[#14B53A]/30 text-[#14B53A]" subtext={`${stats?.jobs.closed} clôturées`} />
          <StatCard title="Total Candidatures" value={stats?.applications.total || 0} icon="📋" color="bg-purple-600/30 text-purple-400" subtext={`+${stats?.applications.today} aujourd'hui`} />
          <StatCard title="Complétude Profils" value={`${stats?.completion.averageScore || 0}%`} icon="🎯" color="bg-[#FCD116]/30 text-[#FCD116]" subtext="Moyenne globale" />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Activity Timeline (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-[#14B53A]">📈</span> Tendance des Candidatures
              </h3>
              <p className="text-xs text-gray-500 mt-1">Évolution du nombre de postulations sur les 7 derniers jours.</p>
            </div>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse text-gray-500">Chargement...</div>
              ) : timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Candidatures" stroke="#14B53A" strokeWidth={3} dot={{ r: 4, fill: '#0a0a0a', stroke: '#14B53A', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#14B53A' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">Pas assez de données pour les 7 derniers jours.</div>
              )}
            </div>
          </div>

          {/* User Distribution Pie */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col">
            <div className="mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-blue-400">🌍</span> Démographie
              </h3>
              <p className="text-xs text-gray-500 mt-1">Répartition de la base utilisateur.</p>
            </div>
            <div className="flex-1 min-h-[250px] w-full relative">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse text-gray-500">Chargement...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userDistData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {userDistData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Sectors Bar Chart */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400">🏭</span> Offres par Secteur
              </h3>
              <p className="text-xs text-gray-500 mt-1">Les secteurs qui recrutent le plus sur la plateforme.</p>
            </div>
            <div className="h-[250px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse text-gray-500">Chargement...</div>
              ) : stats?.jobs?.bySector?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.jobs.bySector.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff00" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#ccc" fontSize={11} tickLine={false} axisLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                      {stats.jobs.bySector.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">Aucune donnée sectorielle.</div>
              )}
            </div>
          </div>

          {/* Employer Verification Status */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-[#FCD116]">🛡️</span> Vérification Employeurs
              </h3>
              <p className="text-xs text-gray-500 mt-1">État d'authentification des entreprises (RCCM/NIF).</p>
            </div>
            <div className="h-[250px] w-full flex items-center">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse text-gray-500">Chargement...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={empDistData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value" stroke="#0a0a0a" strokeWidth={3}>
                      {empDistData.map((entry, index) => {
                        const clr = entry.name === 'Vérifiés' ? '#14B53A' : entry.name === 'En Attente' ? '#FCD116' : '#CE1126';
                        return <Cell key={`cell-${index}`} fill={clr} />;
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
