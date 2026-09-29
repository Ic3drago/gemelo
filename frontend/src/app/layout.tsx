import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Gemelo Digital | Consumo Responsable',
  description: 'Optimiza el consumo de tu hogar con datos reales y predicciones inteligentes.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gemelo Digital',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased bg-[var(--bg)] text-[var(--text)]">
        <div className="flex min-h-screen min-h-dvh">
          <Navigation />
          <main
            id="main-content"
            className="flex-1 md:ml-[240px] px-4 py-6 md:px-8 md:py-8 pb-28 md:pb-8 max-w-5xl w-full transition-all"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
