'use client';

import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Wallet, Target, Plus, Home as HomeIcon, Sparkles, PiggyBank } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { BottomSheet } from '@/design-system/BottomSheet';
import { EmptyState } from '@/design-system/EmptyState';
import { SkeletonCard } from '@/design-system/Skeleton';
import { Badge } from '@/design-system/Badge';
import { Toast } from '@/design-system/Toast';

interface BudgetRule { label: string; target: number; spent: number; color: string; badgeVariant: 'info' | 'warning' | 'success' }
interface Goal { id: string; name: string; target: number; current: number; weeklyContribution: number }
interface Tx { id: string; description: string; amount: number; date: string; type: 'income' | 'expense' }
interface Account { id: string; name: string; balance: number }

interface FinancesData {
  income: number;
  rules: BudgetRule[];
  goals: Goal[];
  recentTx: Tx[];
  accounts: Account[];
}

const pct = (spent: number, target: number) => target > 0 ? Math.min(100, Math.round((spent / target) * 100)) : 0;

async function loadFinancesData(): Promise<FinancesData> {
  const [accountsRaw, transactionsRaw, goalsRaw, budgetsRaw, householdBudgetRaw] = await Promise.all([
    api.getAccounts(),
    api.getTransactions(),
    api.getGoals(),
    api.getBudgets(),
    api.getHouseholdBudget(),
  ]);
  const accounts = Array.isArray(accountsRaw) ? accountsRaw as any[] : [];
  const transactions = Array.isArray(transactionsRaw) ? transactionsRaw as any[] : [];
  const goals = Array.isArray(goalsRaw) ? goalsRaw as any[] : [];
  const budgets = Array.isArray(budgetsRaw) ? budgetsRaw as any[] : [];
  const householdBudget = householdBudgetRaw as any;
  const month = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter((tx) => String(tx.timestamp ?? '').startsWith(month));
  const budget = budgets.find((item) => item.month === month);
  const spentFor = (category: string) => monthTransactions
    .filter((tx) => tx.type === 'expense' && String(tx.category).toLowerCase() === category)
    .reduce((total, tx) => total + Number(tx.amount), 0);

  const transactionIncome = monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((total, tx) => total + Number(tx.amount), 0);
  const income = Number(householdBudget?.income ?? transactionIncome);
  return {
    income,
    rules: [
      { label: 'Necesidades', target: income > 0 ? income * 0.5 : Number(budget?.needsLimit ?? 0), spent: spentFor('needs'), color: '#3E7CB1', badgeVariant: 'info' },
      { label: 'Deseos', target: income > 0 ? income * 0.3 : Number(budget?.wantsLimit ?? 0), spent: spentFor('wants') + spentFor('ocio'), color: '#C9822B', badgeVariant: 'warning' },
      { label: 'Ahorro', target: income > 0 ? income * 0.2 : Number(budget?.savingsTarget ?? 0), spent: spentFor('savings'), color: '#6FA35B', badgeVariant: 'success' },
    ],
    goals: goals.map((goal) => ({
      id: String(goal.id),
      name: goal.name,
      target: Number(goal.targetAmount),
      current: Number(goal.currentAmount),
      weeklyContribution: Number(goal.suggestedWeeklyContribution ?? 0),
    })),
    recentTx: transactions.slice(0, 5).map((tx) => ({
      id: String(tx.id),
      description: tx.description || tx.category,
      amount: Number(tx.amount),
      date: tx.timestamp,
      type: tx.type,
    })),
    accounts: accounts.map((account) => ({
      id: String(account.id),
      name: account.name,
      balance: Number(account.balance),
    })),
  };
}

