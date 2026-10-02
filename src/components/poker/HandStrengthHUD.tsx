'use client';

import React from 'react';
import { TableState } from '@/lib/poker/types';
import { evaluateHand } from '@/lib/poker/evaluator';
import { calculatePotOdds } from '@/lib/poker/engine';

interface HandStrengthHUDProps {
  state: TableState;
}

export const HandStrengthHUD: React.FC<HandStrengthHUDProps> = ({ state }) => {
  const humanIndex = state.players.findIndex((p) => !p.isAI);
  if (humanIndex === -1) return null;

  const human = state.players[humanIndex];
  if (human.cards.length === 0 || human.hasFolded) return null;

  const cards = [...human.cards, ...state.communityCards];
  const evaluation = evaluateHand(cards);
  const potOdds = calculatePotOdds(state, humanIndex);

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 bg-[#170a04]/90 backdrop-blur-md rounded-xl border border-amber-600/40 text-[11px] sm:text-xs shadow-lg max-w-xl mx-auto">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="text-amber-200/60 font-medium">Hand:</span>
        <span className="font-bold text-amber-300 font-mono tracking-tight">
          {evaluation.description}
        </span>
      </div>

      {potOdds.toCall > 0 && (
        <div className="flex items-center gap-1 sm:gap-1.5 pl-2 sm:pl-3 border-l border-amber-800/60 font-mono text-[10px] sm:text-[11px]">
          <span className="text-amber-200/60">Pot Odds:</span>
          <span className="text-amber-400 font-bold">{potOdds.oddsPercent}%</span>
          <span className="text-stone-400 hidden sm:inline">
            (${potOdds.toCall} to win ${potOdds.totalPot})
          </span>
        </div>
      )}
    </div>
  );
};
