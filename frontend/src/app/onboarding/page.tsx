'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    size: 1,
    income: '',
    expenses: '',
    goal: 'ahorro',
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const completeOnboarding = () => {
    // Save to localStorage or API here
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center pt-10 px-4">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`h-2 flex-1 mx-1 rounded-full ${step >= i ? 'bg-green-500' : 'bg-gray-200'}`} 
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">Paso {step} de 4</p>
        </div>

        <div className="clean-card p-6 bg-white shadow-sm">
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Bienvenido! 👋</h2>
              <p className="text-gray-600 mb-6">Para empezar, cuéntanos un poco sobre ti.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del hogar o usuario</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Ej. Familia Pérez"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuántas personas viven contigo?</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.size}
                    onChange={e => setFormData({...formData, size: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Tus Finanzas 💰</h2>
              <p className="text-gray-600 mb-6">Calcularemos un presupuesto inicial para ti.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ingreso mensual estimado (Bs)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="0.00"
                    value={formData.income}
                    onChange={e => setFormData({...formData, income: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gastos fijos estimados (Bs)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Alquiler, servicios..."
                    value={formData.expenses}
                    onChange={e => setFormData({...formData, expenses: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">¿Cuál es tu objetivo? 🎯</h2>
              <p className="text-gray-600 mb-6">Selecciona lo que más te importa en este momento.</p>
              
              <div className="space-y-3">
                {[
                  { id: 'ahorro', title: 'Ahorrar dinero', desc: 'Reducir gastos innecesarios' },
                  { id: 'deudas', title: 'Pagar deudas', desc: 'Salir de deudas más rápido' },
                  { id: 'eco', title: 'Ser más ecológico', desc: 'Reducir desperdicios y consumo' }
                ].map(g => (
                  <div 
                    key={g.id}
                    className={`p-4 border rounded-xl cursor-pointer transition ${formData.goal === g.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                    onClick={() => setFormData({...formData, goal: g.id})}
                  >
                    <h3 className="font-semibold text-gray-800">{g.title}</h3>
                    <p className="text-sm text-gray-500">{g.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                📸
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Todo listo!</h2>
              <p className="text-gray-600 mb-6">Para empezar a ayudarte, te recomendamos registrar tu primera compra escaneando un recibo.</p>
              
              <button 
                onClick={() => router.push('/escanear')}
                className="w-full bg-blue-50 text-blue-600 border border-blue-200 p-3 rounded-xl font-medium hover:bg-blue-100 transition mb-3"
              >
                Escanear mi primer recibo
              </button>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="px-4 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Atrás
              </button>
            )}
            
            {step < 4 ? (
              <button 
                onClick={nextStep}
                className="flex-1 bg-green-600 text-white p-3 rounded-xl font-medium hover:bg-green-700 transition"
              >
                Continuar
              </button>
            ) : (
              <button 
                onClick={completeOnboarding}
                className="flex-1 bg-green-600 text-white p-3 rounded-xl font-medium hover:bg-green-700 transition"
              >
                Ir al Inicio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
