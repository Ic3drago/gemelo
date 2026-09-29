'use client';

import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Sliders, Leaf, Zap, ShoppingCart, TrendingDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { EmptyState } from '@/design-system/EmptyState';
import { SkeletonCard } from '@/design-system/Skeleton';

interface SimResults {
  co2Saved: number;
  moneySaved: number;
  wasteSaved: number;
  energySaved: number;
  chartData: Array<{ name: string; baseline: number; scenario: number }>;
}

export default function SimuladorPage() {
  const [wasteReduction, setWasteReduction]   = useState(20);
  const [energyReduction, setEnergyReduction] = useState(10);
  const [purchaseChange, setPurchaseChange]   = useState(-5);
  const [horizon, setHorizon]                 = useState<3 | 6 | 12>(6);
  const [loading, setLoading]                 = useState(false);
  const [results, setResults]                 = useState<SimResults | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const responseRaw = await api.simulate({
        householdId: 'hogar_001',
        horizonMonths: horizon,
        wasteReductionPct: wasteReduction,
        energyReductionPct: energyReduction,
        purchaseChangePct: Math.abs(purchaseChange),
      });
      const response = responseRaw as any;

      if (response) {
        const chartData = (response.baseline?.months ?? []).map((m: string, i: number) => ({
          name: m,
          baseline: response.baseline.co2Kg[i],
          scenario: response.scenario.co2Kg[i],
        }));
        setResults({
          co2Saved: response.impact?.totalCo2SavedKg ?? 0,
          moneySaved: response.impact?.totalBsSaved ?? 0,
          wasteSaved: response.impact?.wasteReductionKg ?? 0,
          energySaved: response.impact?.energySavedKWh ?? 0,
          chartData,
        });
      } else {
        // Fallback mock
        setResults({
          co2Saved: wasteReduction * 0.8 + energyReduction * 0.4,
          moneySaved: Math.abs(purchaseChange) * 15 + energyReduction * 8,
          wasteSaved: wasteReduction * 0.3,
          energySaved: energyReduction * 12,
          chartData: Array.from({ length: horizon }, (_, i) => ({
            name: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][i % 12],
            baseline: 50 + Math.random() * 10,
            scenario: 50 + Math.random() * 10 - (wasteReduction + energyReduction) * 0.3,
          })),
        });
      }
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const impactCards = results ? [
    { label: 'CO2 evitado',        value: results.co2Saved,    unit: 'kg',  icon: <Leaf className="h-5 w-5" />,       color: 'text-forest-600', bg: 'bg-forest-50 dark:bg-forest-950' },
    { label: 'Ahorro estimado',    value: results.moneySaved,  unit: 'Bs',  icon: <TrendingDown className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
    { label: 'Desperdicio evitado',value: results.wasteSaved,  unit: 'kg',  icon: <ShoppingCart className="h-5 w-5" />, color: 'text-sky-600',    bg: 'bg-sky-50 dark:bg-sky-950' },
    { label: 'Energia ahorrada',   value: results.energySaved, unit: 'kWh', icon: <Zap className="h-5 w-5" />,         color: 'text-rose-600',   bg: 'bg-rose-50 dark:bg-rose-950' },
  ] : [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Predicciones</h1>
        <p className="text-sm text-stone-500 mt-0.5">Simula el impacto de cambiar tus habitos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Controls ── */}
        <Card variant="flat" className="lg:col-span-1 space-y-5">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-forest-600" />
            <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">Parametros</h2>
          </div>

          {/* Waste reduction */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Leaf className="h-4 w-4 text-forest-500" /> Reduccion de desperdicio
              </label>
              <span className="text-sm font-semibold text-forest-600">{wasteReduction}%</span>
            </div>
            <input
              type="range" min="0" max="50" value={wasteReduction}
              onChange={(e) => setWasteReduction(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Energy reduction */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-sky-500" /> Reduccion de energia
              </label>
              <span className="text-sm font-semibold text-sky-600">{energyReduction}%</span>
            </div>
            <input
              type="range" min="0" max="50" value={energyReduction}
              onChange={(e) => setEnergyReduction(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Purchase change */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <ShoppingCart className="h-4 w-4 text-amber-500" /> Cambio en compras
              </label>
              <span className="text-sm font-semibold text-amber-600">
                {purchaseChange > 0 ? '+' : ''}{purchaseChange}%
              </span>
            </div>
            <input
              type="range" min="-30" max="10" value={purchaseChange}
              onChange={(e) => setPurchaseChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Horizon */}
          <div>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">Horizonte de tiempo</p>
            <div className="flex rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 p-1 gap-1">
              {([3, 6, 12] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setHorizon(m)}
                  className={[
                    'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                    horizon === m
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300',
                  ].join(' ')}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" size="md" fullWidth loading={loading} onClick={handleSimulate}>
            Simular impacto
          </Button>
        </Card>

        {/* ── Results ── */}
        <div className="lg:col-span-2 space-y-5">
          {loading ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <SkeletonCard />
            </>
          ) : !results ? (
            <Card variant="flat" className="h-full min-h-[400px] border-dashed border-2 border-stone-200 dark:border-stone-700">
              <EmptyState
                icon={<TrendingDown className="h-8 w-8" />}
                title="Ajusta los parametros"
                description="Modifica los controles y presiona simular para ver el impacto proyectado."
              />
            </Card>
          ) : (
            <div className="space-y-5 animate-fade-in">
              {/* Impact cards */}
              <div className="grid grid-cols-2 gap-4">
                {impactCards.map(({ label, value, unit, icon, color, bg }) => (
                  <Card key={label} variant="flat" className="flex items-center gap-3">
                    <div className={['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg, color].join(' ')}>
                      {icon}
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 font-medium">{label}</p>
                      <p className={['text-xl font-bold nums', color].join(' ')}>
                        {typeof value === 'number' ? value.toFixed(1) : value}
                        <span className="text-xs font-normal text-stone-400 ml-1">{unit}</span>
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Chart */}
              <Card variant="flat" padding={false}>
                <div className="p-5 pb-2">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                    Proyeccion de emisiones CO2
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">Escenario actual vs con cambios</p>
                </div>
                <div className="h-56 px-2 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.chartData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradScenario" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e7e5e4', fontSize: 12 }}
                        formatter={(v: number) => [`${v.toFixed(1)} kg`, '']}
                      />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="baseline"
                        name="Sin cambios"
                        stroke="#a8a29e"
                        strokeWidth={2}
                        fillOpacity={0}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="scenario"
                        name="Con cambios"
                        stroke="#16a34a"
                        strokeWidth={2.5}
                        fill="url(#gradScenario)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