export default function PresupuestoPage() {
  const [data, setData] = useState<FinancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSheet, setActiveSheet] = useState<'transaction' | 'goal' | 'budget' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [txForm, setTxForm] = useState({ description: '', amount: '', type: 'expense' as 'income' | 'expense', category: 'needs', accountId: '' });
  const [goalForm, setGoalForm] = useState({ name: '', target: '', targetDate: '' });
  const [budgetForm, setBudgetForm] = useState({ income: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFinancesData().then((finances) => {
      setData(finances);
      if (finances.accounts.length > 0) {
        setTxForm((current) => ({ ...current, accountId: current.accountId || finances.accounts[0].id }));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleAddTx = async () => {
    if (!txForm.description.trim() || Number(txForm.amount) <= 0 || !txForm.accountId) return;
    setSaving(true);
    const result = await api.createTransaction({
      accountId: txForm.accountId,
      description: txForm.description.trim(),
      amount: Number(txForm.amount),
      type: txForm.type,
      category: txForm.category,
    });
    if (!result) {
      setToast({ message: 'No se pudo registrar la transaccion', type: 'error' });
      setSaving(false);
      return;
    }
    setData(await loadFinancesData());
    setToast({ message: 'Transaccion registrada', type: 'success' });
    setActiveSheet(null);
    setTxForm((current) => ({ ...current, description: '', amount: '' }));
    setSaving(false);
  };

  const handleAddGoal = async () => {
    if (!goalForm.name.trim() || Number(goalForm.target) <= 0) return;
    setSaving(true);
    const result = await api.createGoal({ name: goalForm.name.trim(), targetAmount: Number(goalForm.target), targetDate: goalForm.targetDate || undefined });
    if (!result) {
      setToast({ message: 'No se pudo crear la meta', type: 'error' });
      setSaving(false);
      return;
    }
    setData(await loadFinancesData());
    setToast({ message: 'Meta creada', type: 'success' });
    setActiveSheet(null);
    setGoalForm({ name: '', target: '', targetDate: '' });
    setSaving(false);
  };

  const handleCreateBudget = async () => {
    const income = Number(budgetForm.income);
    if (!Number.isFinite(income) || income <= 0) return;
    setSaving(true);
    const result = await api.setHouseholdBudget({ householdId: 'hogar_001', income });
    if (!result) {
      setToast({ message: 'No se pudo guardar el presupuesto', type: 'error' });
      setSaving(false);
      return;
    }
    setData(await loadFinancesData());
    setToast({ message: 'Ingreso mensual guardado; límites 50/30/20 actualizados.', type: 'success' });
    setActiveSheet(null);
    setBudgetForm({ income: '' });
    setSaving(false);
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

  if (!data) return <EmptyState icon={<Wallet />} title="No se pudo cargar el presupuesto" description="Revisa la conexión e inténtalo de nuevo." action={{ label: 'Reintentar', onClick: () => window.location.reload() }} />;

  const radialData = data.rules.map((r) => ({
    name: r.label,
    value: pct(r.spent, r.target),
    fill: r.color,
  }));

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Mi Presupuesto</h1>
          <p className="text-sm text-stone-500 mt-0.5 dark:text-stone-400">Regla 50/30/20</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setActiveSheet('transaction')}
        >
          Agregar
        </Button>
        <Button variant="secondary" size="sm" onClick={() => { setBudgetForm({ income: String(data.income || '') }); setActiveSheet('budget'); }}>Ingreso</Button>
      </div>

      {/* ── 50/30/20 Overview ── */}
      <Card variant="flat" padding={false}>
        {data.income > 0 ? <div className="flex flex-col md:flex-row items-center gap-4 p-5">
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
                    <span className="text-xs text-stone-400 nums dark:text-stone-500">
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
        </div> : <div className="p-5 flex items-center justify-between gap-4">
          <p className="text-sm text-stone-500 dark:text-stone-400">Configura el ingreso para calcular tu regla 50/30/20.</p>
          <Button variant="secondary" size="sm" onClick={() => { setBudgetForm({ income: '' }); setActiveSheet('budget'); }}>Configurar</Button>
        </div>}
      </Card>

      {/* ── Metas ── */}
      <Card variant="flat">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-forest-600 dark:text-forest-400" />
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">Metas de ahorro</h2>
        </div>
        <div className="space-y-4">
          {data.goals.length === 0 && <p className="text-sm text-stone-500 dark:text-stone-400">Aun no tienes metas de ahorro.</p>}
          {data.goals.map((goal) => {
            const p = pct(goal.current, goal.target);
            return (
              <div key={goal.id}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{goal.name}</span>
                  <span className="text-sm font-semibold text-forest-600 dark:text-forest-400">{p}%</span>
                </div>
                <div className="h-2.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-500 rounded-full transition-all duration-700"
                    style={{ width: `${p}%` }}
                  />
                </div>
                <p className="text-xs text-stone-400 mt-1 text-right nums dark:text-stone-500">
                  Bs {goal.current.toLocaleString('es-BO')} de Bs {goal.target.toLocaleString('es-BO')}
                </p>
                <p className="mt-1 text-xs text-forest-700 dark:text-forest-300">Aporte sugerido: Bs {goal.weeklyContribution.toLocaleString('es-BO')} por semana</p>
              </div>
            );
          })}
          <button
            className="w-full h-11 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-500 hover:text-forest-600 hover:border-forest-400 transition-colors dark:text-stone-400"
            onClick={() => setActiveSheet('goal')}
          >
            Crear nueva meta
          </button>
        </div>
      </Card>

      {/* ── Recent transactions ── */}
      {data.recentTx.length > 0 && (
        <Card variant="flat">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-forest-600 dark:text-forest-400" />
            <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">Transacciones recientes</h2>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {data.recentTx.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-3">
                <div>
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{tx.description}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">{new Date(tx.date).toLocaleDateString('es-BO')}</p>
                </div>
                <span className={['text-sm font-semibold nums', tx.type === 'income' ? 'text-forest-600' : 'text-stone-700 dark:text-stone-300'].join(' ')}>
                  {tx.type === 'income' ? '+' : '-'}Bs {Math.abs(tx.amount).toLocaleString('es-BO')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Bottom Sheet: Add transaction ── */}
      <BottomSheet open={activeSheet !== null} onClose={() => setActiveSheet(null)} title={activeSheet === 'goal' ? 'Nueva meta de ahorro' : activeSheet === 'budget' ? 'Presupuesto mensual' : 'Nueva transaccion'}>
        {activeSheet === 'goal' ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Nombre de la meta
              <input type="text" className="input-base mt-1.5" value={goalForm.name} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} />
            </label>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Monto objetivo (Bs)
              <input type="number" min="0.01" step="0.01" className="input-base mt-1.5" value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} />
            </label>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Fecha objetivo
              <input type="date" className="input-base mt-1.5" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} />
            </label>
            <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleAddGoal}>Crear meta</Button>
          </div>
        ) : activeSheet === 'budget' ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Ingreso mensual (Bs)
              <input type="number" min="0.01" step="0.01" className="input-base mt-1.5" value={budgetForm.income} onChange={(e) => setBudgetForm({ income: e.target.value })} />
            </label>
            {Number(budgetForm.income) > 0 && <p className="text-xs text-stone-500 dark:text-stone-400">Necesidades Bs {(Number(budgetForm.income) * 0.5).toFixed(2)} · Deseos Bs {(Number(budgetForm.income) * 0.3).toFixed(2)} · Ahorro Bs {(Number(budgetForm.income) * 0.2).toFixed(2)}</p>}
            <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleCreateBudget}>Guardar presupuesto</Button>
          </div>
        ) : (
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
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Cuenta</label>
            <select className="input-base" value={txForm.accountId} onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })}>
              {data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · Bs {account.balance.toLocaleString('es-BO')}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Categoria</label>
            <select className="input-base" value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}>
              <option value="needs">Necesidades</option>
              <option value="wants">Deseos</option>
              <option value="savings">Ahorro</option>
              <option value="other">Otro</option>
            </select>
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
              min="0.01"
              step="0.01"
              className="input-base"
              placeholder="0.00"
              value={txForm.amount}
              onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
            />
          </div>

          <Button variant="primary" size="md" fullWidth loading={saving} disabled={!data.accounts.length} onClick={handleAddTx}>
            Guardar transaccion
          </Button>
        </div>
        )}
      </BottomSheet>
    </div>
  );
}
