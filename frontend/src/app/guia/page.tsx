'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, ShoppingCart, Leaf, Zap, ScanLine, TrendingUp, Wallet, Trophy,
  ChevronDown, ChevronRight, Search,
} from 'lucide-react';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';

interface Step {
  id: number;
  title: string;
  icon: React.ReactNode;
  description: string;
  howTo: string;
  example: string;
  href: string;
}

interface FAQ {
  q: string;
  a: string;
}

interface GlossaryItem {
  term: string;
  definition: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Configura el hogar y el presupuesto',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Define el ingreso mensual para que el resumen 50/30/20 y el saldo disponible tengan una referencia útil.',
    howTo: '1. Abre Presupuesto. 2. Ingresa el ingreso mensual y guarda. 3. Revisa límites y cuentas.',
    example: 'Con Bs 4.200: necesidades Bs 2.100, deseos Bs 1.260 y ahorro Bs 840.',
    href: '/app/presupuesto',
  },
  {
    id: 2,
    title: 'Registra una compra o escanea una factura',
    icon: <ShoppingCart className="h-5 w-5" />,
    description: 'Cada gasto alimenta el historial y permite estimar cómo cambian tus compras mes a mes.',
    howTo: '1. Abre Registrar. 2. Escribe categoría, producto y monto, o abre Escanear. 3. Revisa y confirma.',
    example: 'Arroz y verduras por Bs 38.50 en la categoría Alimentos.',
    href: '/app/registrar',
  },
  {
    id: 3,
    title: 'Lee el panel mensual',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'El inicio reúne saldo, alertas, avance 50/30/20 y huella del hogar.',
    howTo: '1. Abre Inicio. 2. Mira el saldo disponible. 3. Compara alertas y tendencia.',
    example: 'Ingreso Bs 4.200 menos gastos Bs 3.470 deja Bs 730 disponibles.',
    href: '/app',
  },
  {
    id: 4,
    title: 'Entiende las predicciones',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'La línea central muestra una tendencia y la banda comunica variación posible, no una certeza.',
    howTo: '1. Abre Futuro. 2. Elige gasto, energía o desperdicio. 3. Compara la línea con el rango.',
    example: 'Un gasto proyectado de Bs 2.300 puede mostrarse con un rango aproximado de Bs 2.050 a Bs 2.550.',
    href: '/app/futuro',
  },
  {
    id: 5,
    title: 'Prueba un hábito en el simulador',
    icon: <Zap className="h-5 w-5" />,
    description: 'Compara el escenario actual con una reducción de energía, desperdicio o compras.',
    howTo: '1. Abre Futuro. 2. Ajusta los porcentajes. 3. Pulsa Simular impacto.',
    example: 'Evitar 2 kg de desperdicio estima Bs 40 de ahorro y 5 kg de CO₂ evitados.',
    href: '/app/futuro',
  },
  {
    id: 6,
    title: 'Gana tus primeros logros',
    icon: <Trophy className="h-5 w-5" />,
    description: 'Los puntos hacen visibles hábitos registrados; cada tipo de actividad tiene una regla fija.',
    howTo: '1. Abre Registrar. 2. Registra una compra o consume un alimento. 3. Revisa Logros.',
    example: 'Una compra suma 5 puntos; consumir un alimento suma 10 puntos.',
    href: '/app/logros',
  },
];

const faqs: FAQ[] = [
  {
    q: '¿Con que frecuencia debo registrar datos?',
    a: 'Lo ideal es registrar cada compra o lectura de energia en el momento. Al menos una vez por semana es suficiente para que las predicciones sean precisas.',
  },
  {
    q: '¿Como se calculan los puntos?',
    a: 'Compra +5, energía eficiente +15, energía normal +3, alimento consumido +10 y alimento desperdiciado -5.',
  },
  {
    q: '¿Mis datos estan protegidos?',
    a: 'Los datos se almacenan localmente en tu hogar y solo se usan para generar predicciones. No se comparten con terceros.',
  },
  {
    q: '¿Puedo usar el gemelo sin internet?',
    a: 'En modo demo se consultan datos de ejemplo guardados en el navegador. Para guardar datos reales necesitas conexión con los servicios.',
  },
  {
    q: '¿Que pasa si ingreso un dato incorrecto?',
    a: 'Por ahora los datos se pueden ver en el historial. En futuras versiones podras editarlos directamente.',
  },
];

