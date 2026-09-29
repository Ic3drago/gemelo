'use client';

import React, { useState, useEffect } from 'react';

export default function Presupuesto() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Mock budget data
    setTimeout(() => {
      setData({
        income: 5000,
        rules: {
          needs: { target: 2500, spent: 2100, color: 'bg-blue-500' },     // 50%
          wants: { target: 1500, spent: 1600, color: 'bg-amber-500' },    // 30%
          savings: { target: 1000, spent: 450, color: 'bg-green-500' },   // 20%
        },
        goals: [
          { name: 'Fondo de Emergencia', target: 5000, current: 1500 },
          { name: 'Vacaciones', target: 3000, current: 600 }
        ]
      });
    }, 500);
  }, []);

  if (!data) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando presupuesto...</div>;
  }

  const calculatePercentage = (spent: number, target: number) => {
    return Math.min(100, Math.round((spent / target) * 100));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mi Presupuesto</h1>
        <p className="text-gray-500">Regla 50/30/20 y Metas de Ahorro</p>
      </div>

      <div className="clean-card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="text-xl mr-2">⚖️</span> Distribución 50/30/20
        </h2>
        
        <div className="space-y-6">
          {/* 50% Needs */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Necesidades (50%)</span>
              <span className="text-gray-500">Bs {data.rules.needs.spent} / Bs {data.rules.needs.target}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${data.rules.needs.color} transition-all duration-1000`}
                style={{ width: `${calculatePercentage(data.rules.needs.spent, data.rules.needs.target)}%` }}
              ></div>
            </div>
            {data.rules.needs.spent > data.rules.needs.target && (
              <p className="text-xs text-red-500 mt-1">¡Has superado el límite sugerido!</p>
            )}
          </div>

          {/* 30% Wants */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Deseos (30%)</span>
              <span className="text-gray-500">Bs {data.rules.wants.spent} / Bs {data.rules.wants.target}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${data.rules.wants.color} transition-all duration-1000`}
                style={{ width: `${calculatePercentage(data.rules.wants.spent, data.rules.wants.target)}%` }}
              ></div>
            </div>
            {data.rules.wants.spent > data.rules.wants.target && (
              <p className="text-xs text-red-500 mt-1">¡Has superado el límite sugerido!</p>
            )}
          </div>

          {/* 20% Savings */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Ahorro e Inversión (20%)</span>
              <span className="text-gray-500">Bs {data.rules.savings.spent} / Bs {data.rules.savings.target}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${data.rules.savings.color} transition-all duration-1000`}
                style={{ width: `${calculatePercentage(data.rules.savings.spent, data.rules.savings.target)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="clean-card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="text-xl mr-2">🎯</span> Mis Metas de Ahorro
        </h2>
        
        <div className="space-y-4">
          {data.goals.map((goal: any, idx: number) => (
            <div key={idx} className="border border-gray-100 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-800">{goal.name}</h3>
                <span className="text-green-600 font-bold">{calculatePercentage(goal.current, goal.target)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div 
                  className="h-2 rounded-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${calculatePercentage(goal.current, goal.target)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-right">Bs {goal.current} de Bs {goal.target}</p>
            </div>
          ))}
          
          <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-green-600 hover:border-green-400 transition font-medium">
            + Crear Nueva Meta
          </button>
        </div>
      </div>
    </div>
  );
}
