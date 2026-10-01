'use client';

import React from 'react';
import { Player, Card } from '@/lib/poker/types';
import { PlayingCard } from './PlayingCard';
import { ChipStack } from './ChipStack';
import { AI_PERSONAS } from '@/lib/ai/personas';

interface PlayerSeatProps {
  player: Player;
  isCurrentTurn: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  showCards: boolean;
  winningCards?: Card[];
  positionClass: string;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isCurrentTurn,
  isDealer,
  isSmallBlind,
  isBigBlind,
  showCards,
  winningCards = [],
  positionClass,
}) => {
  const isWinning = (card?: Card) => {
    if (!card || winningCards.length === 0) return false;
    return winningCards.some((wc) => wc.suit === card.suit && wc.rank === card.rank);
  };

  const persona = player.personaId ? AI_PERSONAS[player.personaId] : null;

  return (
    <div
      className={`absolute flex flex-col items-center select-none transition-all duration-300 ${positionClass} ${
        player.hasFolded ? 'opacity-40 grayscale-[40%]' : ''
      }`}
    >
      {/* AI Speech Bubble */}
      {player.tableTalk && !player.hasFolded && (
        <div className="absolute -top-14 z-30 max-w-[210px] bg-slate-900/95 text-amber-200 text-xs px-3 py-1.5 rounded-xl border border-amber-400/40 shadow-2xl backdrop-blur-md animate-bounce [animation-duration:3s]">
          <div className="line-clamp-2 italic text-center font-sans font-medium">
            &ldquo;{player.tableTalk}&rdquo;
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-amber-400/40 rotate-45" />
        </div>
      )}

      {/* Hole Cards */}
      <div className="flex -space-x-4 mb-1.5 z-20">
        {player.cards.length === 2 ? (
          <>
            <PlayingCard
              card={player.cards[0]}
              faceDown={!showCards}
              isWinning={isWinning(player.cards[0])}
              size="sm"
              className="transform -rotate-6 shadow-md"
            />
            <PlayingCard
              card={player.cards[1]}
              faceDown={!showCards}
              isWinning={isWinning(player.cards[1])}
              size="sm"
              className="transform rotate-6 shadow-md"
            />
          </>
        ) : (
          <div className="h-14 flex items-center justify-center text-xs text-slate-500 font-mono italic">
            {player.chips === 0 ? 'Out of chips' : 'Waiting...'}
          </div>
        )}
      </div>

      {/* Main Avatar Pod */}
      <div className="relative group">
        <div
          className={`relative flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border backdrop-blur-lg shadow-2xl transition-all duration-300 ${
            isCurrentTurn
              ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-105'
              : 'border-slate-700/60'
          }`}
        >
          {/* Avatar Icon */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xl shadow-inner">
              {player.avatar}
            </div>

            {/* Position Badges */}
            {isDealer && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-slate-900 border border-slate-400 flex items-center justify-center text-[10px] font-black shadow-md">
                D
              </span>
            )}
            {isSmallBlind && (
              <span className="absolute -bottom-1 -left-1 px-1 rounded bg-blue-600 text-white text-[9px] font-bold">
                SB
              </span>
            )}
            {isBigBlind && (
              <span className="absolute -bottom-1 -left-1 px-1 rounded bg-amber-600 text-white text-[9px] font-bold">
                BB
              </span>
            )}
          </div>

          {/* Name & Chips */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-bold text-slate-100 max-w-[130px] sm:max-w-[160px] truncate"
                title={player.name}
              >
                {player.name}
              </span>
              {player.isAI && (
                <span className="text-[9px] font-mono uppercase px-1 rounded bg-purple-900/80 text-purple-300 border border-purple-500/30">
                  AI
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400">
              <span>${player.chips.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Persona Tooltip on Hover */}
        {persona && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-40 w-48 p-2 bg-slate-950/95 border border-purple-500/40 rounded-lg text-[10px] text-slate-300 shadow-xl backdrop-blur-md pointer-events-none">
            <div className="font-bold text-purple-300">{persona.archetype}</div>
            <div className="mt-0.5 text-slate-400 leading-tight">{persona.styleDescription}</div>
          </div>
        )}
      </div>

      {/* Action / Showdown / Bet Status */}
      <div className="mt-1.5 flex flex-col items-center gap-1">
        {/* Last Action Label */}
        {player.lastAction && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md ${
              player.lastAction.type === 'FOLD'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                : player.lastAction.type === 'CHECK'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : player.lastAction.type === 'ALL_IN'
                ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                : 'bg-indigo-950/80 text-indigo-300 border border-indigo-700'
            }`}
          >
            {player.lastAction.text}
          </span>
        )}

        {/* Current Round Bet Chip Stack */}
        {player.currentBet > 0 && (
          <div className="mt-0.5">
            <ChipStack amount={player.currentBet} size="sm" />
          </div>
        )}

        {/* Showdown Hand Evaluation */}
        {player.showdownHand && !player.hasFolded && (
          <div className="text-[10px] font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30 text-center max-w-[160px] truncate">
            {player.showdownHand.description}
          </div>
        )}
      </div>
    </div>
  );
};
