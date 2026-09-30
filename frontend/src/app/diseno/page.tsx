'use client';

import React, { useState } from 'react';
import { Button } from '@/design-system/Button';
import { Card } from '@/design-system/Card';
import { Badge } from '@/design-system/Badge';
import { Stat } from '@/design-system/Stat';
import { Skeleton, SkeletonCard, SkeletonList } from '@/design-system/Skeleton';
import { EmptyState } from '@/design-system/EmptyState';
import { Toast } from '@/design-system/Toast';
import { BottomSheet } from '@/design-system/BottomSheet';
import { Logo } from '@/design-system/Logo';
import { Leaf, Zap, ShoppingCart, Star, Plus, Inbox } from 'lucide-react';

const PALETTE = [
  { name: 'forest', shades: ['50','100','200','300','400','500','600','700','800','900','950'], prefix: 'bg-forest-' },
  { name: 'leaf',   shades: ['50','100','200','300','400','500','600','700','800','900'],       prefix: 'bg-leaf-' },
  { name: 'amber',  shades: ['50','100','200','300','400','500','600','700','800','900'],       prefix: 'bg-amber-' },
  { name: 'rose',   shades: ['50','100','200','300','400','500','600','700','800'],             prefix: 'bg-rose-' },
  { name: 'sky',    shades: ['50','100','200','300','400','500','600','700','800'],             prefix: 'bg-sky-' },
  { name: 'stone',  shades: ['50','100','200','300','400','500','600','700','800','900','950'], prefix: 'bg-stone-' },
];

const TYPE_SCALE = [
  { label: 'Display', class: 'text-5xl font-bold', sample: 'Gemelo Digital' },
  { label: 'H1',      class: 'text-3xl font-bold', sample: 'Titulo principal' },
  { label: 'H2',      class: 'text-2xl font-semibold', sample: 'Subtitulo' },
  { label: 'H3',      class: 'text-xl font-semibold',  sample: 'Seccion' },
  { label: 'H4',      class: 'text-lg font-medium',    sample: 'Encabezado tarjeta' },
  { label: 'Body',    class: 'text-base',               sample: 'Texto de parrafo normal. Los datos se procesan localmente.' },
  { label: 'Small',   class: 'text-sm',                 sample: 'Texto pequeno para metadatos y etiquetas secundarias.' },
  { label: 'XS',      class: 'text-xs',                 sample: 'Texto extra pequeno: fechas, badges, captions.' },
];

export default function DisenoPage() {
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState(false);

  return (
    <div className="space-y-12 max-w-4xl pb-24 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Sistema de Diseno</h1>
        <p className="text-stone-500 mt-1 text-sm dark:text-stone-400">Componentes y tokens visuales del Gemelo Digital</p>
      </div>

      {/* ── Logo ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Logo</h2>
        <div className="flex flex-wrap gap-6 items-center p-6 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <Logo size={24} showName />
          <Logo size={32} showName />
          <Logo size={40} showName />
          <Logo size={48} showName={false} />
          <Logo size={64} showName={false} />
        </div>
      </section>

      {/* ── Color palette ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Paleta de colores</h2>
        <div className="space-y-4">
          {PALETTE.map((color) => (
            <div key={color.name}>
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2 capitalize">{color.name}</p>
              <div className="flex flex-wrap gap-1">
                {color.shades.map((shade) => (
                  <div key={shade} className="group flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-lg ${color.prefix}${shade} border border-stone-200/50`} />
                    <span className="text-[10px] text-stone-400 mt-1 dark:text-stone-500">{shade}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Typography ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Tipografia</h2>
        <Card variant="flat" padding={false}>
          {TYPE_SCALE.map(({ label, class: cls, sample }, i) => (
            <div key={label} className={['flex items-baseline gap-4 px-5 py-4', i > 0 ? 'border-t border-stone-100 dark:border-stone-800' : ''].join(' ')}>
              <span className="text-xs text-stone-400 w-16 shrink-0 dark:text-stone-500">{label}</span>
              <span className={['text-stone-900 dark:text-stone-50', cls].join(' ')}>{sample}</span>
            </div>
          ))}
        </Card>
      </section>

      {/* ── Buttons ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Botones</h2>
        <Card variant="flat">
          <div className="flex flex-wrap gap-3 mb-6">
            <Button variant="primary" icon={<Plus className="h-4 w-4" />}>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <div className="flex flex-wrap gap-3 mb-6">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" loading>Cargando</Button>
            <Button variant="primary" disabled>Deshabilitado</Button>
          </div>
        </Card>
      </section>

      {/* ── Cards ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Cards</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Card variant="flat">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Flat</p>
            <p className="text-xs text-stone-400 mt-1 dark:text-stone-500">Con borde sutil</p>
          </Card>
          <Card variant="elevated">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Elevated</p>
            <p className="text-xs text-stone-400 mt-1 dark:text-stone-500">Con sombra</p>
          </Card>
          <Card variant="outlined">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Outlined</p>
            <p className="text-xs text-stone-400 mt-1 dark:text-stone-500">Solo borde</p>
          </Card>
        </div>
      </section>

      {/* ── Badges ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="success">Exitoso</Badge>
          <Badge variant="warning">Advertencia</Badge>
          <Badge variant="danger">Error</Badge>
          <Badge variant="info">Informacion</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="category">Categoria</Badge>
        </div>
      </section>

      {/* ── Stats ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card variant="flat"><Stat label="Gasto mensual" value={2750} prefix="Bs" icon={<ShoppingCart className="h-5 w-5" />} /></Card>
          <Card variant="flat"><Stat label="CO2 evitado" value={12.4} unit="kg" decimals={1} icon={<Leaf className="h-5 w-5" />} /></Card>
          <Card variant="flat"><Stat label="Energia" value={145} unit="kWh" icon={<Zap className="h-5 w-5" />} /></Card>
          <Card variant="flat"><Stat label="Puntos" value={340} icon={<Star className="h-5 w-5" />} trend={12} /></Card>
        </div>
      </section>

      {/* ── Skeletons ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Skeletons</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <SkeletonCard />
          <Card variant="flat"><SkeletonList rows={3} /></Card>
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" rounded />
        </div>
      </section>

      {/* ── Empty State ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Estado vacio</h2>
        <Card variant="flat">
          <EmptyState
            icon={<Inbox className="h-8 w-8" />}
            title="Sin datos aun"
            description="Registra tu primera actividad para empezar a ver estadisticas."
            action={{ label: 'Empezar', onClick: () => {} }}
          />
        </Card>
      </section>

      {/* ── Toast ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Toast</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setToast(true)}>Mostrar toast</Button>
        </div>
        {toast && (
          <Toast
            message="Registro guardado exitosamente"
            type="success"
            onClose={() => setToast(false)}
          />
        )}
      </section>

      {/* ── Bottom Sheet ── */}
      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">Bottom Sheet</h2>
        <Button variant="secondary" onClick={() => setSheet(true)}>Abrir sheet</Button>
        <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Ejemplo de bottom sheet">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Este es el contenido del bottom sheet. Se desliza desde abajo en movil y actua como un modal centrado en desktop.
          </p>
          <div className="mt-4">
            <Button variant="primary" fullWidth onClick={() => setSheet(false)}>Cerrar</Button>
          </div>
        </BottomSheet>
      </section>
    </div>
  );
}
