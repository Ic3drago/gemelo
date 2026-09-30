import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';
import { themeNoFlashScript } from '@/lib/theme';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gemelo-digital.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Gemelo Digital | Consumo Responsable del Hogar',
    template: '%s | Gemelo Digital',
  },
  description:
    'Observa, proyecta y simula el consumo doméstico de tu hogar: compras, energía, desperdicio, finanzas y huella de carbono. Alineado con el ODS 12.',
  keywords: [
    'consumo responsable',
    'ODS 12',
    'eficiencia energética',
    'huella de carbono',
    'presupuesto familiar',
    'gemelo digital',
    'sostenibilidad',
  ],
  manifest: '/manifest.json',
  applicationName: 'Gemelo Digital',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gemelo Digital',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Gemelo Digital',
    title: 'Gemelo Digital | Consumo Responsable del Hogar',
    description:
      'Registra, proyecta y simula el consumo de tu hogar con datos reales y predicciones explicables.',
    locale: 'es_BO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gemelo Digital | Consumo Responsable del Hogar',
    description:
      'Registra, proyecta y simula el consumo de tu hogar con datos reales y predicciones explicables.',
  },
  robots: { index: true, follow: true },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EDF0EC' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        {/* Applies the saved theme before first paint, avoiding the flash of
            light UI followed by a switch to dark. */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className="antialiased bg-[var(--bg)] text-[var(--text)]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
