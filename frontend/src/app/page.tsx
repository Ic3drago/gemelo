'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Coins,
  Leaf,
  LineChart,
  Lightbulb,
  PiggyBank,
  ScanLine,
  ShoppingCart,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { countUpAll, float, heroIntro, revealOnScroll, scrollProgress, tiltOnHover } from '@/lib/animations';

const MODULES = [
  {
    icon: ShoppingCart,
    title: 'Compras',
    body: 'Registra cada compra con categoría, monto y huella estimada. El sistema agrupa el gasto mensual y detecta en qué se te va.',
    tag: 'Bs por categoría',
  },
  {
    icon: Zap,
    title: 'Energía',
    body: 'Carga lecturas mensuales en kWh, calcula el monto por tramos y compara contra el promedio del hogar.',
    tag: 'kWh · Bs · CO₂',
  },
  {
    icon: Trash2,
    title: 'Alimentos',
    body: 'Controla qué tienes almacenado, marca lo que consumes o desechas y recibe avisos antes de quecadique.',
    tag: 'Desperdicio en kg',
  },
  {
    icon: PiggyBank,
    title: 'Finanzas',
    body: 'Cuentas de efectivo, banco y ahorro, con saldos que se actualizan al registrar ingresos o egresos.',
    tag: 'Regla 50/30/20',
  },
  {
    icon: ScanLine,
    title: 'Facturas (OCR)',
    body: 'Sube una foto de tu recibo y extrae los datos. Nada se guarda hasta que confirmas que son correctos.',
    tag: 'Tesseract · es',
  },
  {
    icon: LineChart,
    title: 'Simulación',
    body: 'Ajusta cuánto reducirías en energía, desperdicio o compras y mira el ahorro estimado a 1, 3 y 6 meses.',
    tag: 'Escenarios',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Registra',
    body: 'Compra, lectura o alimento. Manual o escaneando la factura: el OCR propone y tú confirmas.',
  },
  {
    n: '02',
    title: 'Analiza',
    body: 'El gateway consolida los datos de todos los servicios y calcula gasto, huella, desperdicio y saldos.',
  },
  {
    n: '03',
    title: 'Decide',
    body: 'Proyecciones y escenarios muestran qué cambia si ajustas un hábito concreto del hogar.',
  },
];

const BENEFITS = [
  {
    icon: Lightbulb,
    title: 'Visibilidad real, no intuición',
    body: 'La mayoría de hogares no sabe cuánto gasta en un mes ni cuánto consume realmente de energía. Aquí queda registrado y se puede desglosar.',
  },
  {
    icon: Target,
    title: 'Decisiones comparables',
    body: 'Un escenario no es una promesa: es la diferencia entre tu consumo actual y el ajustado, con el mismo modelo.',
  },
  {
    icon: Sparkles,
    title: 'Motivación sostenida',
    body: 'Puntos por cada acción sostenible y logros que explican qué cambió, no solo un ranking.',
  },
  {
    icon: Coins,
    title: 'Ahorro medible',
    body: 'El presupuesto 50/30/20 convierte intentions en límites concretos y muestra lo que queda disponible.',
  },
];

const SDG_TARGETS = [
  { code: '12.1', text: 'Conocer y medir el consumo de recursos del hogar.' },
  { code: '12.3', text: 'Reducir el desperdicio de alimentos y el de los residuos del hogar.' },
  { code: '12.4', text: 'Mejorar la información y la conciencia sobre el uso sostenible de recursos.' },
  { code: '12.8', text: 'Fortalecer la educación para un consumo responsable.' },
];

