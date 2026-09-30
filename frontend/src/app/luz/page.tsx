'use client';

import { useEffect, useState } from 'react';
import { Zap, Save, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { calculateElectricityBill } from '@/lib/tariff';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Badge } from '@/design-system/Badge';
import { EmptyState } from '@/design-system/EmptyState';
import { SkeletonCard } from '@/design-system/Skeleton';
import { Toast } from '@/design-system/Toast';

type Bill = { id: string; month: string; kWh: number; totalBs: number; co2Kg: number };
const money = (value: number) => `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LuzPage() {
  const [kWh, setKwh] = useState('252');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const result = Number(kWh) > 0 ? calculateElectricityBill(Number(kWh)) : null;

  useEffect(() => {
    api.getBills().then((value) => setBills(Array.isArray(value) ? value as Bill[] : [])).finally(() => setLoading(false));
  }, []);

  async function saveBill() {
    if (!result || Number(kWh) <= 0) return;
    setSaving(true);
    const saved = await api.createBill({ householdId: 'hogar_001', kWh: Number(kWh), month });
    setSaving(false);
    if (!saved) {
      setToast({ message: 'No se pudo guardar la factura. Revisa los datos e intenta otra vez.', type: 'error' });
      return;
    }
    setBills((current) => [saved as Bill, ...current.filter((bill) => bill.month !== month)]);
    setToast({ message: 'Factura guardada. Ganaste 3 puntos.', type: 'success' });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <header><p className="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-300">Energía · Huella referencial</p><h1 className="mt-1 text-2xl font-bold">Factura de luz</h1><p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Calcula el costo estimado por tramos progresivos.</p></header>
      <Card variant="flat" className="space-y-4" data-tour="light-calculator">
        <label className="block text-sm font-medium" htmlFor="bill-kwh">Consumo mensual (kWh)</label>
        <input id="bill-kwh" className="input-base" type="number" min="0.1" step="0.1" inputMode="decimal" value={kWh} onChange={(event) => setKwh(event.target.value)} />
        <label className="block text-sm font-medium" htmlFor="bill-month">Mes de la factura</label>
        <input id="bill-month" className="input-base" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
      </Card>
      {result ? <>
        <Card variant="flat" className="space-y-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-stone-500 dark:text-stone-400">Total estimado</p><p className="mt-1 text-3xl font-bold nums">{money(result.totalBs)}</p></div><Badge variant="info">Referencial</Badge></div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {result.tiers.map((tier, index) => <div key={index} className="flex justify-between py-2 text-sm"><span>Tramo {index + 1} · {tier.kWh.toLocaleString('es-BO')} kWh × Bs {tier.rate.toFixed(2)}</span><b>{money(tier.chargeBs)}</b></div>)}
            <div className="flex justify-between py-2 text-sm"><span>Cargo fijo</span><b>{money(result.fixedChargeBs)}</b></div>
            <div className="flex justify-between py-2 text-sm"><span>Alumbrado público (6%)</span><b>{money(result.publicLightingBs)}</b></div>
          </div>
          <div className="flex items-center gap-2 border-t border-stone-100 pt-3 text-sm text-sky-800 dark:border-stone-800 dark:text-sky-300"><Zap size={17} /> Huella estimada: <b>{result.co2Kg.toLocaleString('es-BO')} kg CO₂</b></div>
          <Button variant="primary" fullWidth loading={saving} icon={<Save size={17} />} onClick={saveBill}>Guardar factura</Button>
        </Card>
        <p className="flex gap-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300"><AlertTriangle size={16} className="shrink-0" /> La tarifa es referencial, editable en el código y no representa una tarifa oficial.</p>
      </> : <EmptyState icon={<Zap />} title="Ingresa un consumo válido" description="El consumo en kWh debe ser mayor que cero." />}
      <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Historial de facturas</h2><span className="text-xs text-stone-500 dark:text-stone-400">Variación mensual</span></div>
        {loading ? <SkeletonCard /> : bills.length ? bills.map((bill, index) => {
          const prior = bills[index + 1];
          const variation = prior && Number(prior.totalBs) > 0 ? ((Number(bill.totalBs) - Number(prior.totalBs)) / Number(prior.totalBs)) * 100 : null;
          return <Card key={bill.id ?? bill.month} variant="flat" className="flex items-center justify-between"><div><b>{bill.month}</b><p className="text-xs text-stone-500 dark:text-stone-400">{bill.kWh} kWh · {Number(bill.co2Kg).toLocaleString('es-BO')} kg CO₂</p></div><div className="text-right"><b>{money(Number(bill.totalBs))}</b>{variation !== null && <p className={['text-xs', variation > 0 ? 'text-rose-700' : 'text-forest-700'].join(' ')}>{variation > 0 ? '+' : ''}{variation.toFixed(1)}%</p>}</div></Card>;
        }) : <EmptyState icon={<Zap />} title="Aún no hay facturas" description="Calcula y guarda la primera para ver la evolución mensual." />}
      </section>
    </div>
  );
}