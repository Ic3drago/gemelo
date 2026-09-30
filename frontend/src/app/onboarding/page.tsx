'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Leaf, PiggyBank, Receipt, Sparkles, Users } from 'lucide-react';
import { Button } from '@/design-system/Button';
import { Card } from '@/design-system/Card';

const GOALS = [
  { id: 'ahorro', title: 'Ahorrar dinero', desc: 'Reducir gastos innecesarios', Icon: PiggyBank },
  { id: 'deudas', title: 'Pagar deudas', desc: 'Salir de deudas más rápido', Icon: Receipt },
  { id: 'eco', title: 'Ser más ecológico', desc: 'Reducir desperdicio y consumo', Icon: Leaf },
] as const;

const STEPS = ['Tu hogar', 'Tus finanzas', 'Tu objetivo', 'Listo'] as const;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    size: 1,
    income: '',
    expenses: '',
    goal: 'ahorro',
  });

  const nextStep = () => setStep((value) => Math.min(value + 1, STEPS.length));
  const prevStep = () => setStep((value) => Math.max(value - 1, 1));
  const update = (patch: Partial<typeof formData>) => setFormData((current) => ({ ...current, ...patch }));

  const inputClass =
    'w-full h-11 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 text-base text-stone-900 dark:text-stone-50 placeholder-stone-400 dark:placeholder-stone-500 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25';

  return (
    <div className="min-h-dvh bg-[var(--bg)] flex flex-col items-center pt-10 px-4 pb-24">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="mb-3 flex gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step}>
            {STEPS.map((label, index) => (
              <div
                key={label}
                aria-hidden="true"
                className={[
                  'h-1.5 flex-1 rounded-full transition-colors duration-300',
                  step > index ? 'bg-brand-700 dark:bg-accent-500' : 'bg-stone-300 dark:bg-stone-700',
                ].join(' ')}
              />
            ))}
          </div>
          <p className="text-center text-sm text-stone-500 dark:text-stone-400">
            Paso {step} de {STEPS.length} · {STEPS[step - 1]}
          </p>
        </div>

        <Card>
          {step === 1 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">¡Bienvenido!</h1>
              <p className="text-stone-600 dark:text-stone-300 mb-6">Para empezar, cuéntanos un poco sobre tu hogar.</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="onb-name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Nombre del hogar
                  </label>
                  <input
                    id="onb-name"
                    type="text"
                    className={inputClass}
                    placeholder="Ej. Familia Pérez"
                    value={formData.name}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="onb-size" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    ¿Cuántas personas viven contigo?
                  </label>
                  <div className="relative">
                    <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" aria-hidden="true" />
                    <input
                      id="onb-size"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      className={`${inputClass} pl-9`}
                      value={formData.size}
                      onChange={(e) => update({ size: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">Tus finanzas</h2>
              <p className="text-stone-600 dark:text-stone-300 mb-6">Calcularemos un presupuesto inicial para ti.</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="onb-income" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Ingreso mensual estimado (Bs)
                  </label>
                  <input
                    id="onb-income"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    className={inputClass}
                    placeholder="0.00"
                    value={formData.income}
                    onChange={(e) => update({ income: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="onb-expenses" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Gastos fijos estimados (Bs)
                  </label>
                  <input
                    id="onb-expenses"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    className={inputClass}
                    placeholder="Alquiler, servicios..."
                    value={formData.expenses}
                    onChange={(e) => update({ expenses: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">¿Cuál es tu objetivo?</h2>
              <p className="text-stone-600 dark:text-stone-300 mb-6">Selecciona lo que más te importa ahora.</p>

              <div className="space-y-2.5">
                {GOALS.map(({ id, title, desc, Icon }) => {
                  const selected = formData.goal === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => update({ goal: id })}
                      className={[
                        'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition',
                        selected
                          ? 'border-brand-600 bg-brand-50 dark:border-accent-500 dark:bg-accent-950'
                          : 'border-stone-200 dark:border-stone-700 hover:border-brand-400 dark:hover:border-accent-600',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                          selected
                            ? 'bg-brand-700 text-white dark:bg-accent-500 dark:text-stone-950'
                            : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
                        ].join(' ')}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-stone-900 dark:text-stone-50">{title}</span>
                        <span className="block text-sm text-stone-500 dark:text-stone-400">{desc}</span>
                      </span>
                      {selected ? (
                        <Check className="h-5 w-5 shrink-0 text-brand-700 dark:text-accent-400" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-700 dark:bg-accent-950 dark:text-accent-400">
                <Sparkles className="h-9 w-9" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">¡Todo listo!</h2>
              <p className="text-stone-600 dark:text-stone-300 mb-6">
                Para empezar, registra tu primera compra escaneando un recibo.
              </p>
              <Button variant="secondary" fullWidth onClick={() => router.push('/app/escaneo')}>
                Escanear mi primer recibo
              </Button>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button variant="ghost" onClick={prevStep}>
                Atrás
              </Button>
            )}
            {step < STEPS.length ? (
              <Button variant="primary" fullWidth onClick={nextStep}>
                Continuar
              </Button>
            ) : (
              <Button variant="primary" fullWidth onClick={() => router.push('/app')}>
                Ir al inicio
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