const FAQ = [
  {
    q: '¿La tarifa eléctrica y los factores de CO₂ son los oficiales?',
    a: 'No. Son valores referenciales y editables, definidos en el código del servicio de simulación para poder modelar escenarios. No sustituyen una factura real ni son una fuente oficial.',
  },
  {
    q: '¿Qué pasa con la privacidad de mis datos?',
    a: 'Los datos de cada hogar se guardan en bases lógicas separadas por servicio, y los servicios se comunican por eventos, no por acceso directo a la base de otro servicio. Ninguna lectura se envía a terceros.',
  },
  {
    q: '¿Las predicciones son confiables?',
    a: 'El motor usa regresión lineal sobre el histórico del hogar. Con menos de ocho meses de datos se marcan como preliminares y se muestran con un rango de variación, no como un valor exacto.',
  },
  {
    q: '¿Puedo probar sin levantar los servicios?',
    a: 'Sí. El frontend incluye un modo demostración con datos de ejemplo en el navegador. Si no hay un API configurado, la app arranca automáticamente en ese modo.',
  },
  {
    q: '¿Qué pasa con la factura escaneada?',
    a: 'El OCR extrae los campos y los devuelve para revisión. La compra solo se crea cuando confirmas, y en ese momento genera recordatorios para los productos perecibles detectados.',
  },
  {
    q: '¿Cómo se calcula la gamificación?',
    a: 'Compra registrada suma 5 puntos, energía eficiente 15, energía normal 3, alimento consumido 10 y desperdiciado resta 5. Los umbrales de nivel están en el servicio de gamificación.',
  },
];

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cleanups = [
      heroIntro({
        headline: '.landing-hero h1',
        copy: '.landing-hero-copy > p:not(.landing-kicker):not(.landing-note)',
        actions: '.landing-actions > *',
        device: '.landing-device',
        floatTag: '.landing-float-tag',
      }),
      revealOnScroll('.landing-reveal', { y: 28, gap: 90 }),
      countUpAll('[data-count]'),
      float('.landing-float-tag', { distance: 8, duration: 3600 }),
      float('.landing-chip-icon', { distance: 5, duration: 2800, gap: 220 }),
      tiltOnHover('.landing-module', { max: 4 }),
      scrollProgress('.landing-progress-bar'),
    ];
    return () => cleanups.forEach((fn) => fn?.());
  }, []);

  return (
    <div className="landing-page" ref={rootRef}>
      <div className="landing-progress-bar" aria-hidden="true" />

      <header className="landing-nav">
        <Link href="/" className="landing-brand">
          Gemelo<span>Digital</span>
        </Link>
        <nav aria-label="Navegación principal">
          <a href="#modulos">Módulos</a>
          <a href="#propuesta">El proyecto</a>
          <a href="#arquitectura">Arquitectura</a>
          <a href="#documentacion">Documentación</a>
        </nav>
        <div className="landing-nav-end">
          <ThemeToggle iconOnly className="landing-theme" />
          <Link href="/app" className="landing-nav-cta">
            Probar demo
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-kicker">ODS 12 · Consumo responsable</p>
          <h1>Gemelo Digital de Consumo del Hogar</h1>
          <p>
            Una herramienta para entender cómo se relacionan tus compras, tu energía y tus alimentos, y
            decidir con información más clara en lugar de con suposiciones.
          </p>
          <div className="landing-actions">
            <Link href="/app" className="landing-primary">
              Probar demo <ChevronRight aria-hidden="true" />
            </Link>
            <a href="#propuesta" className="landing-secondary">
              Conocer el proyecto
            </a>
          </div>
          <p className="landing-note">
            Demostración educativa · Datos de ejemplo · Tarifa eléctrica referencial
          </p>

          <ul className="landing-badges">
            <li>
              <Leaf aria-hidden="true" />Huella de CO₂
            </li>
            <li>
              <Zap aria-hidden="true" />Energía por tramos
            </li>
            <li>
              <Trophy aria-hidden="true" />Logros y puntos
            </li>
          </ul>
        </div>

        <div className="landing-device-wrap" aria-label="Vista previa de la aplicación">
          <div className="landing-device">
            <div className="landing-device-top">
              <span>9:41</span>
              <span>•••</span>
            </div>
            <div className="landing-device-content">
              <p className="landing-device-date">SEPTIEMBRE 2026</p>
              <h2>Te quedan este mes</h2>
              <strong>Bs 730</strong>
              <div className="landing-progress">
                <span />
              </div>
              <p className="landing-device-muted">Bs 3.470 gastados · 83% del ingreso</p>
              <div className="landing-mini-stats">
                <div>
                  <span>Huella</span>
                  <b>168 kg</b>
                </div>
                <div>
                  <span>Energía</span>
                  <b>255 kWh</b>
                </div>
              </div>
              <div className="landing-device-alert">
                <span /> Energía 11% sobre el promedio
              </div>
              <div className="landing-bars" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="landing-device-tabs">
              <span>Inicio</span>
              <span>Registrar</span>
              <span>Luz</span>
              <span>Futuro</span>
              <span>Logros</span>
            </div>
          </div>
          <div className="landing-float-tag">Predicciones para decidir mejor</div>
        </div>
      </section>

      {/* ── Métricas ─────────────────────────────────────────────────── */}
      <section className="landing-metrics" aria-label="Resumen del proyecto">
        <div>
          <strong data-count="7" data-suffix=" servicios">0</strong>
          <span>microservicios independientes</span>
        </div>
        <div>
          <strong data-count="30" data-suffix="+ endpoints">0</strong>
          <span>contratos REST en el gateway</span>
        </div>
        <div>
          <strong data-count="4" data-prefix="ODS " data-suffix=" metas">0</strong>
          <span>del objetivo 12 cubiertos</span>
        </div>
        <div>
          <strong data-count="1" data-suffix=" evento">0</strong>
          <span>exchange <code>household.events</code></span>
        </div>
      </section>

      {/* ── Propuesta ────────────────────────────────────────────────── */}
      <section id="propuesta" className="landing-section landing-intro landing-reveal">
        <div>
          <p className="landing-kicker">Una vista conectada del hogar</p>
          <h2>Del registro cotidiano a una decisión concreta.</h2>
        </div>
        <p>
          Gemelo reúne indicadores simples del consumo doméstico. Registra compras, escanea facturas y
          compara escenarios de energía y desperdicio con proyecciones explicables. No sustituye una
          factura ni un contador: convierte lo que ya mides en algo que puedes anticipar.
        </p>
      </section>

      {/* ── Pilares ──────────────────────────────────────────────────── */}
      <section className="landing-pillars landing-reveal" aria-label="Capacidades principales">
        <article>
          <span>01</span>
          <h3>Predice</h3>
          <p>Explora tendencias de gasto, energía, desperdicio y CO₂ con rangos de variación.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Escanea</h3>
          <p>Extrae información de facturas y pide confirmación antes de registrar una compra.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Administra</h3>
          <p>Organiza presupuesto, saldos y metas de ahorro con una regla 50/30/20.</p>
        </article>
      </section>

      {/* ── Módulos ──────────────────────────────────────────────────── */}
      <section id="modulos" className="landing-section landing-reveal">
        <div className="landing-section-head">
          <div>
            <p className="landing-kicker">Módulos</p>
            <h2>Seis áreas que comparten los mismos datos.</h2>
          </div>
          <p>
            Cada módulo es un servicio con su propia base lógica, pero todos hablan el mismo idioma
           a través de eventos. Así puedes usar uno solo o verlos todos en el mismo resumen.
          </p>
        </div>
        <div className="landing-modules">
          {MODULES.map(({ icon: Icon, title, body, tag }) => (
            <article className="landing-module" key={title}>
              <div className="landing-module-top">
                <span className="landing-module-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="landing-module-tag">{tag}</span>
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────────────── */}
      <section className="landing-section landing-steps landing-reveal">
        <div className="landing-section-head">
          <div>
            <p className="landing-kicker">Cómo se maneja</p>
            <h2>Tres pasos, sin depender del orden.</h2>
          </div>
          <p>
            Puedes empezar por cualquiera de los tres. Los eventos viajan por RabbitMQ, así que registrar
            una compra actualiza el presupuesto y la gamificación sin acoplar los servicios.
          </p>
        </div>
        <ol className="landing-steps-list">
          {STEPS.map(({ n, title, body }) => (
            <li key={n}>
              <span className="landing-step-n">{n}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
        <div className="landing-flow-track" aria-hidden="true">
          <span>Registrar</span>
          <i />
          <span>Evento</span>
          <i className="event-pulse" />
          <span>Predicción</span>
          <i />
          <span>Decisión</span>
        </div>
      </section>

      {/* ── Predicciones ─────────────────────────────────────────────── */}
      <section className="landing-section landing-forecast landing-reveal">
        <div className="landing-section-head">
          <div>
            <p className="landing-kicker">Simulación</p>
            <h2>Escenarios, no promesas.</h2>
          </div>
          <p>
            Mueve los tres palancas que más influyen en tu huella y observa el resultado sobre el mismo
            modelo que usa el resto de la aplicación.
          </p>
        </div>
        <div className="landing-levers">
          <div>
            <Zap className="landing-chip-icon" aria-hidden="true" />
            <b>Energía</b>
            <span>Reduce el consumo un 10%</span>
            <em>−24 kWh/mes</em>
          </div>
          <div>
            <Trash2 className="landing-chip-icon" aria-hidden="true" />
            <b>Desperdicio</b>
            <span>Reduce un 20%</span>
            <em>−3,4 kg/mes</em>
          </div>
          <div>
            <ShoppingCart className="landing-chip-icon" aria-hidden="true" />
            <b>Compras</b>
            <span>Reduce un 5%</span>
            <em>−Bs 174/mes</em>
          </div>
        </div>
        <p className="landing-forecast-note">
          Valores ilustrativos calculados con los factores referenciales del proyecto. El escenario real
          se recalcula con los datos del hogar.
        </p>
      </section>

      {/* ── Beneficios ───────────────────────────────────────────────── */}
      <section className="landing-section landing-reveal">
        <div className="landing-section-head">
          <div>
            <p className="landing-kicker">Por qué sirve</p>
            <h2>Lo que cambia cuando el consumo es visible.</h2>
          </div>
        </div>
        <div className="landing-benefits-grid">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <article key={title}>
              <Icon aria-hidden="true" />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Arquitectura ─────────────────────────────────────────────── */}
      <section id="arquitectura" className="landing-section landing-architecture landing-reveal">
        <div>
          <p className="landing-kicker">Arquitectura</p>
          <h2>Servicios pequeños, contratos claros.</h2>
        </div>
        <div className="architecture-stack">
          <div>
            <b>Interfaz</b>
            <span>Next.js · PWA</span>
          </div>
          <div>
            <b>Gateway</b>
            <span>NestJS · API REST</span>
          </div>
          <div className="architecture-services">
            <b>Servicios</b>
            <span>Compras · Energía · Alimentos · Finanzas · Gamificación · Simulación</span>
          </div>
          <div>
            <b>Bus de eventos</b>
            <span>RabbitMQ · contratos de dominio</span>
          </div>
          <div>
            <b>Datos</b>
            <span>PostgreSQL · persistencia por servicio</span>
          </div>
        </div>
      </section>

      <section className="landing-tech landing-reveal">
        <p className="landing-kicker">Tecnologías</p>
        <div>
          <span>Next.js</span>
          <span>NestJS</span>
          <span>FastAPI</span>
          <span>scikit-learn</span>
          <span>RabbitMQ</span>
          <span>PostgreSQL</span>
          <span>Tesseract OCR</span>
        </div>
      </section>

      {/* ── ODS 12 ───────────────────────────────────────────────────── */}
      <section className="landing-section landing-reveal">
        <div className="landing-section-head">
          <div>
            <p className="landing-kicker">Alineación con el ODS 12</p>
            <h2>Producción y consumo responsables.</h2>
          </div>
          <p>
            El proyecto no es solo una app de finanzas: el objetivo es que el hogar pueda observar su
            consumo y entender de dónde viene, que es exactamente el foco del ODS 12.
          </p>
        </div>
        <ul className="landing-sdg-list">
          {SDG_TARGETS.map(({ code, text }) => (
            <li key={code}>
              <span>{code}</span>
              <p>{text}</p>
              <Check aria-hidden="true" />
            </li>
          ))}
        </ul>
      </section>

      {/* ── Documentación / FAQ ──────────────────────────────────────── */}
      <section id="documentacion" className="landing-section landing-docs landing-reveal">
        <div className="landing-section-head">
          <div>
            <p className="landing-kicker">Documentación del proyecto</p>
            <h2>El modelo detrás de la experiencia.</h2>
          </div>
          <p>
            Las preguntas que más suelen aparecer sobre el alcance, los límites del modelo y el
            tratamiento de los datos.
          </p>
        </div>
        <div className="landing-faq">
          {FAQ.map(({ q, a }) => (
            <details key={q}>
              <summary>
                {q}
                <ChevronRight aria-hidden="true" />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Documentación técnica ─────────────────────────────────────── */}
      <section className="landing-section landing-notes landing-reveal">
        <div className="landing-section-head">
          <div>
            <p className="landing-kicker">Notas técnicas</p>
            <h2>Eventos, contratos y modelo.</h2>
          </div>
        </div>
        <div className="landing-notes-grid">
          <details>
            <summary>Eventos y endpoints</summary>
            <p>
              El gateway conserva los contratos de compras, energía, alimentos, simulación y gamificación.
              RabbitMQ comunica eventos como <code>purchase.registered</code>, <code>energy.reading</code>,{' '}
              <code>food.status_changed</code> y <code>bill.saved</code>.
            </p>
          </details>
          <details>
            <summary>Gamificación y factores de carbono</summary>
            <p>
              Compra +5, energía eficiente +15 o normal +3, alimento consumido +10 y desperdiciado −5.
              Tarifa eléctrica y factores de CO₂ referenciales, editables y no oficiales.
            </p>
          </details>
          <details>
            <summary>Modelo DDD y ejecución</summary>
            <p>
              Entidades y value objects contienen invariantes; servicios de aplicación persisten y publican
              eventos; adaptadores HTTP y RabbitMQ conectan el dominio. La guía completa está en el README
              del repositorio.
            </p>
          </details>
          <details>
            <summary>Ejecución local</summary>
            <p>
              <code>docker compose up --build</code> levanta la interfaz en el puerto 4000, el gateway en el
              3000 y cada microservicio con su base lógica. Con <code>npm run dev</code> el frontend puede
              trabajar por separado.
            </p>
          </details>
        </div>
      </section>

      {/* ── Equipo ───────────────────────────────────────────────────── */}
      <section className="landing-team landing-reveal">
        <div>
          <p className="landing-kicker">Equipo</p>
          <h2>Construido para aprender en conjunto.</h2>
        </div>
        <div>
          <p>
            <b>Nombre Apellido</b>
            <span>Desarrollo de producto</span>
          </p>
          <p>
            <b>Nombre Apellido</b>
            <span>Arquitectura y datos</span>
          </p>
          <p>
            <b>Nombre Apellido</b>
            <span>Investigación ODS 12</span>
          </p>
        </div>
      </section>

      <footer className="landing-footer landing-reveal">
        <div>
          <p className="landing-kicker">ODS 12 · Producción y consumo responsables</p>
          <h2>Conoce tu consumo. Elige tu siguiente paso.</h2>
        </div>
        <div className="landing-footer-end">
          <Link href="/app" className="landing-primary">
            Probar demo <ChevronRight aria-hidden="true" />
          </Link>
          <p className="landing-legal">
            Proyecto educativo. Los datos mostrados son de ejemplo y no constituyen un cálculo oficial.
          </p>
        </div>
      </footer>
    </div>
  );
}
