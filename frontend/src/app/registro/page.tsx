'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import Toast from '@/components/Toast';

export default function RegistroPage() {
  const [activeTab, setActiveTab] = useState<'compra' | 'alimento' | 'energia'>('compra');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  // Form states
  const [compra, setCompra] = useState({ category: 'supermercado', item: '', amount: '', qty: '', unit: 'unidades' });
  const [alimento, setAlimento] = useState({ name: '', category: 'verduras', qty: '' });
  const [energia, setEnergia] = useState({ type: 'general', kwh: '' });

  const showSuccess = (points: number, msg: string) => {
    setToast({ message: msg, type: 'success' });
    setPointsEarned(points);
    setTimeout(() => setPointsEarned(null), 3000);
  };

  const handleCompraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPurchase({ householdId: 'hogar_001', ...compra, amountBs: Number(compra.amount) });
      showSuccess(5, 'Compra registrada exitosamente');
      setCompra({ category: 'supermercado', item: '', amount: '', qty: '', unit: 'unidades' });
    } catch (e) {
      setToast({ message: 'Error al registrar', type: 'error' });
    }
  };

  const handleAlimentoSubmit = async (e: React.FormEvent, action: 'store' | 'waste' | 'consume') => {
    e.preventDefault();
    try {
      // In a real app we would call different endpoints based on action
      await api.createFood({ householdId: 'hogar_001', ...alimento, qty: Number(alimento.qty) });
      const points = action === 'waste' ? 0 : action === 'consume' ? 10 : 2;
      const msg = action === 'waste' ? 'Desperdicio registrado ⚠️' : action === 'consume' ? '¡Consumo registrado! Bien hecho' : 'Alimento guardado';
      showSuccess(points, msg);
      setAlimento({ name: '', category: 'verduras', qty: '' });
    } catch (e) {
      setToast({ message: 'Error al registrar', type: 'error' });
    }
  };

  const handleEnergiaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEnergyReading({ householdId: 'hogar_001', kWh: Number(energia.kwh), deviceType: energia.type });
      showSuccess(5, 'Lectura de energía registrada');
      setEnergia({ type: 'general', kwh: '' });
    } catch (e) {
      setToast({ message: 'Error al registrar', type: 'error' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {pointsEarned !== null && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-[count-up_1s_ease-out_forwards]">
          <span className="text-4xl font-bold text-eco-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] glow-text">
            +{pointsEarned} pts
          </span>
        </div>
      )}

      <div>
        <h2 className="text-2xl md:text-3xl font-bold gradient-text">Registro Manual</h2>
        <p className="text-dark-400 mt-1">Ingresa tus datos para alimentar el gemelo digital</p>
      </div>

      {/* Tabs */}
      <div className="glass-card p-1 flex relative">
        <div 
          className="absolute h-[calc(100%-8px)] top-1 bg-dark-700/50 rounded-lg transition-all duration-300 ease-out border border-dark-600/50"
          style={{ 
            width: 'calc(33.333% - 4px)', 
            transform: `translateX(${activeTab === 'compra' ? '4px' : activeTab === 'alimento' ? 'calc(100% + 4px)' : 'calc(200% + 4px)'})` 
          }}
        />
        {[
          { id: 'compra', icon: '🛒', label: 'Compra' },
          { id: 'alimento', icon: '🗑️', label: 'Alimento' },
          { id: 'energia', icon: '⚡', label: 'Energía' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center py-3 text-sm font-medium z-10 transition-colors rounded-lg
              ${activeTab === tab.id ? 'text-white' : 'text-dark-400 hover:text-dark-200'}`}
          >
            <span className="mr-2 text-lg">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Forms Container */}
      <div className="glass-card p-6 md:p-8">
        
        {/* Compra Form */}
        {activeTab === 'compra' && (
          <form onSubmit={handleCompraSubmit} className="space-y-5 animate-[count-up_0.3s_ease-out]">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Categoría</label>
              <select 
                className="w-full bg-dark-900/50 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-eco-500 transition-colors"
                value={compra.category} onChange={e => setCompra({...compra, category: e.target.value})}
              >
                <option value="supermercado">Supermercado</option>
                <option value="mercado">Mercado tradicional</option>
                <option value="feria">Feria</option>
                <option value="servicios">Servicios</option>
                <option value="transporte">Transporte</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Artículo</label>
              <input type="text" placeholder="Ej: Arroz, Pollo, Jabón..." required
                className="w-full bg-dark-900/50 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-eco-500 transition-colors"
                value={compra.item} onChange={e => setCompra({...compra, item: e.target.value})}
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {['Arroz', 'Pollo', 'Papa', 'Cebolla'].map(s => (
                  <button type="button" key={s} onClick={() => setCompra({...compra, item: s})}
                    className="text-xs bg-dark-800 border border-dark-700 px-2 py-1 rounded hover:border-eco-500/50 text-dark-300 hover:text-white transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Monto (Bs)</label>
                <input type="number" step="0.1" placeholder="0.00" required
                  className="w-full bg-dark-900/50 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-eco-500 transition-colors"
                  value={compra.amount} onChange={e => setCompra({...compra, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Cantidad / Unidad</label>
                <div className="flex">
                  <input type="number" step="0.1" placeholder="1"
                    className="w-1/2 bg-dark-900/50 border border-dark-700 rounded-l-xl px-4 py-3 text-white focus:outline-none focus:border-eco-500 transition-colors border-r-0"
                    value={compra.qty} onChange={e => setCompra({...compra, qty: e.target.value})}
                  />
                  <select 
                    className="w-1/2 bg-dark-800 border border-dark-700 rounded-r-xl px-2 py-3 text-white focus:outline-none focus:border-eco-500 transition-colors"
                    value={compra.unit} onChange={e => setCompra({...compra, unit: e.target.value})}
                  >
                    <option value="unidades">unidades</option>
                    <option value="kg">kg</option>
                    <option value="litros">litros</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full mt-4 bg-gradient-to-r from-eco-600 to-eco-400 hover:from-eco-500 hover:to-eco-300 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-eco-500/20 transform transition hover:-translate-y-0.5">
              Registrar Compra
            </button>
          </form>
        )}

        {/* Alimento Form */}
        {activeTab === 'alimento' && (
          <form className="space-y-5 animate-[count-up_0.3s_ease-out]">
             <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Categoría</label>
              <select 
                className="w-full bg-dark-900/50 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-eco-500 transition-colors"
                value={alimento.category} onChange={e => setAlimento({...alimento, category: e.target.value})}
              >
                <option value="frutas">Frutas</option>
                <option value="verduras">Verduras</option>
                <option value="carnes">Carnes</option>
                <option value="lacteos">Lácteos</option>
                <option value="granos">Granos</option>
                <option value="preparados">Preparados</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Nombre</label>
              <input type="text" placeholder="Ej: Tomates, Manzanas..." required
                className="w-full bg-dark-900/50 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-eco-500 transition-colors"
                value={alimento.name} onChange={e => setAlimento({...alimento, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Cantidad (kg)</label>
              <input type="number" step="0.1" placeholder="0.5" required
                className="w-full bg-dark-900/50 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-eco-500 transition-colors"
                value={alimento.qty} onChange={e => setAlimento({...alimento, qty: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button onClick={(e) => handleAlimentoSubmit(e, 'store')} className="bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-medium py-3 px-4 rounded-xl transition-colors">
                📥 Guardar
              </button>
              <button onClick={(e) => handleAlimentoSubmit(e, 'consume')} className="bg-eco-600/20 hover:bg-eco-600/40 border border-eco-500/50 text-eco-400 font-medium py-3 px-4 rounded-xl transition-colors">
                ✅ Consumido
              </button>
              <button onClick={(e) => handleAlimentoSubmit(e, 'waste')} className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 font-medium py-3 px-4 rounded-xl transition-colors">
                ⚠️ Desperdicio
              </button>
            </div>
          </form>
        )}

        {/* Energía Form */}
        {activeTab === 'energia' && (
          <form onSubmit={handleEnergiaSubmit} className="space-y-5 animate-[count-up_0.3s_ease-out]">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Tipo de Lectura</label>
              <select 
                className="w-full bg-dark-900/50 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-eco-500 transition-colors"
                value={energia.type} onChange={e => setEnergia({...energia, type: e.target.value})}
              >
                <option value="general">Medidor General</option>
                <option value="cocina">Cocina</option>
                <option value="iluminacion">Iluminación</option>
                <option value="refrigerador">Refrigerador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Consumo (kWh)</label>
              <input type="number" step="0.1" placeholder="Ej: 120" required
                className="w-full bg-dark-900/50 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-eco-500 transition-colors"
                value={energia.kwh} onChange={e => setEnergia({...energia, kwh: e.target.value})}
              />
            </div>

            {energia.kwh && (
              <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-4 flex justify-between items-center">
                <span className="text-dark-300">Costo estimado:</span>
                <span className="text-xl font-bold text-amber-400">Bs {(Number(energia.kwh) * 0.89).toFixed(2)}</span>
              </div>
            )}

            <button type="submit" className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transform transition hover:-translate-y-0.5">
              Registrar Lectura
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
