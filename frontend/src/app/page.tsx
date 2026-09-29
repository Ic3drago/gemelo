'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetch for finances
    setTimeout(() => {
      setData({
        status: 'amber', // 'green', 'amber', 'red'
        remainingBudget: 1250.50,
        totalBudget: 4000,
        nextAction: 'Registrar tu última compra de supermercado para actualizar tus metas.',
        quickStats: {
          savings: 450,
          spent: 2749.50
        }
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-green-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'amber': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'green': return '¡Excelente!';
      case 'amber': return '¡Cuidado!';
      case 'red': return '¡Alerta!';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center pt-8 pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">¿Cómo va tu mes?</h1>
        <p className="text-gray-500">Un resumen rápido de tus finanzas</p>
      </div>

      <div className="clean-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className={`w-24 h-24 rounded-full ${getStatusColor(data.status)} shadow-lg flex items-center justify-center mb-4 text-white text-2xl font-bold`}>
          {getStatusText(data.status)}
        </div>
        
        <h2 className="text-4xl font-bold text-gray-800 mb-1">
          Bs {data.remainingBudget.toFixed(2)}
        </h2>
        <p className="text-gray-500 mb-6">Presupuesto restante</p>

        <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full ${getStatusColor(data.status)}`}
            style={{ width: `${(data.spent / data.totalBudget) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between w-full text-sm text-gray-500">
          <span>Gastado: Bs {data.quickStats.spent}</span>
          <span>Meta: Bs {data.totalBudget}</span>
        </div>
      </div>

      <div className="clean-card p-5 bg-blue-50 border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
          <span className="mr-2">💡</span> Recomendación
        </h3>
        <p className="text-blue-700 text-sm">
          {data.nextAction}
        </p>
        <button 
          onClick={() => router.push('/escanear')}
          className="mt-4 w-full bg-white text-blue-600 border border-blue-200 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
        >
          Acción Rápida
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="clean-card p-4 text-center">
          <span className="block text-2xl mb-1">💰</span>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ahorro</p>
          <p className="font-bold text-green-600">Bs {data.quickStats.savings}</p>
        </div>
        <div className="clean-card p-4 text-center cursor-pointer hover:bg-gray-50 transition" onClick={() => router.push('/presupuesto')}>
          <span className="block text-2xl mb-1">📊</span>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Detalles</p>
          <p className="font-bold text-gray-700">Ver más</p>
        </div>
      </div>
    </div>
  );
}