const glossary: GlossaryItem[] = [
  { term: 'Proyección', definition: 'Estimación del comportamiento futuro basada en una serie histórica. Indica tendencia, no un valor garantizado.' },
  { term: 'Rango', definition: 'Intervalo de variación estimado a partir de los residuos de la regresión. No es una garantía estadística oficial.' },
  { term: 'Gasto fijo', definition: 'Costo que se repite mensualmente con pocos cambios, como alquiler o servicios.' },
  { term: 'Desperdicio', definition: 'Alimento registrado como desperdiciado, medido en kilogramos y asociado a costo y CO₂ estimados.' },
  { term: 'Huella de carbono', definition: 'Total de emisiones de CO2 equivalente generadas por tus habitos de consumo energetico y alimentario.' },
  { term: 'kWh', definition: 'Kilovatio-hora: unidad de energia electrica. Un televisor tipico consume 0.1 kWh/hora.' },
];

export default function GuiaPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [completed, setCompleted] = useState<number[]>([]);
  const [contextScreen, setContextScreen] = useState('');

  useEffect(() => {
    try { setCompleted(JSON.parse(localStorage.getItem('gemelo-guide-progress') ?? '[]') as number[]); } catch { setCompleted([]); }
    setContextScreen(new URLSearchParams(window.location.search).get('screen') ?? '');
  }, []);

  const completeStep = (stepId: number) => {
    setCompleted((previous) => {
      const next = previous.includes(stepId) ? previous : [...previous, stepId];
      localStorage.setItem('gemelo-guide-progress', JSON.stringify(next));
      return next;
    });
  };

  const filteredSteps = search
    ? steps.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase())
      )
    : steps;

  const filteredFaqs = search
    ? faqs.filter(
        (f) =>
          f.q.toLowerCase().includes(search.toLowerCase()) ||
          f.a.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  const filteredGlossary = search
    ? glossary.filter(
        (g) =>
          g.term.toLowerCase().includes(search.toLowerCase()) ||
          g.definition.toLowerCase().includes(search.toLowerCase())
      )
    : glossary;
  const contextText = contextScreen.endsWith('/luz')
    ? 'En Luz, ingresa los kWh de la factura y confirma el mes; el total y CO₂ mostrados son referenciales.'
    : contextScreen.endsWith('/futuro')
      ? 'En Futuro, compara la tendencia con su rango y luego modifica los porcentajes para probar un escenario.'
      : contextScreen.endsWith('/registrar') || contextScreen.endsWith('/escaneo')
        ? 'En Registro, confirma categoría y monto. El OCR solo propone datos; la factura se guarda al confirmar.'
        : contextScreen.endsWith('/presupuesto')
          ? 'En Presupuesto, define el ingreso y revisa saldos de cuentas, metas y distribución mensual.'
          : contextScreen.endsWith('/logros')
            ? 'En Logros, revisa tu nivel, los puntos que faltan y la actividad que los generó.'
            : 'En Inicio, revisa el saldo disponible, alertas, avance del presupuesto y huella del mes.';

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-forest-50 dark:bg-forest-950 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-forest-600 dark:text-forest-400" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Empieza aqui</h1>
        </div>
        <p className="text-stone-500 text-sm leading-relaxed max-w-xl dark:text-stone-400">
          El Gemelo Digital monitorea tus habitos de consumo del hogar. Registra compras, alimentos y energia para obtener predicciones personalizadas y reducir tu impacto ambiental.
        </p>
      </div>

      <Card variant="flat">
        <div className="flex items-center justify-between text-sm"><b>Progreso de aprendizaje</b><span>{completed.length} de {steps.length} pasos</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"><div className="h-full bg-forest-600" style={{ width: `${completed.length / steps.length * 100}%` }} /></div>
      </Card>
      {contextScreen && <Card variant="flat" className="border-l-4 border-l-sky-600"><p className="text-sm font-semibold">Ayuda contextual: {contextScreen.replace('/app/', '').replace('/app', 'Inicio')}</p><p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{contextText}</p></Card>}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none dark:text-stone-500" />
        <input
          type="search"
          placeholder="Buscar en la guia..."
          className="input-base pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Steps */}
      {filteredSteps.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">
            {search ? `Resultados (${filteredSteps.length})` : '6 pasos para dominar el gemelo'}
          </h2>
          <div className="space-y-4">
            {filteredSteps.map((step) => (
              <Card key={step.id} variant="flat" className="group">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-forest-50 dark:bg-forest-950 flex items-center justify-center text-forest-600 dark:text-forest-400 shrink-0 mt-0.5">
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide dark:text-stone-500">
                        Paso {step.id}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100 mb-1">{step.title}</h3>
                    <p className="text-sm text-stone-500 mb-2 leading-relaxed dark:text-stone-400">{step.description}</p>
                    <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Como hacerlo</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">{step.howTo}</p>
                    </div>
                    <div className="flex items-start gap-1.5 mb-3">
                      <span className="text-xs font-medium text-forest-600 shrink-0 dark:text-forest-400">Ejemplo:</span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">{step.example}</span>
                    </div>
                    <Link href={step.href} onClick={() => completeStep(step.id)}>
                      <Button variant="secondary" size="sm" icon={<ChevronRight className="h-4 w-4" />}>
                        Hacerlo ahora
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* How predictions work */}
      {!search && (
        <Card variant="flat" className="bg-forest-50 dark:bg-forest-950 border-forest-100 dark:border-forest-900">
          <h2 className="text-base font-semibold text-forest-800 dark:text-forest-200 mb-2">
            Como se calculan las predicciones
          </h2>
          <p className="text-sm text-forest-700 dark:text-forest-300 leading-relaxed">
            El modelo analiza tu historial de compras, energia y alimentos usando series de tiempo. Identifica patrones semanales y estacionales para proyectar el comportamiento futuro. Con mas datos (al menos 4 semanas), las predicciones son mas precisas y el rango de confianza se reduce. El simulador aplica los cambios que eliges a esa proyeccion base para mostrar el impacto esperado.
          </p>
        </Card>
      )}

      {/* FAQ */}
      {filteredFaqs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">
            Preguntas frecuentes
          </h2>
          <div className="space-y-2">
            {filteredFaqs.map((faq, i) => (
              <Card key={i} variant="flat" padding={false} className="overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-3 text-left p-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{faq.q}</span>
                  <ChevronDown
                    className={['h-4 w-4 text-stone-400 shrink-0 transition-transform dark:text-stone-500', openFaq === i ? 'rotate-180' : ''].join(' ')}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-stone-500 leading-relaxed dark:text-stone-400">{faq.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Glossary */}
      {filteredGlossary.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Glosario</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredGlossary.map((item) => (
              <Card key={item.term} variant="flat">
                <p className="text-sm font-semibold text-forest-700 dark:text-forest-300 mb-1">{item.term}</p>
                <p className="text-xs text-stone-500 leading-relaxed dark:text-stone-400">{item.definition}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {filteredSteps.length === 0 && filteredFaqs.length === 0 && filteredGlossary.length === 0 && (
        <p className="text-center text-stone-400 py-12 dark:text-stone-500">Sin resultados para "{search}"</p>
      )}
    </div>
  );
}
