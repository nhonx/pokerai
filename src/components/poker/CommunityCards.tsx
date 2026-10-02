'use client';

import React from 'react';
import { Card } from '@/lib/poker/types';
import { PlayingCard } from './PlayingCard';

interface CommunityCardsProps {
  cards: Card[];
  winningCards?: Card[];
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({ cards, winningCards = [] }) => {
  const isWinning = (card?: Card) => {
    if (!card || winningCards.length === 0) return false;
    return winningCards.some((wc) => wc.suit === card.suit && wc.rank === card.rank);
  };

  const slotLabels = ['FLOP', 'FLOP', 'FLOP', 'TURN', 'RIVER'];

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 p-1.5 sm:p-2.5 md:p-3 bg-black/40 backdrop-blur-md rounded-2xl border border-amber-600/30 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
      {Array.from({ length: 5 }).map((_, idx) => {
        const card = cards[idx];
        return (
          <div key={idx} className="relative">
            {card ? (
              <PlayingCard card={card} isWinning={isWinning(card)} size="md" />
            ) : (
              <div className="w-9 h-13 sm:w-12 sm:h-17 md:w-15 md:h-21 border border-dashed border-amber-400/25 rounded-md sm:rounded-lg md:rounded-xl bg-black/25 flex flex-col items-center justify-center text-[8px] sm:text-[10px] font-mono tracking-wider text-amber-300/40 select-none shadow-inner">
                <span className="font-bold">{slotLabels[idx]}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
