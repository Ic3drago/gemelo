'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Lock, Star, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/design-system/Card';
import { Stat } from '@/design-system/Stat';
import { SkeletonCard, SkeletonList } from '@/design-system/Skeleton';
import { EmptyState } from '@/design-system/EmptyState';
import { Badge } from '@/design-system/Badge';

interface Profile {
  name: string;
  points: number;
  level: number;
  levelName: string;
  progress: number;
}

interface Achievement {
  id: string;
  name: string;
  desc: string;
  unlocked: boolean;
  icon?: string;
}

interface HistoryItem {
  id: string;
  action: string;
  points: number;
  time: string;
}

const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {};

// Fallback icon map for common achievement names
function getAchievementIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('energia') || n.includes('luz')) return <Star className="h-6 w-6" />;
  if (n.includes('alimento') || n.includes('verdura')) return <Star className="h-6 w-6" />;
  if (n.includes('compra') || n.includes('mercado')) return <Star className="h-6 w-6" />;
  return <Trophy className="h-6 w-6" />;
}

export default function LogrosPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profRaw, achRaw, histRaw] = await Promise.all([
          api.getProfile('hogar_001'),
          api.getAchievements('hogar_001'),
          api.getPointsHistory('hogar_001'),
        ]);

        const profData = profRaw as any;
        const achData = achRaw as any;
        const histData = histRaw as any;

        setProfile({
          name: profData?.name ?? 'Hogar Cochabamba',
          points: profData?.points ?? 340,
          level: profData?.level ?? 2,
          levelName: profData?.levelName ?? 'Consciente',
          progress: profData?.progress ?? 60,
        });

        setAchievements(
          Array.isArray(achData) && achData.length > 0
            ? achData
            : [
                { id: '1', name: 'Primera lectura',   desc: 'Registra tu primer consumo de energia',  unlocked: true  },
                { id: '2', name: 'Cero desperdicio',  desc: 'Una semana sin desperdiciar alimentos',  unlocked: true  },
                { id: '3', name: 'Ahorro eficiente',  desc: 'Cumple tu meta de ahorro un mes',        unlocked: false },
                { id: '4', name: 'Semana verde',      desc: 'Reduce tu huella de carbono 20% en 7 dias', unlocked: false },
                { id: '5', name: 'Explorador',        desc: 'Usa todas las funciones del gemelo',     unlocked: true  },
                { id: '6', name: 'Habito formado',    desc: 'Registra datos 30 dias consecutivos',    unlocked: false },
              ]
        );

        setHistory(
          (Array.isArray(histData) && histData.length > 0 ? histData : [
            { id: '1', action: 'Lectura de energia registrada',  points: 5,  time: '2025-01-15' },
            { id: '2', action: 'Alimento consumido',             points: 10, time: '2025-01-14' },
            { id: '3', action: 'Compra registrada',              points: 5,  time: '2025-01-13' },
          ]).map((h: any, i: number) => ({
            id: h.id ?? String(i),
            action: h.description ?? h.action ?? 'Accion',
            points: Number(h.points ?? 0),
            time: h.timestamp ? new Date(h.timestamp).toLocaleDateString('es-BO') : h.time,
          }))
        );
      } catch {
        // use defaults set above
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonCard />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={<Trophy className="h-8 w-8" />}
        title="Sin datos de logros"
        description="Registra actividades para ganar puntos y desbloquear logros."
      />
    );
  }

  const levelBadgeVariant = profile.level >= 4 ? 'warning' : profile.level >= 3 ? 'success' : profile.level >= 2 ? 'info' : 'neutral';

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Mis Logros</h1>
        <p className="text-sm text-stone-500 mt-0.5">Tu impacto positivo se recompensa</p>
      </div>

      {/* ── Profile card ── */}
      <Card variant="flat">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
          <div>
            <p className="text-sm text-stone-500">{profile.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50">{profile.levelName}</h2>
              <Badge variant={levelBadgeVariant}>Nivel {profile.level}</Badge>
            </div>
          </div>
          <Stat
            label="Puntos totales"
            value={profile.points}
            icon={<Star className="h-5 w-5" />}
          />
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-stone-500 mb-1.5">
            <span>Progreso al nivel {profile.level + 1}</span>
            <span className="nums">{profile.progress}%</span>
          </div>
          <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forest-500 to-leaf-500 rounded-full transition-all duration-700"
              style={{ width: `${profile.progress}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Achievements grid ── */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
            Medallas ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((ach) => (
              <Card
                key={ach.id}
                variant="flat"
                className={[
                  'flex flex-col items-center text-center gap-2 py-5 transition-all',
                  ach.unlocked
                    ? 'border-forest-100 dark:border-forest-900 hover:-translate-y-0.5 hover:shadow-card-md'
                    : 'opacity-60',
                ].join(' ')}
              >
                <div className={[
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  ach.unlocked
                    ? 'bg-forest-50 dark:bg-forest-950 text-forest-600 dark:text-forest-400'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-400',
                ].join(' ')}>
                  {ach.unlocked ? getAchievementIcon(ach.name) : <Lock className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-tight">{ach.name}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-tight">{ach.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Points history ── */}
        <Card variant="flat">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-stone-400" />
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Historial</h2>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">Sin actividad reciente</p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {history.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-3">
                  <div className="pr-3 min-w-0">
                    <p className="text-sm text-stone-700 dark:text-stone-300 font-medium truncate">{item.action}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{item.time}</p>
                  </div>
                  <Badge variant={item.points >= 0 ? 'success' : 'danger'}>
                    {item.points >= 0 ? '+' : ''}{item.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
