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
  const isTopSeat = positionClass.includes('top-');

  return (
    <div
      className={`absolute flex flex-col items-center select-none transition-all duration-300 z-20 ${positionClass} ${
        player.hasFolded ? 'opacity-40 grayscale-[40%]' : ''
      }`}
    >
      {/* AI Speech Bubble - Dynamically oriented so it never goes off table or overlaps rail */}
      {player.tableTalk && !player.hasFolded && (
        <div
          className={`absolute z-50 max-w-[160px] sm:max-w-[220px] bg-[#1e0e06]/98 text-amber-100 text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border-2 border-amber-400 shadow-[0_8px_25px_rgba(0,0,0,0.95)] backdrop-blur-md animate-bounce [animation-duration:3s] ${
            isTopSeat ? 'top-[calc(100%+8px)]' : 'bottom-[calc(100%+8px)]'
          }`}
        >
          <div className="line-clamp-2 italic text-center font-sans font-semibold drop-shadow-sm">
            &ldquo;{player.tableTalk}&rdquo;
          </div>
          {/* Arrow pointing towards player pod */}
          {isTopSeat ? (
            <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-[#1e0e06] border-l-2 border-t-2 border-amber-400 rotate-45" />
          ) : (
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-[#1e0e06] border-r-2 border-b-2 border-amber-400 rotate-45" />
          )}
        </div>
      )}

      {/* Hole Cards - Positioned clearly above pod with no overlapping badges */}
      <div className="flex -space-x-3 sm:-space-x-4 mb-1 z-10">
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
          <div className="h-12 sm:h-14 flex items-center justify-center text-[10px] sm:text-xs text-amber-200/50 font-mono italic">
            {player.chips === 0 ? 'Out of chips' : 'Waiting...'}
          </div>
        )}
      </div>

      {/* Main Avatar Pod (Texas Saloon Leather & Brass Frame) */}
      <div className="relative group">
        <div
          className={`relative flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#2a170c]/95 via-[#1a0e07]/95 to-[#100804]/95 border backdrop-blur-md shadow-2xl transition-all duration-300 ${
            isCurrentTurn
              ? 'border-amber-400 ring-2 sm:ring-4 ring-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.7)] scale-105'
              : 'border-amber-800/40 hover:border-amber-700/60'
          }`}
        >
          {/* Avatar Icon */}
          <div className="relative">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-950/80 to-stone-900 border border-amber-700/50 flex items-center justify-center text-base sm:text-xl shadow-inner">
              {player.avatar}
            </div>
          </div>

          {/* Name & Chips */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span
                className="text-[11px] sm:text-xs font-bold text-amber-100 max-w-[80px] sm:max-w-[130px] truncate tracking-tight"
                title={player.name}
              >
                {player.name}
              </span>
              {player.isAI && (
                <span className="text-[8px] sm:text-[9px] font-mono uppercase px-1 rounded bg-amber-900/60 text-amber-300 border border-amber-600/30">
                  AI
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-mono font-black text-amber-400">
              <span>${player.chips.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Position Badges - Mid-height on sides, completely clear of cards above and actions below */}
        {isDealer && (
          <div
            className="absolute -left-2.5 sm:-left-3 top-1/2 -translate-y-1/2 z-30 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 border border-amber-200 text-stone-950 flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-lg"
            title="Dealer Button"
          >
            ★D
          </div>
        )}
        {isSmallBlind && (
          <div
            className="absolute -right-2.5 sm:-right-3 top-1/2 -translate-y-1/2 z-30 px-1 sm:px-1.5 py-0.5 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 border border-blue-300 text-white text-[8px] sm:text-[9px] font-bold shadow-md"
            title="Small Blind"
          >
            SB
          </div>
        )}
        {isBigBlind && (
          <div
            className="absolute -right-2.5 sm:-right-3 top-1/2 -translate-y-1/2 z-30 px-1 sm:px-1.5 py-0.5 rounded-full bg-gradient-to-b from-amber-600 to-amber-800 border border-amber-300 text-white text-[8px] sm:text-[9px] font-bold shadow-md"
            title="Big Blind"
          >
            BB
          </div>
        )}

        {/* Persona Tooltip on Hover */}
        {persona && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-44 sm:w-48 p-2 bg-[#1b0d06]/95 border border-amber-600/50 rounded-lg text-[10px] text-amber-200/90 shadow-xl backdrop-blur-md pointer-events-none">
            <div className="font-bold text-amber-300">{persona.archetype}</div>
            <div className="mt-0.5 text-stone-300 leading-tight">{persona.styleDescription}</div>
          </div>
        )}
      </div>

      {/* Action / Showdown / Bet Status */}
      <div className="mt-1 flex flex-col items-center gap-0.5">
        {/* Last Action Label */}
        {player.lastAction && (
          <span
            className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md ${
              player.lastAction.type === 'FOLD'
                ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
                : player.lastAction.type === 'CHECK'
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700'
                : player.lastAction.type === 'ALL_IN'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black animate-pulse border border-yellow-200'
                : 'bg-amber-950/90 text-amber-300 border border-amber-700'
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
          <div className="text-[9px] sm:text-[10px] font-bold text-amber-300 bg-black/75 px-2 py-0.5 rounded-md border border-amber-500/40 text-center max-w-[140px] sm:max-w-[170px] truncate shadow-lg">
            {player.showdownHand.description}
          </div>
        )}
      </div>
    </div>
  );
};
