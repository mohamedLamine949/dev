'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Stats {
  users: { total: number; candidates: number; recruiters: number; admins: number };
  jobs: { active: number; draft: number; closed: number };
  applications: { total: number; today: number };
}

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      adminApi.getStats(token)
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  const StatCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) => (
    <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl group hover:bg-white/5 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${color}`}>{icon}</span>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Temps réel</span>
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-4xl font-black text-white">{loading ? '...' : value}</h3>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Inscriptions Totales" value={stats?.users.total || 0} icon="👥" color="bg-blue-600/30 text-blue-400" />
          <StatCard title="Offres Actives" value={stats?.jobs.active || 0} icon="💼" color="bg-green-600/30 text-green-400" />
          <StatCard title="Candidatures Total" value={stats?.applications.total || 0} icon="📋" color="bg-purple-600/30 text-purple-400" />
          <StatCard title="Candidatures du jour" value={stats?.applications.today || 0} icon="✨" color="bg-amber-600/30 text-amber-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User distribution */}
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center text-sm">📊</span>
              Répartition des utilisateurs
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
                  <span className="text-slate-400">Candidats</span>
                  <span className="text-white">{stats?.users.candidates}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${(stats?.users.candidates || 0) / (stats?.users.total || 1) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
                  <span className="text-slate-400">Recruteurs</span>
                  <span className="text-white">{stats?.users.recruiters}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-1000"
                    style={{ width: `${(stats?.users.recruiters || 0) / (stats?.users.total || 1) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
                  <span className="text-slate-400">Administrateurs</span>
                  <span className="text-white">{stats?.users.admins}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-1000"
                    style={{ width: `${(stats?.users.admins || 0) / (stats?.users.total || 1) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Job status */}
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-green-500/10 text-green-400 rounded-lg flex items-center justify-center text-sm">📁</span>
              État des offres d&apos;emploi
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Actives</p>
                <p className="text-xl font-black text-green-400">{stats?.jobs.active}</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Brouillons</p>
                <p className="text-xl font-black text-amber-400">{stats?.jobs.draft}</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Closes</p>
                <p className="text-xl font-black text-red-500">{stats?.jobs.closed}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
