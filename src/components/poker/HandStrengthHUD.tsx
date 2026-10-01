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
    <div className="flex items-center gap-3 px-3 py-2 bg-slate-950/80 backdrop-blur-md rounded-xl border border-emerald-500/30 text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-400 font-medium">Hand:</span>
        <span className="font-bold text-emerald-300 font-mono">{evaluation.description}</span>
      </div>

      {potOdds.toCall > 0 && (
        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700 font-mono text-[11px]">
          <span className="text-slate-400">Pot Odds:</span>
          <span className="text-amber-400 font-bold">{potOdds.oddsPercent}%</span>
          <span className="text-slate-500">(${potOdds.toCall} to win ${potOdds.totalPot})</span>
        </div>
      )}
    </div>
  );
};
