'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ShoppingCart, ScanLine, TrendingUp, Leaf, Zap, Trash2,
  ChevronRight, Star,
} from 'lucide-react';
import { Card } from '@/design-system/Card';
import { Stat } from '@/design-system/Stat';
import { SkeletonCard } from '@/design-system/Skeleton';
import { EmptyState } from '@/design-system/EmptyState';
import { Button } from '@/design-system/Button';

type Status = 'green' | 'amber' | 'red' | 'none';

interface DashboardData {
  status: Status;
  remainingBudget: number;
  totalBudget: number;
  spentBudget: number;
  monthLabel: string;
  stats: {
    spent: number;
    co2: number;
    waste: number;
    energy: number;
  };
  trend: Array<{ month: string; amount: number }>;
  gamification: {
    points: number;
    level: number;
    levelName: string;
    progress: number;
  };
}

const statusConfig: Record<Status, { label: string; bg: string; ring: string; text: string }> = {
  green: {
    label: 'Buen ritmo',
    bg: 'bg-forest-500',
    ring: 'ring-forest-200',
    text: 'text-forest-700',
  },
  amber: {
    label: 'Precaucion',
    bg: 'bg-amber-500',
    ring: 'ring-amber-200',
    text: 'text-amber-700',
  },
  red: {
    label: 'Alerta',
    bg: 'bg-rose-500',
    ring: 'ring-rose-200',
    text: 'text-rose-700',
  },
  none: {
    label: 'Sin presupuesto',
    bg: 'bg-stone-500',
    ring: 'ring-stone-200',
    text: 'text-stone-700',
  },
};

