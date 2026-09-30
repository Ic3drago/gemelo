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
  pointsToNextLevel: number;
}

interface RankingEntry { householdId: string; points: number; level: number; levelName: string }

interface Achievement {
  id: string;
  name: string;
  description: string;
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

function getLevelProgress(points: number, level: number): number {
  const thresholds = [0, 101, 501, 1501];
  if (level >= 4) return 100;
  const start = thresholds[Math.max(0, level - 1)];
  const next = thresholds[level];
  return Math.max(0, Math.min(100, Math.round(((points - start) / (next - start)) * 100)));
}

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
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profRaw, achRaw, histRaw, rankingRaw] = await Promise.all([
          api.getProfile('hogar_001'),
          api.getAchievements('hogar_001'),
          api.getPointsHistory('hogar_001'),
          api.getLeaderboard(),
        ]);

        const profData = profRaw as any;
        const achData = achRaw as any;
        const histData = histRaw as any;
        const rankingData = rankingRaw as any;

        if (!profData) {
          setProfile(null);
          setAchievements([]);
          setHistory([]);
          return;
        }

        setProfile({
          name: profData.name ?? 'Mi hogar',
          points: Number(profData.points ?? 0),
          level: Number(profData.level ?? 1),
          levelName: profData.levelName ?? 'Principiante',
          progress: profData.progress ?? getLevelProgress(Number(profData.points ?? 0), Number(profData.level ?? 1)),
          pointsToNextLevel: Number(profData.pointsToNextLevel ?? 0),
        });
        setRanking(Array.isArray(rankingData) ? rankingData : []);

        setAchievements(
          Array.isArray(achData)
            ? achData.map((achievement: any) => ({
                ...achievement,
                description: achievement.description ?? achievement.desc ?? '',
                unlocked: Boolean(achievement.isUnlocked ?? achievement.unlocked),
              }))
            : []
        );

        setHistory(
          (Array.isArray(histData) ? histData : []).map((h: any, i: number) => ({
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
        <p className="text-sm text-stone-500 mt-0.5 dark:text-stone-400">Tu impacto positivo se recompensa</p>
      </div>

      {/* ── Profile card ── */}
      <Card variant="flat" data-tour="achievement-profile">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
          <div>
            <p className="text-sm text-stone-500 dark:text-stone-400">{profile.name}</p>
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
          <div className="flex justify-between text-xs text-stone-500 mb-1.5 dark:text-stone-400">
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
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">{profile.pointsToNextLevel > 0 ? `Te faltan ${profile.pointsToNextLevel} puntos para el siguiente nivel.` : 'Ya alcanzaste el nivel máximo.'}</p>
      </Card>

      <Card variant="flat">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold">Clasificación</h2><Badge variant="info">Top {ranking.length}</Badge></div>
        {ranking.length ? <ol className="divide-y divide-stone-100 dark:divide-stone-800">{ranking.map((entry, index) => <li key={entry.householdId} className="flex items-center justify-between gap-3 py-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-forest-50 text-xs font-bold text-forest-800 dark:bg-forest-950 dark:text-forest-200">{index + 1}</span><div><p className="text-sm font-semibold">{entry.householdId === 'hogar_001' ? 'Mi hogar' : entry.householdId}</p><p className="text-xs text-stone-500 dark:text-stone-400">{entry.levelName}</p></div></div><b className="text-sm nums">{entry.points} pts</b></li>)}</ol> : <EmptyState icon={<Trophy />} title="Aún no hay clasificación" description="Registra actividades para aparecer en el ranking." />}
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
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500',
                ].join(' ')}>
                  {ach.unlocked ? getAchievementIcon(ach.name) : <Lock className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-tight">{ach.name}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-tight dark:text-stone-500">{ach.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Points history ── */}
        <Card variant="flat">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-stone-400 dark:text-stone-500" />
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Historial</h2>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6 dark:text-stone-500">Sin actividad reciente</p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {history.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-3">
                  <div className="pr-3 min-w-0">
                    <p className="text-sm text-stone-700 dark:text-stone-300 font-medium truncate">{item.action}</p>
                    <p className="text-xs text-stone-400 mt-0.5 dark:text-stone-500">{item.time}</p>
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
