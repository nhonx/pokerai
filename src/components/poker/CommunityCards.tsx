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
    <div className="flex items-center justify-center gap-2 md:gap-3 p-2 bg-black/40 backdrop-blur-md rounded-2xl border border-amber-500/20 shadow-2xl">
      {Array.from({ length: 5 }).map((_, idx) => {
        const card = cards[idx];
        return (
          <div key={idx} className="relative">
            {card ? (
              <PlayingCard card={card} isWinning={isWinning(card)} size="md" />
            ) : (
              <div className="w-14 h-20 border-2 border-dashed border-emerald-400/20 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono tracking-wider text-emerald-400/40 select-none">
                <span className="opacity-40">{slotLabels[idx]}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
