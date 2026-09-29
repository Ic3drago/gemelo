'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function LogrosPage() {
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profData, achData, histData] = await Promise.all([
          api.getProfile('hogar_001'),
          api.getAchievements('hogar_001'),
          api.getPointsHistory('hogar_001')
        ]);
        
        // Add defaults just in case mapping needs to be safe
        setProfile({
          name: profData?.name || 'Hogar Cochabamba',
          points: profData?.points || 0,
          level: profData?.level || 1,
          levelName: profData?.levelName || 'Iniciador',
          progress: profData?.progress || 0
        });
        
        setAchievements(achData || []);
        
        // Map history to match UI
        const mappedHistory = (histData || []).map((h: any, i: number) => ({
          id: h.id || i,
          action: h.description || h.action,
          points: h.points > 0 ? `+${h.points}` : `${h.points}`,
          time: new Date(h.timestamp || Date.now()).toLocaleDateString(),
          type: h.points > 0 ? 'positive' : 'negative'
        }));
        
        setHistory(mappedHistory);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-eco-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getLevelColor = (level: number) => {
    switch(level) {
      case 1: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      case 2: return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 3: return 'text-eco-400 bg-eco-400/10 border-eco-400/30';
      case 4: return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center md:text-left mb-8">
        <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-2">🏆 Mis Logros</h2>
        <p className="text-dark-400">Tu impacto positivo se recompensa. ¡Sigue así!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="glass-card p-8 lg:col-span-2 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-eco-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between relative z-10 gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-bold text-white mb-1">{profile.name}</h3>
              <div className={`inline-block px-3 py-1 rounded-full border text-sm font-semibold mb-4 ${getLevelColor(profile.level)}`}>
                Nivel {profile.level}: {profile.levelName}
              </div>
            </div>
            
            <div className="text-center bg-dark-900/50 p-4 rounded-2xl border border-dark-700/50 min-w-[150px] shadow-inner">
              <p className="text-sm text-dark-400 uppercase tracking-wider mb-1">Puntos Totales</p>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-eco-400 glow-text animate-stat">
                {profile.points.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-8 relative z-10">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span className="text-dark-300">Progreso al Nivel {profile.level + 1}</span>
              <span className="text-eco-400">{profile.progress}%</span>
            </div>
            <div className="h-3 w-full bg-dark-800 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-eco-600 to-eco-400 animate-fill relative"
                style={{ width: `${profile.progress}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjUwIi8+PC9nPjwvc3ZnPg==')]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Challenge */}
        <div className="glass-card p-6 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-4 -right-4 text-6xl opacity-10 transform rotate-12">🎯</div>
          <div>
            <div className="flex items-center text-amber-400 text-sm font-bold tracking-wider mb-3">
              <span className="mr-2">🔥</span> RETO SEMANAL
            </div>
            <h4 className="text-white font-bold text-lg leading-tight mb-2">Semana Veggie</h4>
            <p className="text-dark-400 text-sm mb-6">Registra 3 comidas sin carne esta semana para ganar 200 pts extra.</p>
          </div>
          
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-white">2 / 3 comidas</span>
              <span className="text-amber-400">2 días rest.</span>
            </div>
            <div className="h-2 w-full bg-dark-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: '66%' }}></div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Achievements Grid */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-medium text-white mb-6">Medallas de Sostenibilidad</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map(ach => (
              <div key={ach.id} className={`flex flex-col items-center text-center p-4 rounded-2xl transition-all duration-300 relative group
                ${ach.unlocked ? 'bg-dark-800/80 border border-eco-500/30 hover:border-eco-500 hover:shadow-[0_0_15px_rgba(52,211,153,0.15)] hover:-translate-y-1' : 'bg-dark-900/40 border border-dark-800 grayscale opacity-60'}
              `}>
                {ach.unlocked && <div className="absolute top-2 right-2 text-eco-400 text-xs bg-eco-500/10 p-1 rounded-full">✓</div>}
                {!ach.unlocked && <div className="absolute top-2 right-2 text-dark-500 text-xs">🔒</div>}
                
                <div className={`text-4xl mb-3 ${ach.unlocked ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : ''}`}>
                  {ach.icon}
                </div>
                <h4 className={`text-sm font-bold mb-1 ${ach.unlocked ? 'text-white' : 'text-dark-300'}`}>{ach.name}</h4>
                <p className="text-[11px] text-dark-400 leading-tight">{ach.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-white mb-6">Historial de Puntos</h3>
          <div className="space-y-4">
            {history.map(item => (
              <div key={item.id} className="flex justify-between items-start pb-4 border-b border-dark-800 last:border-0 last:pb-0">
                <div className="pr-4">
                  <p className="text-sm text-white font-medium mb-1">{item.action}</p>
                  <p className="text-xs text-dark-500">{item.time}</p>
                </div>
                <div className={`text-sm font-bold whitespace-nowrap px-2 py-1 rounded-lg ${item.type === 'positive' ? 'text-eco-400 bg-eco-500/10' : 'text-red-400 bg-red-500/10'}`}>
                  {item.points}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
