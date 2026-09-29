'use client';

import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Wallet, Target, Plus, Home as HomeIcon, Sparkles, PiggyBank } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { BottomSheet } from '@/design-system/BottomSheet';
import { SkeletonCard } from '@/design-system/Skeleton';
import { Badge } from '@/design-system/Badge';
import { Toast } from '@/design-system/Toast';

interface BudgetRule { label: string; target: number; spent: number; color: string; badgeVariant: 'info' | 'warning' | 'success' }
interface Goal { id: string; name: string; target: number; current: number }
interface Tx { id: string; description: string; amountBs: number; date: string; type: 'income' | 'expense' }

interface FinancesData {
  income: number;
  rules: BudgetRule[];
  goals: Goal[];
  recentTx: Tx[];
}

const pct = (spent: number, target: number) => Math.min(100, Math.round((spent / target) * 100));

export default function PresupuestoPage() {
  const [data, setData] = useState<FinancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // New transaction form
  const [txForm, setTxForm] = useState({ description: '', amount: '', type: 'expense' as 'income' | 'expense' });

  useEffect(() => {
    async function load() {
      try {
        const financesRaw = await api.getFinances();
        const finances = financesRaw as any;
        if (finances) {
          const income = finances.totalIncome ?? 5000;
          setData({
            income,
            rules: [
              { label: 'Necesidades (50%)', target: income * 0.5, spent: finances.needs ?? 2100, color: '#0284c7', badgeVariant: 'info' },
              { label: 'Deseos (30%)',       target: income * 0.3, spent: finances.wants ?? 1600, color: '#d97706', badgeVariant: 'warning' },
              { label: 'Ahorro (20%)',       target: income * 0.2, spent: finances.savings ?? 450, color: '#16a34a', badgeVariant: 'success' },
            ],
            goals: finances.goals ?? [],
            recentTx: finances.recentTransactions ?? [],
          });
        } else {
          const income = 5000;
          setData({
            income,
            rules: [
              { label: 'Necesidades (50%)', target: 2500, spent: 2100, color: '#0284c7', badgeVariant: 'info' },
              { label: 'Deseos (30%)',       target: 1500, spent: 1600, color: '#d97706', badgeVariant: 'warning' },
              { label: 'Ahorro (20%)',       target: 1000, spent: 450,  color: '#16a34a', badgeVariant: 'success' },
            ],
            goals: [
              { id: '1', name: 'Fondo de emergencia', target: 5000, current: 1500 },
              { id: '2', name: 'Vacaciones', target: 3000, current: 600 },
            ],
            recentTx: [
              { id: '1', description: 'Supermercado', amountBs: -345, date: '2025-01-15', type: 'expense' },
              { id: '2', description: 'Salario',      amountBs: 5000, date: '2025-01-01', type: 'income' },
            ],
          });
        }
      } catch {
        // use mock
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddTx = () => {
    if (!txForm.description || !txForm.amount) return;
    setToast('Transaccion registrada');
    setSheetOpen(false);
    setTxForm({ description: '', amount: '', type: 'expense' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!data) return null;

  const radialData = data.rules.map((r) => ({
    name: r.label,
    value: pct(r.spent, r.target),
    fill: r.color,
  }));

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Mi Presupuesto</h1>
          <p className="text-sm text-stone-500 mt-0.5">Regla 50/30/20</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setSheetOpen(true)}
        >
          Agregar
        </Button>
      </div>

      {/* ── 50/30/20 Overview ── */}
      <Card variant="flat" padding={false}>
        <div className="flex flex-col md:flex-row items-center gap-4 p-5">
          {/* Radial chart */}
          <div className="w-40 h-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="40%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#f5f5f4' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Rules list */}
          <div className="flex-1 w-full space-y-3">
            {data.rules.map((rule) => {
              const p = pct(rule.spent, rule.target);
              const over = rule.spent > rule.target;
              return (
                <div key={rule.label}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{rule.label}</span>
                      {over && <Badge variant="danger">Excedido</Badge>}
                    </div>
                    <span className="text-xs text-stone-400 nums">
                      Bs {rule.spent.toLocaleString('es-BO')} / {rule.target.toLocaleString('es-BO')}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p}%`, backgroundColor: rule.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── Metas ── */}
      <Card variant="flat">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-forest-600" />
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">Metas de ahorro</h2>
        </div>
        <div className="space-y-4">
          {data.goals.map((goal) => {
            const p = pct(goal.current, goal.target);
            return (
              <div key={goal.id}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{goal.name}</span>
                  <span className="text-sm font-semibold text-forest-600">{p}%</span>
                </div>
                <div className="h-2.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-500 rounded-full transition-all duration-700"
                    style={{ width: `${p}%` }}
                  />
                </div>
                <p className="text-xs text-stone-400 mt-1 text-right nums">
                  Bs {goal.current.toLocaleString('es-BO')} de Bs {goal.target.toLocaleString('es-BO')}
                </p>
              </div>
            );
          })}
          <button
            className="w-full h-11 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-500 hover:text-forest-600 hover:border-forest-400 transition-colors"
            onClick={() => setSheetOpen(true)}
          >
            Crear nueva meta
          </button>
        </div>
      </Card>

      {/* ── Recent transactions ── */}
      {data.recentTx.length > 0 && (
        <Card variant="flat">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-forest-600" />
            <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">Transacciones recientes</h2>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {data.recentTx.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-3">
                <div>
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{tx.description}</p>
                  <p className="text-xs text-stone-400">{new Date(tx.date).toLocaleDateString('es-BO')}</p>
                </div>
                <span className={['text-sm font-semibold nums', tx.type === 'income' ? 'text-forest-600' : 'text-stone-700 dark:text-stone-300'].join(' ')}>
                  {tx.type === 'income' ? '+' : ''}Bs {Math.abs(tx.amountBs).toLocaleString('es-BO')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Bottom Sheet: Add transaction ── */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nueva transaccion">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Tipo
            </label>
            <div className="flex rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 p-1 gap-1">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTxForm({ ...txForm, type: t })}
                  className={[
                    'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    txForm.type === t
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 shadow-sm'
                      : 'text-stone-500',
                  ].join(' ')}
                >
                  {t === 'expense' ? 'Gasto' : 'Ingreso'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Descripcion
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="Ej: Supermercado, Salario..."
              value={txForm.description}
              onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Monto (Bs)
            </label>
            <input
              type="number"
              inputMode="decimal"
              className="input-base"
              placeholder="0.00"
              value={txForm.amount}
              onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
            />
          </div>

          <Button variant="primary" size="md" fullWidth onClick={handleAddTx}>
            Guardar transaccion
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
