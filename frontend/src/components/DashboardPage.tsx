'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Leaf, ScanLine, ShoppingCart, Star, Trash2, TrendingUp, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { pulse } from '@/lib/animations';
import { Button } from '@/design-system/Button';
import { Card } from '@/design-system/Card';
import { EmptyState } from '@/design-system/EmptyState';
import { SkeletonCard } from '@/design-system/Skeleton';
import { Stat } from '@/design-system/Stat';

type DashboardModel = {
  status: 'green' | 'amber' | 'red' | 'none';
  remaining: number;
  total: number;
  spent: number;
  monthLabel: string;
  stats: { co2: number; waste: number; energy: number };
  trend: Array<{ month: string; amount: number }>;
  rules: Array<{ label: string; limit: number; spent: number }>;
  alerts: Array<{ type: string; message: string }>;
  profile: { points: number; level: number; levelName: string; progress: number };
};

// `bar` tints the progress bar. `pill` is class-based (not an inline colour) so
// it can carry a dark-mode variant: white text on the amber/red/grey brand
// colours only reached ~3:1 contrast, which fails WCAG AA for 12px text.
const stateStyles = {
  green: { label: 'Buen ritmo', bar: '#1F4D3A', pill: 'bg-brand-700 text-white' },
  amber: { label: 'Atención', bar: '#C9822B', pill: 'bg-amber-200 text-amber-950 dark:bg-amber-500 dark:text-stone-950' },
  red: { label: 'Sobre el límite', bar: '#C96C68', pill: 'bg-rose-200 text-rose-900 dark:bg-rose-500 dark:text-stone-950' },
  none: { label: 'Configura tu ingreso', bar: '#7D8B80', pill: 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-100' },
};

function levelProgress(points: number, level: number) {
  const thresholds = [0, 101, 501, 1501];
  if (level >= 4) return 100;
  return Math.max(0, Math.min(100, Math.round(((points - thresholds[level - 1]) / (thresholds[level] - thresholds[level - 1])) * 100)));
}

export default function DashboardPage() {
  const router = useRouter();
  const alertsRef = useRef<HTMLDivElement | null>(null);
  const [dashboard, setDashboard] = useState<DashboardModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [rawDashboard, profileRaw, budgetsRaw] = await Promise.all([
          api.getDashboard('hogar_001'),
          api.getProfile('hogar_001'),
          api.getBudgets('hogar_001'),
        ]);
        const summary = rawDashboard as any;
        const profile = profileRaw as any;
        if (!summary) { setFailed(true); return; }

        const month = new Date().toISOString().slice(0, 7);
        const purchases = Array.isArray(summary.purchases) ? summary.purchases : [];
        const monthPurchases = purchases.filter((row: any) => row.month === month);
        const monthEnergy = (summary.energy?.summary ?? []).filter((row: any) => row.month === month);
        const monthFood = (summary.food?.summary ?? []).filter((row: any) => row.month === month);
        const purchaseTotal = monthPurchases.reduce((total: number, row: any) => total + Number(row.totalBs || 0), 0);
        const energy = monthEnergy.reduce((total: number, row: any) => total + Number(row.totalKwh || 0), 0);
        const waste = monthFood.reduce((total: number, row: any) => total + Number(row.totalKg || 0), 0);
        const savedBudget = (Array.isArray(budgetsRaw) ? budgetsRaw as any[] : []).find((row) => row.month === month);
        const income = Number(summary.budget?.incomeBs ?? 0);
        const legacyBudgetTotal = savedBudget
          ? Number(savedBudget.needsLimit) + Number(savedBudget.wantsLimit) + Number(savedBudget.savingsTarget)
          : 0;
        const total = income > 0 ? income : legacyBudgetTotal;
        const spent = Number(summary.spentBs ?? purchaseTotal);
        const progressPct = total > 0 ? spent / total : 0;
        const trendMap = new Map<string, number>();
        purchases.forEach((row: any) => trendMap.set(row.month, (trendMap.get(row.month) ?? 0) + Number(row.totalBs || 0)));
        const purchasesTrend = Array.from(trendMap.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([key, amount]) => ({
          month: new Date(`${key}-01T00:00:00`).toLocaleString('es-BO', { month: 'short' }), amount,
        }));
        const trend = Array.isArray(summary.spendingTrend) ? summary.spendingTrend.map((row: any) => ({
          month: new Date(`${row.month}-01T00:00:00`).toLocaleString('es-BO', { month: 'short' }), amount: Number(row.amountBs),
        })) : purchasesTrend;
        const points = Number(profile?.points ?? summary.gamification?.points ?? 0);
        const level = Number(profile?.level ?? summary.gamification?.level ?? 1);
        const limits = summary.budget ?? {};
        const rules = [
          { label: 'Necesidades', limit: Number(limits.needs?.limitBs ?? total * 0.5), spent: Number(limits.needs?.spentBs ?? 0) },
          { label: 'Deseos', limit: Number(limits.wants?.limitBs ?? total * 0.3), spent: Number(limits.wants?.spentBs ?? 0) },
          { label: 'Ahorro', limit: Number(limits.savings?.targetBs ?? total * 0.2), spent: Number(limits.savings?.spentBs ?? 0) },
        ];
        setDashboard({
          status: total === 0 ? 'none' : progressPct < 0.7 ? 'green' : progressPct < 0.9 ? 'amber' : 'red',
          remaining: Number(summary.availableBs ?? total - spent), total, spent,
          monthLabel: new Date().toLocaleString('es-BO', { month: 'long', year: 'numeric' }),
          stats: { co2: Number(summary.co2Kg ?? 0), waste, energy }, trend, rules,
          alerts: Array.isArray(summary.alerts) ? summary.alerts : [],
          profile: { points, level, levelName: profile?.levelName ?? summary.gamification?.levelName ?? 'Principiante', progress: Number(profile?.progress ?? levelProgress(points, level)) },
        });
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <div className="space-y-5"><SkeletonCard /><div className="grid grid-cols-2 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div><SkeletonCard /></div>;
  if (failed || !dashboard) return <EmptyState icon={<TrendingUp />} title="No se pudo cargar el resumen" description="Revisa la conexión e inténtalo de nuevo." action={{ label: 'Reintentar', onClick: () => window.location.reload() }} />;

  const status = stateStyles[dashboard.status];
  const spentPct = dashboard.total > 0 ? Math.min(100, Math.round(dashboard.spent / dashboard.total * 100)) : 0;

  // Draw attention to alert dots without being noisy; no-ops under reduced motion.
  useEffect(
    () => (alertsRef.current ? pulse(alertsRef.current.querySelectorAll('.alert-dot'), { scale: 1.5, duration: 1400 }) : undefined),
    [dashboard.alerts.length],
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <Card variant="flat" padding={false} className="overflow-hidden" data-tour="dashboard-budget">
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-sm capitalize text-stone-500 dark:text-stone-400">{dashboard.monthLabel}</p><h1 className="mt-1 text-xl font-bold">Te quedan este mes</h1></div><span className={['rounded-full px-3 py-1.5 text-xs font-semibold', status.pill].join(' ')}>{status.label}</span></div>
          <div className="mb-4 flex items-baseline gap-2"><strong className="text-4xl nums">{dashboard.total > 0 ? dashboard.remaining.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</strong><span className="text-stone-500">Bs</span></div>
          <div className="mb-2 flex justify-between text-xs text-stone-500 dark:text-stone-400"><span>Gastado: Bs {dashboard.spent.toLocaleString('es-BO')}</span><span>{dashboard.total > 0 ? `${spentPct}% del ingreso` : 'Sin ingreso configurado'}</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"><div className="h-full rounded-full transition-all" style={{ width: `${spentPct}%`, background: status.bar }} /></div>
        </div>
      </Card>

      <Card variant="flat" data-tour="dashboard-rules"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Presupuesto 50/30/20</h2><Link href="/app/presupuesto" className="text-xs text-forest-700 dark:text-forest-300">Administrar</Link></div><div className="space-y-3">{dashboard.rules.map((rule) => <div key={rule.label}><div className="mb-1 flex justify-between text-xs"><span>{rule.label}</span><span>Bs {rule.spent.toFixed(0)} / {rule.limit.toFixed(0)}</span></div><div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"><div className="h-full rounded-full bg-forest-600" style={{ width: `${rule.limit > 0 ? Math.min(100, rule.spent / rule.limit * 100) : 0}%` }} /></div></div>)}</div></Card>

      {dashboard.alerts.length > 0 && <section ref={alertsRef} aria-label="Alertas" className="space-y-2">{dashboard.alerts.map((alert, index) => <div key={`${alert.type}-${index}`} className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><span className="alert-dot mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-600" />{alert.message}</div>)}</section>}

      <div className="grid grid-cols-2 gap-4"><Card variant="flat"><Stat label="Gasto del mes" value={dashboard.spent} prefix="Bs" decimals={0} icon={<ShoppingCart className="h-5 w-5" />} /></Card><Card variant="flat" data-tour="dashboard-co2"><Stat label="Huella de CO₂" value={dashboard.stats.co2} unit="kg" decimals={1} icon={<Leaf className="h-5 w-5" />} /></Card><Card variant="flat"><Stat label="Desperdicio" value={dashboard.stats.waste} unit="kg" decimals={1} icon={<Trash2 className="h-5 w-5" />} /></Card><Card variant="flat"><Stat label="Energía" value={dashboard.stats.energy} unit="kWh" decimals={0} icon={<Zap className="h-5 w-5" />} /></Card></div>

      <Card variant="flat" padding={false} data-tour="dashboard-trend"><div className="p-5 pb-2"><h2 className="text-sm font-semibold">Tendencia de gastos</h2><p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Últimos seis meses en Bs</p></div><div className="h-44 px-1"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dashboard.trend} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}><defs><linearGradient id="dashboard-area" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6FA35B" stopOpacity={0.25} /><stop offset="95%" stopColor="#6FA35B" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#d5ddd4" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7d8b80' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: '#7d8b80' }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => [`Bs ${value.toLocaleString('es-BO')}`, 'Gasto']} /><Area type="monotone" dataKey="amount" stroke="#1F4D3A" strokeWidth={2.5} fill="url(#dashboard-area)" dot={false} /></AreaChart></ResponsiveContainer></div></Card>

      <Card variant="flat" padding={false}><Link href="/app/logros" className="flex items-center gap-4 p-5"><div className="grid h-12 w-12 place-items-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Star className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Nivel {dashboard.profile.level}: {dashboard.profile.levelName}</p><div className="mt-2 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"><div className="h-full bg-amber-500" style={{ width: `${dashboard.profile.progress}%` }} /></div><span className="text-xs nums text-stone-500 dark:text-stone-400">{dashboard.profile.points} pts</span></div></div></Link></Card>

      <div className="grid grid-cols-3 gap-3"><Button variant="secondary" size="sm" fullWidth icon={<ShoppingCart size={16} />} onClick={() => router.push('/app/registrar')} className="flex-col py-3"><span className="text-xs">Registrar</span></Button><Button variant="secondary" size="sm" fullWidth icon={<ScanLine size={16} />} onClick={() => router.push('/app/escaneo')} className="flex-col py-3"><span className="text-xs">Escanear</span></Button><Button variant="secondary" size="sm" fullWidth icon={<TrendingUp size={16} />} onClick={() => router.push('/app/futuro')} className="flex-col py-3"><span className="text-xs">Ver futuro</span></Button></div>
    </div>
  );
}