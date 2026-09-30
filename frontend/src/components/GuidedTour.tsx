'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

const steps = [
  { target: 'dashboard-budget', route: '/app', title: 'Tu mes, de un vistazo', text: 'Aquí ves cuánto queda del ingreso mensual y el avance de tus gastos.' },
  { target: 'dashboard-rules', route: '/app', title: 'Regla 50/30/20', text: 'Compara necesidades, deseos y ahorro con la distribución de referencia.' },
  { target: 'dashboard-trend', route: '/app', title: 'Tendencia del gasto', text: 'El historial ayuda a notar cambios de un mes a otro.' },
  { target: 'dashboard-co2', route: '/app', title: 'Huella del hogar', text: 'La huella reúne energía, compras y desperdicio registrados.' },
  { target: 'tour-nav-registrar', route: '/app', title: 'Registra una actividad', text: 'Toca Registrar en la barra inferior para continuar.', tap: true },
  { target: 'registration-form', route: '/app/registrar', title: 'Compra o alimento', text: 'Registra un monto o una cantidad y confirma el formulario.' },
  { target: 'tour-nav-luz', route: '/app/registrar', title: 'Calcula una factura', text: 'Toca Luz para abrir el cálculo por tramos.', tap: true },
  { target: 'light-calculator', route: '/app/luz', title: 'Consumo eléctrico', text: 'Ingresa kWh, revisa el cargo estimado y guarda el mes.' },
  { target: 'tour-nav-futuro', route: '/app/luz', title: 'Mira hacia adelante', text: 'Toca Futuro para abrir proyecciones y simulación.', tap: true },
  { target: 'simulation-controls', route: '/app/futuro', title: 'Prueba un hábito', text: 'Ajusta los controles para comparar un escenario de ahorro.' },
  { target: 'tour-nav-logros', route: '/app/futuro', title: 'Tus primeros puntos', text: 'Toca Logros para revisar nivel, puntos y actividades.', tap: true },
  { target: 'achievement-profile', route: '/app/logros', title: 'Sigue avanzando', text: 'Cada registro suma o resta puntos según las reglas del proyecto.' },
];

const STORAGE_KEY = 'gemelo-guided-tour-complete';

export default function GuidedTour() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState({ top: 100, left: 24, width: 280, height: 48 });

  useEffect(() => {
    if (pathname === '/app' && !window.localStorage.getItem(STORAGE_KEY)) setActive(true);
  }, [pathname]);

  useEffect(() => {
    if (!active) return;
    const update = () => {
      const target = document.querySelector(`[data-tour="${steps[stepIndex].target}"]`);
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      setRect({ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height });
    };
    const onTargetClick = (event: MouseEvent) => {
      if (!steps[stepIndex].tap) return;
      const target = document.querySelector(`[data-tour="${steps[stepIndex].target}"]`);
      if (target && event.target instanceof Node && target.contains(event.target)) setStepIndex((index) => index + 1);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    document.addEventListener('click', onTargetClick, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      document.removeEventListener('click', onTargetClick, true);
    };
  }, [active, pathname, stepIndex]);

  if (!active) return null;
  const step = steps[stepIndex];
  if (!step) return null;
  const tooltipTop = rect.top + rect.height + 14 + 180 < window.innerHeight ? rect.top + rect.height + 14 : Math.max(16, rect.top - 190);
  const tooltipLeft = Math.max(16, Math.min(rect.left, window.innerWidth - 336));

  const finish = () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');
    setActive(false);
  };

  return (
    <div className="guided-tour" aria-live="polite">
      <div className="guided-tour-spotlight" style={{ top: rect.top - 5, left: rect.left - 5, width: rect.width + 10, height: rect.height + 10 }} />
      <section className="guided-tour-tooltip" style={{ top: tooltipTop, left: tooltipLeft }} aria-label={`Paso ${stepIndex + 1} de ${steps.length}`}>
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-forest-700 dark:text-forest-300">{stepIndex + 1} de {steps.length}</p><h2 className="mt-1 text-base font-bold">{step.title}</h2></div><button type="button" onClick={finish} aria-label="Omitir paseo"><X size={18} /></button></div>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{step.text}</p>
        <div className="mt-4 flex items-center justify-between"><button type="button" className="text-sm text-stone-500 underline dark:text-stone-400" onClick={finish}>Omitir</button><button type="button" className="tour-next" onClick={() => stepIndex === steps.length - 1 ? finish() : setStepIndex(stepIndex + 1)}>{stepIndex === steps.length - 1 ? 'Terminar' : 'Siguiente'}</button></div>
      </section>
    </div>
  );
}