function getLevelProgress(points: number, level: number): number {
  const thresholds = [0, 101, 501, 1501];
  if (level >= 4) return 100;
  const start = thresholds[Math.max(0, level - 1)];
  const next = thresholds[level];
  return Math.max(0, Math.min(100, Math.round(((points - start) / (next - start)) * 100)));
}

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [dashboard, gamification, budgetsRaw] = await Promise.all([
          api.getDashboard('hogar_001'),
          api.getProfile('hogar_001'),
          api.getBudgets('hogar_001'),
        ]);

        const d = dashboard as any;
        const g = gamification as any;
        if (!d) {
          setError(true);
          return;
        }

        const month = new Date().toISOString().slice(0, 7);
        const purchases = Array.isArray(d.purchases) ? d.purchases : [];
        const monthPurchases = purchases.filter((purchase: any) => purchase.month === month);
        const monthEnergy = (d.energy?.summary ?? []).filter((reading: any) => reading.month === month);
        const monthFood = (d.food?.summary ?? []).filter((entry: any) => entry.month === month);
        const spent = monthPurchases.reduce((total: number, purchase: any) => total + Number(purchase.totalBs), 0);
        const co2FromPurchases = monthPurchases.reduce((total: number, purchase: any) => total + Number(purchase.totalCo2Kg), 0);
        const energyKwh = monthEnergy.reduce((total: number, reading: any) => total + Number(reading.totalKwh), 0);
        const energyCo2 = monthEnergy.reduce((total: number, reading: any) => total + Number(reading.totalCo2), 0);
        const wasteKg = monthFood.reduce((total: number, entry: any) => total + Number(entry.totalKg), 0);
        const wasteCo2 = monthFood.reduce((total: number, entry: any) => total + Number(entry.totalCo2), 0);
        const budget = (Array.isArray(budgetsRaw) ? budgetsRaw as any[] : []).find((entry) => entry.month === month);
        const totalBudget = budget
          ? Number(budget.needsLimit) + Number(budget.wantsLimit) + Number(budget.savingsTarget)
          : 0;
        const pct = totalBudget > 0 ? spent / totalBudget : 0;
        const trendMap = new Map<string, number>();
        purchases.forEach((purchase: any) => {
          trendMap.set(purchase.month, (trendMap.get(purchase.month) ?? 0) + Number(purchase.totalBs));
        });
        const trend = Array.from(trendMap.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([key, amount]) => ({
          month: new Date(`${key}-01T00:00:00`).toLocaleString('es-BO', { month: 'short' }),
          amount,
        }));

        setData({
          status: totalBudget === 0 ? 'none' : pct < 0.7 ? 'green' : pct < 0.9 ? 'amber' : 'red',
          remainingBudget: totalBudget - spent,
          totalBudget,
          spentBudget: spent,
          monthLabel: new Date().toLocaleString('es-BO', { month: 'long', year: 'numeric' }),
          stats: {
            spent,
            co2: co2FromPurchases + energyCo2 + wasteCo2,
            waste: wasteKg,
            energy: energyKwh,
          },
          trend,
          gamification: {
            points: g?.points ?? d.gamification?.points ?? 0,
            level: g?.level ?? d.gamification?.level ?? 1,
            levelName: g?.levelName ?? d.gamification?.levelName ?? 'Principiante',
            progress: g?.progress ?? getLevelProgress(Number(g?.points ?? d.gamification?.points ?? 0), Number(g?.level ?? d.gamification?.level ?? 1)),
          },
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <SkeletonCard />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-8 w-8" />}
        title="Sin datos disponibles"
        description="No se pudo cargar el resumen del mes. Verifica tu conexion."
        action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
      />
    );
  }

  const status = statusConfig[data.status];
  const spentPct = Math.min(100, Math.round((data.spentBudget / data.totalBudget) * 100));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Hero: Estado del mes ── */}
      <Card variant="flat" padding={false} className="overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-stone-500 capitalize">{data.monthLabel}</p>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">Estado del mes</h1>
            </div>
            <span className={[
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-2',
              status.bg, 'text-white', status.ring,
            ].join(' ')}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
              {status.label}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-stone-500 mb-1">Presupuesto restante</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-stone-900 dark:text-stone-50 nums">
                {data.totalBudget > 0 ? data.remainingBudget.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
              </span>
              <span className="text-lg text-stone-400">Bs</span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1.5">
              <span>Gastado: Bs {data.spentBudget.toLocaleString('es-BO')}</span>
              <span>{data.totalBudget > 0 ? `${spentPct}% del total` : 'Sin tope mensual'}</span>
            </div>
            <div className="h-2.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              {data.totalBudget > 0 && <div
                className={['h-full rounded-full transition-all duration-700', status.bg].join(' ')}
                style={{ width: `${spentPct}%` }}
              />}
            </div>
            <div className="text-right text-xs text-stone-400 mt-1">
              {data.totalBudget > 0 ? `Meta: Bs ${data.totalBudget.toLocaleString('es-BO')}` : 'Meta: sin definir'}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-4">
        <Card variant="flat">
          <Stat
            label="Gasto del mes"
            value={data.stats.spent}
            prefix="Bs"
            decimals={0}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
        </Card>
        <Card variant="flat">
          <Stat
            label="Huella de CO2"
            value={data.stats.co2}
            unit="kg"
            decimals={1}
            icon={<Leaf className="h-5 w-5" />}
          />
        </Card>
        <Card variant="flat">
          <Stat
            label="Desperdicio"
            value={data.stats.waste}
            unit="kg"
            decimals={1}
            icon={<Trash2 className="h-5 w-5" />}
          />
        </Card>
        <Card variant="flat">
          <Stat
            label="Energia"
            value={data.stats.energy}
            unit="kWh"
            decimals={0}
            icon={<Zap className="h-5 w-5" />}
          />
        </Card>
      </div>

      {/* ── Trend chart ── */}
      <Card variant="flat" padding={false}>
        <div className="p-5 pb-2">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Tendencia de gastos</h2>
          <p className="text-xs text-stone-400 mt-0.5">Ultimos 6 meses en Bs</p>
        </div>
        <div className="h-44 px-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e7e5e4', fontSize: 12 }}
                formatter={(v: number) => [`Bs ${v.toLocaleString('es-BO')}`, 'Gasto']}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#16a34a"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="p-3" />
      </Card>

      {/* ── Gamification card ── */}
      <Card variant="flat" padding={false}>
        <Link href="/logros" className="flex items-center gap-4 p-5 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-2xl transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
            <Star className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                Nivel {data.gamification.level}: {data.gamification.levelName}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${data.gamification.progress}%` }}
                />
              </div>
              <span className="text-xs text-stone-400 nums">{data.gamification.points} pts</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-stone-300 shrink-0" />
        </Link>
      </Card>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          icon={<ShoppingCart className="h-4 w-4" />}
          onClick={() => router.push('/registro')}
          className="flex-col h-auto py-3 gap-1.5"
        >
          <span className="text-xs leading-tight">Registrar compra</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          icon={<ScanLine className="h-4 w-4" />}
          onClick={() => router.push('/escanear')}
          className="flex-col h-auto py-3 gap-1.5"
        >
          <span className="text-xs leading-tight">Escanear factura</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          icon={<TrendingUp className="h-4 w-4" />}
          onClick={() => router.push('/simulador')}
          className="flex-col h-auto py-3 gap-1.5"
        >
          <span className="text-xs leading-tight">Ver predicciones</span>
        </Button>
      </div>
    </div>
  );
}
