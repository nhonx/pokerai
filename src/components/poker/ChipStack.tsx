'use client';

import React from 'react';

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const ChipStack: React.FC<ChipStackProps> = ({ amount, size = 'md', className = '' }) => {
  if (amount <= 0) return null;

  // Determine chip style based on value
  const getChipColor = (val: number) => {
    if (val >= 500) return 'from-amber-400 via-amber-500 to-amber-600 border-amber-300 text-slate-950';
    if (val >= 100) return 'from-slate-800 via-slate-900 to-black border-slate-600 text-amber-300';
    if (val >= 25) return 'from-emerald-600 via-emerald-700 to-emerald-800 border-emerald-400 text-white';
    if (val >= 5) return 'from-red-600 via-red-700 to-red-800 border-red-400 text-white';
    return 'from-blue-600 via-blue-700 to-blue-800 border-blue-400 text-white';
  };

  const chipColorClass = getChipColor(amount);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs md:text-sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${chipColorClass} border border-dashed rounded-full shadow-md font-mono font-bold tracking-tight select-none ${sizeClasses} ${className}`}
    >
      <span className="w-2.5 h-2.5 rounded-full border border-current opacity-70 inline-block" />
      <span>${amount.toLocaleString()}</span>
    </div>
  );
};
