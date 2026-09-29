'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Toast } from '@/design-system/Toast';
import { Button } from '@/design-system/Button';
import { Card } from '@/design-system/Card';
import { ShoppingCart, Leaf, Zap, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

type Tab = 'compra' | 'alimento' | 'energia';

const PURCHASE_CATEGORIES = [
  { id: 'supermercado', label: 'Supermercado' },
  { id: 'mercado',      label: 'Mercado' },
  { id: 'feria',        label: 'Feria' },
  { id: 'servicios',    label: 'Servicios' },
  { id: 'transporte',   label: 'Transporte' },
  { id: 'otros',        label: 'Otros' },
];

const FOOD_CATEGORIES = [
  { id: 'frutas',     label: 'Frutas' },
  { id: 'verduras',   label: 'Verduras' },
  { id: 'carnes',     label: 'Carnes' },
  { id: 'lacteos',    label: 'Lacteos' },
  { id: 'granos',     label: 'Granos' },
  { id: 'preparados', label: 'Preparados' },
  { id: 'otros',      label: 'Otros' },
];

const SUGGESTIONS = ['Arroz', 'Pollo', 'Papa', 'Cebolla', 'Tomate', 'Leche'];

const CO2_PER_KWH = 0.38; // kg CO2 per kWh (Bolivia grid estimate)

interface ToastState { message: string; type: 'success' | 'error' | 'info' | 'warning' }

export default function RegistroPage() {
  const [activeTab, setActiveTab] = useState<Tab>('compra');
  const [toast, setToast] = useState<ToastState | null>(null);

  // Compra form
  const [compra, setCompra] = useState({ category: 'supermercado', item: '', amount: '', qty: '', unit: 'unidades' });
  // Alimento form
  const [alimento, setAlimento] = useState({ name: '', category: 'verduras', qty: '' });
  // Energia form
  const [energia, setEnergia] = useState({ type: 'general', kwh: '' });

  const co2Preview = energia.kwh ? (Number(energia.kwh) * CO2_PER_KWH).toFixed(2) : null;

  const showToast = (message: string, type: ToastState['type']) => setToast({ message, type });

  const handleCompraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compra.item || !compra.amount) return;
    try {
      await api.createPurchase({
        householdId: 'hogar_001',
        category: compra.category,
        item: compra.item,
        amountBs: Number(compra.amount),
        qty: Number(compra.qty) || 1,
        unit: compra.unit,
      });
      showToast('Compra registrada. +5 pts', 'success');
      setCompra({ category: 'supermercado', item: '', amount: '', qty: '', unit: 'unidades' });
    } catch {
      showToast('No se pudo registrar la compra', 'error');
    }
  };

  const handleAlimentoAction = async (e: React.FormEvent, action: 'store' | 'consume' | 'waste') => {
    e.preventDefault();
    if (!alimento.name || !alimento.qty) return;
    try {
      const food = await api.createFood({
        householdId: 'hogar_001',
        name: alimento.name,
        category: alimento.category,
        qty: Number(alimento.qty),
      }) as any;
      if (action === 'consume' && food?.id) await api.consumeFood(food.id);
      if (action === 'waste'   && food?.id) await api.wasteFood(food.id);

      const msgs: Record<typeof action, [string, ToastState['type']]> = {
        store:   ['Alimento guardado. +2 pts',      'success'],
        consume: ['Consumo registrado. +10 pts',    'success'],
        waste:   ['Desperdicio registrado',          'warning'],
      };
      showToast(...msgs[action]);
      setAlimento({ name: '', category: 'verduras', qty: '' });
    } catch {
      showToast('Error al registrar el alimento', 'error');
    }
  };

  const handleEnergiaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!energia.kwh) return;
    try {
      await api.createEnergyReading({
        householdId: 'hogar_001',
        kWh: Number(energia.kwh),
        deviceType: energia.type,
      });
      showToast('Lectura de energia registrada. +5 pts', 'success');
      setEnergia({ type: 'general', kwh: '' });
    } catch {
      showToast('Error al registrar la lectura', 'error');
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'compra',   label: 'Compra',   icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'alimento', label: 'Alimento', icon: <Leaf className="h-4 w-4" /> },
    { id: 'energia',  label: 'Energia',  icon: <Zap className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Registro manual</h1>
        <p className="text-sm text-stone-500 mt-0.5">Alimenta tu gemelo digital con datos reales</p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-1 gap-1">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={[
              'flex flex-1 items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 shadow-sm'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300',
            ].join(' ')}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Compra Form ── */}
      {activeTab === 'compra' && (
        <Card variant="flat" className="animate-fade-in">
          <form onSubmit={handleCompraSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Categoria
              </label>
              <div className="flex flex-wrap gap-2">
                {PURCHASE_CATEGORIES.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCompra({ ...compra, category: id })}
                    className={[
                      'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                      compra.category === id
                        ? 'bg-forest-600 text-white border-forest-600'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-forest-400',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="item" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Articulo
              </label>
              <input
                id="item"
                type="text"
                placeholder="Ej: Arroz, Pollo, Jabon..."
                required
                className="input-base"
                value={compra.item}
                onChange={(e) => setCompra({ ...compra, item: e.target.value })}
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCompra({ ...compra, item: s })}
                    className="text-xs border border-stone-200 dark:border-stone-700 px-2.5 py-1 rounded-full text-stone-500 hover:text-forest-700 hover:border-forest-400 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Monto (Bs)
                </label>
                <input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="0.00"
                  required
                  className="input-base"
                  value={compra.amount}
                  onChange={(e) => setCompra({ ...compra, amount: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="qty" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Cantidad
                </label>
                <div className="flex">
                  <input
                    id="qty"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    placeholder="1"
                    className="input-base rounded-r-none border-r-0"
                    value={compra.qty}
                    onChange={(e) => setCompra({ ...compra, qty: e.target.value })}
                  />
                  <select
                    className="input-base rounded-l-none border-l-0 w-28"
                    value={compra.unit}
                    onChange={(e) => setCompra({ ...compra, unit: e.target.value })}
                  >
                    <option value="unidades">uds</option>
                    <option value="kg">kg</option>
                    <option value="litros">L</option>
                  </select>
                </div>
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" fullWidth icon={<Save className="h-4 w-4" />}>
              Registrar compra
            </Button>
          </form>
        </Card>
      )}

      {/* ── Alimento Form ── */}
      {activeTab === 'alimento' && (
        <Card variant="flat" className="animate-fade-in">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Categoria
              </label>
              <div className="flex flex-wrap gap-2">
                {FOOD_CATEGORIES.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAlimento({ ...alimento, category: id })}
                    className={[
                      'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                      alimento.category === id
                        ? 'bg-forest-600 text-white border-forest-600'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-forest-400',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="food-name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Nombre
              </label>
              <input
                id="food-name"
                type="text"
                placeholder="Ej: Tomates, Manzanas..."
                required
                className="input-base"
                value={alimento.name}
                onChange={(e) => setAlimento({ ...alimento, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="food-qty" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Cantidad (kg)
              </label>
              <input
                id="food-qty"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="0.5"
                required
                className="input-base"
                value={alimento.qty}
                onChange={(e) => setAlimento({ ...alimento, qty: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => handleAlimentoAction(e, 'store')}
                className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-xs font-medium"
              >
                <Save className="h-5 w-5" />
                Guardar
              </button>
              <button
                type="button"
                onClick={(e) => handleAlimentoAction(e, 'consume')}
                className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border border-forest-200 dark:border-forest-800 bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900 transition-colors text-xs font-medium"
              >
                <CheckCircle2 className="h-5 w-5" />
                Consumido
              </button>
              <button
                type="button"
                onClick={(e) => handleAlimentoAction(e, 'waste')}
                className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors text-xs font-medium"
              >
                <AlertTriangle className="h-5 w-5" />
                Desperdicio
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Energia Form ── */}
      {activeTab === 'energia' && (
        <Card variant="flat" className="animate-fade-in">
          <form onSubmit={handleEnergiaSubmit} className="space-y-4">
            <div>
              <label htmlFor="device-type" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Tipo de lectura
              </label>
              <select
                id="device-type"
                className="input-base"
                value={energia.type}
                onChange={(e) => setEnergia({ ...energia, type: e.target.value })}
              >
                <option value="general">Medidor General</option>
                <option value="cocina">Cocina</option>
                <option value="iluminacion">Iluminacion</option>
                <option value="refrigerador">Refrigerador</option>
              </select>
            </div>

            <div>
              <label htmlFor="kwh" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Consumo (kWh)
              </label>
              <input
                id="kwh"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="Ej: 120"
                required
                className="input-base"
                value={energia.kwh}
                onChange={(e) => setEnergia({ ...energia, kwh: e.target.value })}
              />
            </div>

            {co2Preview && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-sky-50 dark:bg-sky-950 border border-sky-100 dark:border-sky-900">
                <div>
                  <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Huella de carbono estimada</p>
                  <p className="text-2xl font-bold text-sky-700 dark:text-sky-300 nums mt-0.5">
                    {co2Preview} <span className="text-sm font-normal">kg CO2</span>
                  </p>
                </div>
                <Zap className="h-8 w-8 text-sky-400" />
              </div>
            )}

            <Button type="submit" variant="primary" size="md" fullWidth icon={<Zap className="h-4 w-4" />}>
              Registrar lectura
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
