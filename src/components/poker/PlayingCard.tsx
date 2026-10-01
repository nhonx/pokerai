'use client';

import React from 'react';
import { Card } from '@/lib/poker/types';
import { isRedSuit } from '@/lib/poker/deck';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  isWinning?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  isWinning = false,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-14 text-xs rounded-md',
    md: 'w-14 h-20 text-sm rounded-lg',
    lg: 'w-20 h-28 text-base rounded-xl',
  };

  if (faceDown || !card) {
    return (
      <div
        className={`relative ${sizeClasses[size]} bg-gradient-to-br from-blue-900 via-indigo-950 to-blue-950 border-2 border-amber-400/40 shadow-xl overflow-hidden flex items-center justify-center select-none transform transition-transform hover:-translate-y-0.5 ${className}`}
      >
        {/* Intricate card back casino pattern */}
        <div className="absolute inset-1 border border-amber-300/30 rounded-sm opacity-60 flex items-center justify-center bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:6px_6px]">
          <div className="w-5 h-5 rounded-full border border-amber-400/50 flex items-center justify-center text-[10px] font-serif text-amber-300 font-bold">
            ♠
          </div>
        </div>
      </div>
    );
  }

  const red = isRedSuit(card.suit);
  const colorClass = red ? 'text-red-600' : 'text-slate-900';

  return (
    <div
      className={`relative ${sizeClasses[size]} bg-white border ${
        isWinning
          ? 'border-amber-400 ring-4 ring-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.8)] scale-105 z-10'
          : 'border-slate-300/80 shadow-lg'
      } p-1 flex flex-col justify-between select-none font-bold transform transition-all duration-300 ${className}`}
    >
      {/* Top Left */}
      <div className={`flex flex-col items-center leading-none ${colorClass}`}>
        <span className="font-mono tracking-tighter">{card.rank}</span>
        <span className="text-[1.1em]">{card.suit}</span>
      </div>

      {/* Center Centerpiece */}
      <div className={`self-center text-xl md:text-2xl leading-none ${colorClass} opacity-85`}>
        {card.suit}
      </div>

      {/* Bottom Right (Inverted) */}
      <div className={`flex flex-col items-center leading-none rotate-180 ${colorClass}`}>
        <span className="font-mono tracking-tighter">{card.rank}</span>
        <span className="text-[1.1em]">{card.suit}</span>
      </div>
    </div>
  );
};
