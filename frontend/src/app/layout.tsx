import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Gemelo Digital | Consumo Responsable',
  description: 'Sistema de gemelo digital para optimizar el consumo del hogar hacia el ODS 12.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="bg-[#faf9f6] text-gray-800 antialiased">
        <div className="flex min-h-screen">
          <Navigation />
          <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 max-w-7xl mx-auto w-full transition-all">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
