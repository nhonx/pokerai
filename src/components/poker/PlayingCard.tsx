'use client';

import React from 'react';
import { Card } from '@/lib/poker/types';
import { isRedSuit } from '@/lib/poker/deck';

export interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  isWinning?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  isWinning = false,
  size = 'md',
  className = '',
}) => {
  // Proportional responsive sizes
  const sizeClasses = {
    xs: 'w-7 h-10 text-[9px] rounded',
    sm: 'w-9 h-13 sm:w-11 sm:h-16 text-[10px] sm:text-xs rounded-md sm:rounded-lg',
    md: 'w-9 h-13 sm:w-12 sm:h-17 md:w-15 md:h-21 text-[10px] sm:text-xs md:text-sm rounded-md sm:rounded-lg md:rounded-xl',
    lg: 'w-16 h-23 sm:w-20 sm:h-28 text-xs sm:text-base rounded-xl',
  };

  // Texas Saloon Card Back
  if (faceDown || !card) {
    return (
      <div
        className={`relative ${sizeClasses[size]} bg-gradient-to-br from-[#6b1414] via-[#450b0b] to-[#250404] border-2 border-amber-500/70 shadow-lg overflow-hidden flex items-center justify-center select-none transform transition-transform hover:-translate-y-0.5 ${className}`}
      >
        {/* Ornamental Western Filigree Border */}
        <div className="absolute inset-1 border border-amber-400/40 rounded-sm flex items-center justify-center bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:5px_5px]">
          {/* Central Texas Lone Star Emblem */}
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-amber-400/60 bg-gradient-to-b from-amber-600/40 to-amber-950/60 flex items-center justify-center shadow-inner">
            <span className="text-amber-300 text-[10px] sm:text-xs font-serif font-black leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              ★
            </span>
          </div>
        </div>
      </div>
    );
  }

  const red = isRedSuit(card.suit);
  const colorClass = red ? 'text-[#c81e1e]' : 'text-[#0f172a]';

  return (
    <div
      className={`relative ${sizeClasses[size]} bg-gradient-to-b from-white via-[#fcfbf9] to-[#f5f2ea] border ${
        isWinning
          ? 'border-amber-400 ring-2 sm:ring-4 ring-amber-400/90 shadow-[0_0_18px_rgba(251,191,36,0.9)] -translate-y-1 scale-105 z-20'
          : 'border-amber-950/20 shadow-md hover:shadow-lg'
      } flex select-none overflow-hidden transform transition-all duration-200 ${className}`}
    >
      {/* Top Left Corner Index */}
      <div
        className={`absolute top-0.5 left-1 sm:top-1 sm:left-1.5 flex flex-col items-center leading-none ${colorClass}`}
      >
        <span className="font-mono font-black tracking-tight text-[11px] sm:text-xs md:text-sm">
          {card.rank}
        </span>
        <span className="text-[10px] sm:text-xs leading-none mt-0.5">
          {card.suit}
        </span>
      </div>

      {/* Center Centerpiece Pip - Perfectly centered, never overlapping corners */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none ${colorClass} opacity-85 select-none`}
      >
        <span
          className={
            size === 'xs'
              ? 'text-sm'
              : size === 'sm'
              ? 'text-lg sm:text-xl'
              : size === 'md'
              ? 'text-xl sm:text-2xl md:text-3xl'
              : 'text-3xl sm:text-4xl'
          }
        >
          {card.suit}
        </span>
      </div>

      {/* Bottom Right Corner Index (Inverted) */}
      <div
        className={`absolute bottom-0.5 right-1 sm:bottom-1 sm:right-1.5 flex flex-col items-center leading-none rotate-180 ${colorClass}`}
      >
        <span className="font-mono font-black tracking-tight text-[11px] sm:text-xs md:text-sm">
          {card.rank}
        </span>
        <span className="text-[10px] sm:text-xs leading-none mt-0.5">
          {card.suit}
        </span>
      </div>
    </div>
  );
};
