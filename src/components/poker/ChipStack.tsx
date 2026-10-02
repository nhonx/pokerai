'use client';

import React from 'react';

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const ChipStack: React.FC<ChipStackProps> = ({ amount, size = 'md', className = '' }) => {
  if (amount <= 0) return null;

  // Authentic casino chip theme colors with 3D edge stripes
  const getChipStyle = (val: number) => {
    if (val >= 500) {
      return {
        bg: 'from-amber-400 via-amber-500 to-yellow-600 border-amber-300 text-stone-950',
        dot: 'bg-stone-900 border-amber-200',
      };
    }
    if (val >= 100) {
      return {
        bg: 'from-stone-800 via-stone-900 to-black border-stone-500 text-amber-300',
        dot: 'bg-amber-400 border-stone-400',
      };
    }
    if (val >= 25) {
      return {
        bg: 'from-emerald-600 via-emerald-700 to-emerald-900 border-emerald-400 text-white',
        dot: 'bg-emerald-300 border-white',
      };
    }
    if (val >= 5) {
      return {
        bg: 'from-red-600 via-red-700 to-red-900 border-red-400 text-white',
        dot: 'bg-red-300 border-white',
      };
    }
    return {
      bg: 'from-blue-600 via-blue-700 to-blue-900 border-blue-400 text-white',
      dot: 'bg-blue-300 border-white',
    };
  };

  const style = getChipStyle(amount);
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] sm:text-xs'
      : 'px-2.5 py-1 text-xs sm:text-sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-gradient-to-b ${style.bg} border-2 rounded-full shadow-[0_3px_6px_rgba(0,0,0,0.6)] font-mono font-black tracking-tight select-none transform transition-transform hover:scale-105 ${sizeClasses} ${className}`}
    >
      {/* 3D Chip center inlay */}
      <span
        className={`w-2.5 h-2.5 rounded-full border ${style.dot} inline-block shadow-inner`}
      />
      <span>${amount.toLocaleString()}</span>
    </div>
  );
};
