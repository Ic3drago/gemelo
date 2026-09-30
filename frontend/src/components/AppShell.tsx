'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import PwaPrompt from '@/components/PwaPrompt';
import GuidedTour from '@/components/GuidedTour';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import { useState } from 'react';
import { CircleHelp } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const isApp = pathname.startsWith('/app');
  const [restartTour, setRestartTour] = useState(0);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  return (
    <div className={['app-shell', isApp ? 'app-shell-device' : '', isLanding ? 'app-shell-landing' : ''].join(' ')}>
      {!isLanding && <Navigation />}
      <main id="main-content" className={['app-main', isLanding ? 'app-main-landing' : '', isApp ? 'app-main-device' : ''].join(' ')}>
        {isApp && <div className="app-shortcuts"><Link href="/app/presupuesto">Presupuesto</Link><Link href="/app/guia">Guía</Link><Link href="/app/escaneo">Escanear factura</Link><Link href={`/app/guia?screen=${encodeURIComponent(pathname)}`} aria-label="Ayuda para esta pantalla" title="Ayuda para esta pantalla"><CircleHelp size={16} /> Ayuda</Link><button type="button" onClick={() => { window.localStorage.removeItem('gemelo-guided-tour-complete'); setRestartTour((value) => value + 1); }}>Paseo guiado</button><ThemeToggle iconOnly className="!min-h-[36px] !h-9 !w-9" /></div>}
        {children}
      </main>
      <PwaPrompt />
      {isApp && <GuidedTour key={restartTour} />}
    </div>
  );
}