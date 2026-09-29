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

type Status = 'green' | 'amber' | 'red';

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
};

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [dashboard, gamification] = await Promise.all([
          api.getDashboard('hogar_001'),
          api.getProfile('hogar_001'),
        ]);

        const d = dashboard as any;
        const g = gamification as any;
        if (!d && !g) {
          // Use sensible mock data when backend isn't available
          setData({
            status: 'amber',
            remainingBudget: 1250.50,
            totalBudget: 4000,
            spentBudget: 2749.50,
            monthLabel: new Date().toLocaleString('es-BO', { month: 'long', year: 'numeric' }),
            stats: { spent: 2749.50, co2: 12.4, waste: 0.8, energy: 145 },
            trend: [
              { month: 'Ago', amount: 3100 },
              { month: 'Sep', amount: 2950 },
              { month: 'Oct', amount: 3400 },
              { month: 'Nov', amount: 2800 },
              { month: 'Dic', amount: 3200 },
              { month: 'Ene', amount: 2750 },
            ],
            gamification: { points: 340, level: 2, levelName: 'Consciente', progress: 60 },
          });
        } else {
          const spent = d?.totalSpent ?? 2749.50;
          const budget = d?.totalBudget ?? 4000;
          const remaining = budget - spent;
          const pct = spent / budget;
          const status: Status = pct < 0.7 ? 'green' : pct < 0.9 ? 'amber' : 'red';

          setData({
            status,
            remainingBudget: remaining,
            totalBudget: budget,
            spentBudget: spent,
            monthLabel: new Date().toLocaleString('es-BO', { month: 'long', year: 'numeric' }),
            stats: {
              spent,
              co2: d?.co2Kg ?? 12.4,
              waste: d?.wasteKg ?? 0.8,
              energy: d?.energyKWh ?? 145,
            },
            trend: d?.monthlyTrend ?? [
              { month: 'Ago', amount: 3100 },
              { month: 'Sep', amount: 2950 },
              { month: 'Oct', amount: 3400 },
              { month: 'Nov', amount: 2800 },
              { month: 'Dic', amount: 3200 },
              { month: 'Ene', amount: 2750 },
            ],
            gamification: {
              points: g?.points ?? 340,
              level: g?.level ?? 2,
              levelName: g?.levelName ?? 'Consciente',
              progress: g?.progress ?? 60,
            },
          });
        }
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
                {data.remainingBudget.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-lg text-stone-400">Bs</span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1.5">
              <span>Gastado: Bs {data.spentBudget.toLocaleString('es-BO')}</span>
              <span>{spentPct}% del total</span>
            </div>
            <div className="h-2.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className={['h-full rounded-full transition-all duration-700', status.bg].join(' ')}
                style={{ width: `${spentPct}%` }}
              />
            </div>
            <div className="text-right text-xs text-stone-400 mt-1">
              Meta: Bs {data.totalBudget.toLocaleString('es-BO')}
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
            label="CO2 evitado"
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
