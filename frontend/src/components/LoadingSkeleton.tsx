'use client';

import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse w-full h-full min-h-[120px]">
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-dark-700 h-12 w-12"></div>
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-dark-700 rounded w-3/4"></div>
          <div className="h-6 bg-dark-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}
