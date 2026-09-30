'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Trophy, Plus, Zap } from 'lucide-react';
import { Logo } from '@/design-system/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { name: 'Inicio', href: '/app', icon: Home },
  { name: 'Registrar', href: '/app/registrar', icon: Plus },
  { name: 'Luz', href: '/app/luz', icon: Zap },
  { name: 'Futuro', href: '/app/futuro', icon: TrendingUp },
  { name: 'Logros', href: '/app/logros', icon: Trophy },
];

export default function Navigation() {
  const pathname = usePathname();
  const isApp = pathname.startsWith('/app');

  if (pathname.startsWith('/onboarding')) return null;

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className={isApp ? 'hidden' : 'hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[240px] bg-white dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 z-40'}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-stone-100 dark:border-stone-800">
          <Logo size={28} showName />
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
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
          <ThemeToggle iconOnly className="w-full mb-2" />
          <Link
              href="/app/registrar"
            className="flex items-center justify-center gap-2 w-full h-11 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" />
            Registrar
          </Link>
        </div>
      </aside>

      {/* ── Mobile Bottom Bar ── */}
      <nav
        className={['fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800', isApp ? 'md:flex md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[436px] md:rounded-t-xl' : 'md:hidden'].join(' ')}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-end h-16 px-1 w-full">
          {navItems.slice(0, 2).map(({ name, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                data-tour={name === 'Registrar' ? 'tour-nav-registrar' : undefined}
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

          {navItems.slice(2, 5).map(({ name, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                data-tour={name === 'Registrar' ? 'tour-nav-registrar' : name === 'Luz' ? 'tour-nav-luz' : name === 'Futuro' ? 'tour-nav-futuro' : name === 'Logros' ? 'tour-nav-logros' : undefined}
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
