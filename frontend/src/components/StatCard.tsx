'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: string;
  trend?: number;
  trendLabel?: string;
}

export default function StatCard({ title, value, unit, icon, trend, trendLabel }: StatCardProps) {
  return (
    <div className="glass-card p-6 flex flex-col justify-between h-full group hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-dark-800/80 border border-dark-700/50 flex items-center justify-center text-2xl group-hover:bg-eco-500/10 group-hover:border-eco-500/30 transition-colors shadow-inner">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-eco-500/20 text-eco-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-dark-400 text-sm font-medium mb-1">{title}</h3>
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-bold text-white tracking-tight animate-stat">{value}</span>
          <span className="text-dark-400 text-sm">{unit}</span>
        </div>
        {trendLabel && (
          <p className="text-xs text-dark-500 mt-2">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}
