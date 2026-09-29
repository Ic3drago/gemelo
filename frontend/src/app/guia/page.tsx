'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, ShoppingCart, Leaf, Zap, ScanLine, TrendingUp, Wallet,
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
    title: 'Registra tus compras',
    icon: <ShoppingCart className="h-5 w-5" />,
    description: 'Cada compra que registras alimenta el modelo de prediccion y te ayuda a entender tus gastos reales.',
    howTo: 'Ve a Registrar, selecciona "Compra", elige la categoria, escribe el articulo y el monto.',
    example: 'Supermercado, Papa 2kg, Bs 8.50',
    href: '/registro',
  },
  {
    id: 2,
    title: 'Controla tus alimentos',
    icon: <Leaf className="h-5 w-5" />,
    description: 'Registrar que alimentos guardas, consumes o desperdicias reduce tu huella de carbono y ahorra dinero.',
    howTo: 'Ve a Registrar, selecciona "Alimento" y usa los botones: Guardar, Consumido o Desperdicio.',
    example: 'Verduras, Tomates 500g — marcados como Consumido gana +10 pts',
    href: '/registro',
  },
  {
    id: 3,
    title: 'Monitorea tu energia',
    icon: <Zap className="h-5 w-5" />,
    description: 'Ingresar lecturas de tu medidor permite calcular tu huella de carbono y proyectar el costo de tu factura.',
    howTo: 'Ve a Registrar, selecciona "Energia" e ingresa el consumo en kWh del mes o semana.',
    example: '120 kWh = Bs 106.80 estimados + 45.6 kg CO2',
    href: '/registro',
  },
  {
    id: 4,
    title: 'Escanea facturas con la camara',
    icon: <ScanLine className="h-5 w-5" />,
    description: 'La funcion de escaneo extrae automaticamente los datos de tus recibos con OCR para ahorrar tiempo.',
    howTo: 'Ve a Escanear, toma una foto del recibo o subirla desde galeria, revisa los datos extraidos y guarda.',
    example: 'Ticket de Hipermaxi escaneado: extrae tienda, fecha, total e items en segundos',
    href: '/escanear',
  },
  {
    id: 5,
    title: 'Simula el futuro',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'El simulador usa tus datos historicos para proyectar como cambiaria tu consumo si adoptas nuevos habitos.',
    howTo: 'Ve a Predicciones, ajusta los deslizadores de reduccion y presiona Simular impacto.',
    example: 'Reducir 20% desperdicio durante 6 meses = ~12kg CO2 menos y Bs 240 ahorrados',
    href: '/simulador',
  },
  {
    id: 6,
    title: 'Gestiona tu presupuesto',
    icon: <Wallet className="h-5 w-5" />,
    description: 'La regla 50/30/20 divide tu ingreso en necesidades, deseos y ahorro para mantener salud financiera.',
    howTo: 'Ve a Presupuesto, revisa los anillos de progreso y agrega transacciones con el boton +.',
    example: 'Ingreso Bs 5,000: Necesidades max Bs 2,500 | Deseos max Bs 1,500 | Ahorro min Bs 1,000',
    href: '/presupuesto',
  },
];

const faqs: FAQ[] = [
  {
    q: '¿Con que frecuencia debo registrar datos?',
    a: 'Lo ideal es registrar cada compra o lectura de energia en el momento. Al menos una vez por semana es suficiente para que las predicciones sean precisas.',
  },
  {
    q: '¿Como se calculan los puntos?',
    a: 'Cada registro suma puntos: compra +5, lectura de energia +5, alimento guardado +2, alimento consumido +10. Acumula puntos para subir de nivel.',
  },
  {
    q: '¿Mis datos estan protegidos?',
    a: 'Los datos se almacenan localmente en tu hogar y solo se usan para generar predicciones. No se comparten con terceros.',
  },
  {
    q: '¿Puedo usar el gemelo sin internet?',
    a: 'La aplicacion funciona offline para consultar datos guardados. Para sincronizar nuevos registros necesitas conexion.',
  },
  {
    q: '¿Que pasa si ingreso un dato incorrecto?',
    a: 'Por ahora los datos se pueden ver en el historial. En futuras versiones podras editarlos directamente.',
  },
];

const glossary: GlossaryItem[] = [
  { term: 'Proyeccion', definition: 'Estimacion del comportamiento futuro basada en tus datos historicos. Indica la tendencia probable, no un valor exacto.' },
  { term: 'Rango de confianza', definition: 'Intervalo entre el mejor y peor escenario posible. Cuanto mas datos tengas, mas estrecho y preciso es el rango.' },
  { term: 'Gasto fijo', definition: 'Costo que se repite mensualmente con poco cambio: alquiler, servicios basicos, cuotas. El gemelo lo detecta automaticamente.' },
  { term: 'Desperdicio alimentario', definition: 'Alimento comprado pero que no se consuma. Se mide en kg y tiene un costo economico y de CO2 asociado.' },
  { term: 'Huella de carbono', definition: 'Total de emisiones de CO2 equivalente generadas por tus habitos de consumo energetico y alimentario.' },
  { term: 'kWh', definition: 'Kilovatio-hora: unidad de energia electrica. Un televisor tipico consume 0.1 kWh/hora.' },
];

export default function GuiaPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState('');

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

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-forest-50 dark:bg-forest-950 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-forest-600" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Empieza aqui</h1>
        </div>
        <p className="text-stone-500 text-sm leading-relaxed max-w-xl">
          El Gemelo Digital monitorea tus habitos de consumo del hogar. Registra compras, alimentos y energia para obtener predicciones personalizadas y reducir tu impacto ambiental.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
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
                      <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                        Paso {step.id}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100 mb-1">{step.title}</h3>
                    <p className="text-sm text-stone-500 mb-2 leading-relaxed">{step.description}</p>
                    <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Como hacerlo</p>
                      <p className="text-xs text-stone-500">{step.howTo}</p>
                    </div>
                    <div className="flex items-start gap-1.5 mb-3">
                      <span className="text-xs font-medium text-forest-600 shrink-0">Ejemplo:</span>
                      <span className="text-xs text-stone-500">{step.example}</span>
                    </div>
                    <Link href={step.href}>
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
                    className={['h-4 w-4 text-stone-400 shrink-0 transition-transform', openFaq === i ? 'rotate-180' : ''].join(' ')}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-stone-500 leading-relaxed">{faq.a}</p>
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
                <p className="text-xs text-stone-500 leading-relaxed">{item.definition}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {filteredSteps.length === 0 && filteredFaqs.length === 0 && filteredGlossary.length === 0 && (
        <p className="text-center text-stone-400 py-12">Sin resultados para "{search}"</p>
      )}
    </div>
  );
}
