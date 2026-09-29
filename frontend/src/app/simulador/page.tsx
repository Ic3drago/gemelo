'use client';

import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { api } from '@/lib/api';

export default function SimuladorPage() {
  const [wasteReduction, setWasteReduction] = useState(20);
  const [energyReduction, setEnergyReduction] = useState(10);
  const [purchaseChange, setPurchaseChange] = useState(-5);
  const [horizon, setHorizon] = useState<3 | 6 | 12>(6);
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const response = await api.simulate({
        householdId: 'hogar_001',
        horizonMonths: horizon,
        wasteReductionPct: wasteReduction,
        energyReductionPct: energyReduction,
        purchaseChangePct: Math.abs(purchaseChange)
      });
      
      const chartData = response.baseline.months.map((m: string, i: number) => ({
        name: m,
        baseline: response.baseline.co2Kg[i],
        scenario: response.scenario.co2Kg[i]
      }));

      setResults({
        co2Saved: response.impact.totalCo2SavedKg,
        moneySaved: response.impact.totalBsSaved,
        wasteSaved: response.impact.wasteReductionKg,
        energySaved: response.impact.energySavedKWh,
        chartData
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center md:text-left mb-8">
        <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-2">🔮 Simulador: ¿Qué pasaría si...?</h2>
        <p className="text-dark-400">Ajusta tus hábitos y descubre el impacto proyectado en tu hogar y el planeta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-medium text-white mb-6">Parámetros</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-dark-300 flex items-center"><span className="mr-2 text-lg">🗑️</span> Reducción Desperdicio</label>
                  <span className="text-eco-400 font-bold">{wasteReduction}%</span>
                </div>
                <input type="range" min="0" max="50" value={wasteReduction} onChange={(e) => setWasteReduction(Number(e.target.value))} className="w-full" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-dark-300 flex items-center"><span className="mr-2 text-lg">⚡</span> Reducción Energía</label>
                  <span className="text-blue-400 font-bold">{energyReduction}%</span>
                </div>
                <input type="range" min="0" max="50" value={energyReduction} onChange={(e) => setEnergyReduction(Number(e.target.value))} className="w-full" />
                <style jsx>{`input[type='range']::-webkit-slider-thumb { background: linear-gradient(135deg, #60a5fa, #3b82f6); box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }`}</style>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-dark-300 flex items-center"><span className="mr-2 text-lg">🛒</span> Cambio en Compras</label>
                  <span className="text-amber-400 font-bold">{purchaseChange > 0 ? '+' : ''}{purchaseChange}%</span>
                </div>
                <input type="range" min="-30" max="10" value={purchaseChange} onChange={(e) => setPurchaseChange(Number(e.target.value))} className="w-full" />
              </div>
            </div>

            <div className="mt-8">
              <label className="text-sm text-dark-300 mb-3 block">Horizonte de tiempo</label>
              <div className="flex bg-dark-900/50 p-1 rounded-xl border border-dark-700/50">
                {[3, 6, 12].map((m) => (
                  <button key={m}
                    onClick={() => setHorizon(m as any)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${horizon === m ? 'bg-dark-700 text-white shadow-md' : 'text-dark-400 hover:text-white'}`}
                  >
                    {m} meses
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transform transition hover:-translate-y-0.5 flex justify-center items-center h-12"
            >
              {isSimulating ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Simular Impacto'
              )}
            </button>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2">
          {!results ? (
            <div className="glass-card h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed border-2 border-dark-700/50 bg-dark-800/20">
              <div className="text-6xl mb-4 opacity-50 pulse-glow">🔮</div>
              <h3 className="text-xl text-dark-300 font-medium">Ajusta los parámetros y presiona Simular</h3>
              <p className="text-dark-500 mt-2 max-w-sm">Descubre cómo pequeños cambios hoy impactan en tu huella de carbono y tu bolsillo a futuro.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-[count-up_0.5s_ease-out]">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 flex items-center bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-eco-500">
                  <div className="text-3xl mr-4">🌿</div>
                  <div>
                    <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">CO₂ Evitado</p>
                    <p className="text-2xl font-bold text-white">{results.co2Saved} <span className="text-sm font-normal text-dark-300">kg</span></p>
                  </div>
                </div>
                <div className="glass-card p-4 flex items-center bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-amber-500">
                  <div className="text-3xl mr-4">💰</div>
                  <div>
                    <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Ahorro Estimado</p>
                    <p className="text-2xl font-bold text-white">{results.moneySaved} <span className="text-sm font-normal text-dark-300">Bs</span></p>
                  </div>
                </div>
                <div className="glass-card p-4 flex items-center bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-purple-500">
                  <div className="text-3xl mr-4">♻️</div>
                  <div>
                    <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Desperdicio Evitado</p>
                    <p className="text-2xl font-bold text-white">{results.wasteSaved} <span className="text-sm font-normal text-dark-300">kg</span></p>
                  </div>
                </div>
                <div className="glass-card p-4 flex items-center bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-blue-500">
                  <div className="text-3xl mr-4">⚡</div>
                  <div>
                    <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Energía Ahorrada</p>
                    <p className="text-2xl font-bold text-white">{results.energySaved} <span className="text-sm font-normal text-dark-300">kWh</span></p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-medium text-white mb-6">Proyección de Emisiones de CO₂</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScenario" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '0.75rem', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="baseline" name="Actual (Sin cambios)" stroke="#64748b" strokeWidth={2} fillOpacity={0} />
                      <Area type="monotone" dataKey="scenario" name="Con cambios" stroke="#34d399" strokeWidth={3} fill="url(#colorScenario)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
