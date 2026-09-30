'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, TrendingUp, Wallet, Trophy, BookOpen, Plus } from 'lucide-react';
import { Logo } from '@/design-system/Logo';

const navItems = [
  { name: 'Inicio',        href: '/',           icon: Home },
  { name: 'Predicciones',  href: '/simulador',  icon: TrendingUp },
  { name: 'Presupuesto',   href: '/presupuesto', icon: Wallet },
  { name: 'Logros',        href: '/logros',     icon: Trophy },
  { name: 'Guia',          href: '/guia',       icon: BookOpen },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith('/onboarding')) return null;

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[240px] bg-white dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-stone-100 dark:border-stone-800">
          <Logo size={28} showName />
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ name, href, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-forest-50 text-forest-700 dark:bg-forest-950 dark:text-forest-300'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {name}
              </Link>
            );
          })}
        </nav>

        {/* Register CTA */}
        <div className="px-3 pb-5 pt-2 border-t border-stone-100 dark:border-stone-800">
          <Link
            href="/registro"
            className="flex items-center justify-center gap-2 w-full h-11 bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" />
            Registrar
          </Link>
        </div>
      </aside>

      {/* ── Mobile Bottom Bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-end h-16 px-1">
          {/* First 2 items */}
          {navItems.slice(0, 2).map(({ name, href, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5"
              >
                <Icon
                  className={['h-5 w-5', active ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400'].join(' ')}
                />
                <span className={['text-[10px] font-medium', active ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400'].join(' ')}>
                  {name}
                </span>
              </Link>
            );
          })}

          {/* FAB — center */}
          <div className="flex flex-col items-center justify-end flex-1 pb-1 relative">
            <button
              onClick={() => router.push('/registro')}
              className="w-14 h-14 -mt-6 bg-forest-600 hover:bg-forest-700 active:bg-forest-800 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              aria-label="Registrar"
            >
              <Plus className="h-6 w-6" />
            </button>
            <span className="text-[10px] font-medium text-stone-400 mt-0.5">Registrar</span>
          </div>

          {/* Last 2 items */}
          {navItems.slice(2, 5).map(({ name, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5"
              >
                <Icon
                  className={['h-5 w-5', active ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400'].join(' ')}
                />
                <span className={['text-[10px] font-medium', active ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400'].join(' ')}>
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
