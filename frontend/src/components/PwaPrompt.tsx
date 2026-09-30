'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export default function PwaPrompt() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [iosInstall, setIosInstall] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setIosInstall(/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if ((!promptEvent && !iosInstall) || dismissed) return null;

  return (
    <aside className="pwa-install" aria-label="Instalar aplicación">
      <div><span>Instalar aplicación</span>{iosInstall && <p className="mt-1 max-w-48 text-[11px] text-stone-500 dark:text-stone-400">En Compartir, elige “Añadir a pantalla de inicio”.</p>}</div>
      {promptEvent && <button type="button" onClick={() => promptEvent.prompt()} aria-label="Instalar aplicación"><Download size={18} /></button>}
      <button type="button" onClick={() => setDismissed(true)} aria-label="Cerrar aviso"><X size={18} /></button>
    </aside>
  );
}