'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

const ROUTE_LABELS: Record<string, string> = {
  '/app': 'el inicio',
  '/app/registrar': 'Registro',
  '/app/luz': 'Luz',
  '/app/futuro': 'Futuro',
  '/app/logros': 'Logros',
};

const STORAGE_KEY = 'gemelo-guided-tour-complete';

export default function GuidedTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (pathname === '/app' && !window.localStorage.getItem(STORAGE_KEY)) setActive(true);
  }, [pathname]);

  useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (!step) return;
    let raf = 0;
    let attempts = 0;

    const measure = () => {
      const target = document.querySelector(`[data-tour="${step.target}"]`);
      if (!target) {
        setRect(null);
        return false;
      }
      const bounds = target.getBoundingClientRect();
      setRect({ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height });
      return true;
    };

    const retry = () => {
      if (measure()) return;
      attempts += 1;
      if (attempts < 30) raf = requestAnimationFrame(retry);
    };

    const onTargetClick = (event: MouseEvent) => {
      if (!step.tap) return;
      const target = document.querySelector(`[data-tour="${step.target}"]`);
      if (target && event.target instanceof Node && target.contains(event.target)) setStepIndex((index) => index + 1);
    };

    retry();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    document.addEventListener('click', onTargetClick, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      document.removeEventListener('click', onTargetClick, true);
    };
  }, [active, pathname, stepIndex]);

  if (!active) return null;
  const step = steps[stepIndex];
  if (!step) return null;

  const onRoute = pathname === step.route;
  const anchored = rect !== null;
  const anchorTop = rect?.top ?? 0;
  const anchorLeft = rect?.left ?? 0;
  const anchorHeight = rect?.height ?? 0;
  const tooltipTop = anchored
    ? anchorTop + anchorHeight + 14 + 180 < window.innerHeight
      ? anchorTop + anchorHeight + 14
      : Math.max(16, anchorTop - 190)
    : Math.max(16, Math.round((window.innerHeight - 200) / 2));
  const tooltipLeft = anchored ? Math.max(16, Math.min(anchorLeft, window.innerWidth - 336)) : 16;

  const finish = () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');
    setActive(false);
  };

  return (
    <div className="guided-tour" aria-live="polite">
      {anchored && (
        <div className="guided-tour-spotlight" style={{ top: anchorTop - 5, left: anchorLeft - 5, width: (rect?.width ?? 0) + 10, height: (rect?.height ?? 0) + 10 }} />
      )}
      <section className="guided-tour-tooltip" style={{ top: tooltipTop, left: tooltipLeft }} aria-label={`Paso ${stepIndex + 1} de ${steps.length}`}>
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-forest-700 dark:text-forest-300">{stepIndex + 1} de {steps.length}</p><h2 className="mt-1 text-base font-bold">{step.title}</h2></div><button type="button" onClick={finish} aria-label="Omitir paseo"><X size={18} /></button></div>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{step.text}</p>
        {anchored && !onRoute && (
          <p className="mt-2 text-sm font-medium text-forest-700 dark:text-forest-300">Este paso está en {ROUTE_LABELS[step.route] ?? step.route}.</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <button type="button" className="text-sm text-stone-500 underline dark:text-stone-400" onClick={finish}>Omitir</button>
          {anchored && !onRoute ? (
            <button type="button" className="tour-next" onClick={() => router.push(step.route)}>Ir a {ROUTE_LABELS[step.route] ?? step.route}</button>
          ) : (
            <button type="button" className="tour-next" onClick={() => stepIndex === steps.length - 1 ? finish() : setStepIndex(stepIndex + 1)}>{stepIndex === steps.length - 1 ? 'Terminar' : 'Siguiente'}</button>
          )}
        </div>
      </section>
    </div>
  );
}
