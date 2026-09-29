'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide navigation on onboarding
  if (pathname.startsWith('/onboarding')) {
    return null;
  }

  const navItems = [
    { name: 'Inicio', href: '/', icon: '🌿' },
    { name: 'Predicciones', href: '/predicciones', icon: '🔮' },
    { name: 'Presupuesto', href: '/presupuesto', icon: '💰' },
    { name: 'Logros', href: '/logros', icon: '🏆' },
  ];

  return (
    <>
      {/* Desktop Sidebar (hidden by default in mobile-first, but kept for large screens) */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 clean-card !border-y-0 !border-l-0 !rounded-none z-50 bg-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-green-700 mb-1">🌿 Gemelo Digital</h1>
        </div>
        <nav className="flex-1 px-4 mt-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-green-50 text-green-700 font-semibold' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
                    }`}
                  >
                    <span className="mr-3 text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
            <li className="pt-4">
              <button 
                onClick={() => router.push('/escanear')}
                className="w-full flex justify-center items-center gap-2 bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition"
              >
                <span>+</span>
                <span>Registrar</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="relative flex justify-around items-end h-16 px-2 pb-2">
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-16">
                <span className={`text-2xl mb-1 ${isActive ? 'scale-110' : 'opacity-70'} transition-transform`}>{item.icon}</span>
                <span className={`text-[10px] font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>{item.name}</span>
              </Link>
            );
          })}
          
          {/* FAB - Central Button */}
          <div className="relative -top-5 flex flex-col items-center justify-center w-16">
            <button 
              onClick={() => router.push('/escanear')}
              className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg hover:bg-green-700 hover:scale-105 transition-all"
            >
              +
            </button>
            <span className="text-[10px] font-medium text-gray-500 mt-1">Registrar</span>
          </div>

          {navItems.slice(2, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-16">
                <span className={`text-2xl mb-1 ${isActive ? 'scale-110' : 'opacity-70'} transition-transform`}>{item.icon}</span>
                <span className={`text-[10px] font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
