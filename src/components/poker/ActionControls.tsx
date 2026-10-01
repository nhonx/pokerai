'use client';

import React, { useState, useEffect } from 'react';
import { TableState } from '@/lib/poker/types';
import { getValidActions } from '@/lib/poker/engine';
import { sounds } from '@/lib/audio';

interface ActionControlsProps {
  state: TableState;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onBetRaise: (amount: number) => void;
  onAllIn: () => void;
  onDealHand: () => void;
  onLeaveTable?: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  state,
  onFold,
  onCheck,
  onCall,
  onBetRaise,
  onAllIn,
  onDealHand,
  onLeaveTable,
}) => {
  const isHandOver = state.phase === 'IDLE' || state.phase === 'HAND_OVER';
  const humanIndex = state.players.findIndex((p) => !p.isAI);
  const isHumanTurn = !isHandOver && state.currentTurnIndex === humanIndex;
  const humanPlayer = state.players[humanIndex];

  const isHumanBusted = humanPlayer ? humanPlayer.chips <= 0 : false;
  const remainingAIs = state.players.filter((p) => p.isAI && p.chips > 0);
  const isHumanWinner = !isHumanBusted && remainingAIs.length === 0 && state.players.length > 1;

  const valid = humanIndex !== -1 ? getValidActions(state, humanIndex) : null;

  // Bet amount state
  const minWager = valid?.canBet ? valid.minBet : valid?.canRaise ? valid.minRaise : 0;
  const maxWager = valid?.maxBet || valid?.maxRaise || 0;
  const [betAmount, setBetAmount] = useState<number>(minWager);

  useEffect(() => {
    if (minWager > 0) {
      setBetAmount(minWager);
    }
  }, [minWager]);

  if (isHandOver) {
    if (isHumanBusted) {
      return (
        <div className="flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-rose-500/40 shadow-2xl">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('pokerai_active_table');
              }
              onLeaveTable?.();
            }}
            className="px-8 py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-sm tracking-wide rounded-xl shadow-lg cursor-pointer uppercase"
          >
            Out of Chips — Exit to Lobby 💸
          </button>
        </div>
      );
    }

    if (isHumanWinner) {
      return (
        <div className="flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-amber-400/50 shadow-2xl">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('pokerai_active_table');
              }
              onLeaveTable?.();
            }}
            className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm tracking-wide rounded-xl shadow-lg cursor-pointer uppercase"
          >
            Table Won! — Return to Lobby 🏆
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-amber-500/30 shadow-2xl">
        <button
          onClick={() => {
            sounds.playDealCard();
            onDealHand();
          }}
          className="px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-lg tracking-wide rounded-xl shadow-[0_0_25px_rgba(251,191,36,0.6)] transform transition-transform active:scale-95 cursor-pointer uppercase"
        >
          Deal Hand ♠
        </button>
      </div>
    );
  }

  if (!isHumanTurn || !valid || !humanPlayer) {
    const currentActive = state.players[state.currentTurnIndex];
    return (
      <div className="flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl text-slate-400 font-mono text-sm animate-pulse">
        Waiting for {currentActive ? currentActive.name : 'action'}...
      </div>
    );
  }

  // Quick preset handlers
  const handlePreset = (type: 'MIN' | '2.5X' | '3X' | 'HALF_POT' | 'POT' | 'ALL_IN') => {
    sounds.playChipClink();
    const pot = Math.max(state.mainPot, state.settings.bigBlind);

    switch (type) {
      case 'MIN':
        setBetAmount(minWager);
        break;
      case '2.5X':
        setBetAmount(Math.min(maxWager, Math.max(minWager, Math.round(state.settings.bigBlind * 2.5))));
        break;
      case '3X':
        setBetAmount(Math.min(maxWager, Math.max(minWager, Math.round(state.settings.bigBlind * 3))));
        break;
      case 'HALF_POT':
        setBetAmount(Math.min(maxWager, Math.max(minWager, Math.round(pot * 0.5))));
        break;
      case 'POT':
        setBetAmount(Math.min(maxWager, Math.max(minWager, pot)));
        break;
      case 'ALL_IN':
        setBetAmount(maxWager);
        break;
    }
  };

  const isWagerAvailable = valid.canBet || valid.canRaise;

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-950/90 backdrop-blur-xl rounded-2xl border border-amber-500/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] max-w-2xl mx-auto w-full">
      {/* Quick Bet Presets (if bet/raise available) */}
      {isWagerAvailable && (
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <button
            onClick={() => handlePreset('MIN')}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
          >
            Min
          </button>
          <button
            onClick={() => handlePreset('2.5X')}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
          >
            2.5x BB
          </button>
          <button
            onClick={() => handlePreset('3X')}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
          >
            3x BB
          </button>
          <button
            onClick={() => handlePreset('HALF_POT')}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
          >
            ½ Pot
          </button>
          <button
            onClick={() => handlePreset('POT')}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
          >
            Pot
          </button>
          <button
            onClick={() => handlePreset('ALL_IN')}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 cursor-pointer"
          >
            All-In
          </button>
        </div>
      )}

      {/* Slider & Amount Selector */}
      {isWagerAvailable && maxWager > minWager && (
        <div className="flex items-center gap-4 px-1">
          <input
            type="range"
            min={minWager}
            max={maxWager}
            step={state.settings.smallBlind}
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="flex-1 accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono font-bold text-amber-400 text-sm w-20 text-right">
            ${betAmount.toLocaleString()}
          </span>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Fold */}
        <button
          onClick={() => {
            sounds.playFold();
            onFold();
          }}
          disabled={!valid.canFold}
          className="py-3 px-4 rounded-xl bg-gradient-to-b from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 border border-rose-600 text-rose-100 font-bold text-sm tracking-wide shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Fold
        </button>

        {/* Check or Call */}
        {valid.canCheck ? (
          <button
            onClick={() => {
              sounds.playKnock();
              onCheck();
            }}
            className="py-3 px-4 rounded-xl bg-gradient-to-b from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 border border-emerald-500 text-emerald-100 font-bold text-sm tracking-wide shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Check
          </button>
        ) : (
          <button
            onClick={() => {
              sounds.playChipClink();
              onCall();
            }}
            disabled={!valid.canCall}
            className="py-3 px-4 rounded-xl bg-gradient-to-b from-blue-800 to-blue-950 hover:from-blue-700 hover:to-blue-900 border border-blue-500 text-blue-100 font-bold text-sm tracking-wide shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Call ${valid.callAmount}
          </button>
        )}

        {/* Bet, Raise, or All-In */}
        {isWagerAvailable ? (
          <button
            onClick={() => {
              sounds.playChipClink();
              if (betAmount >= humanPlayer.chips) {
                sounds.playAllIn();
                onAllIn();
              } else {
                onBetRaise(betAmount);
              }
            }}
            className="py-3 px-4 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border border-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all active:scale-95 cursor-pointer"
          >
            {betAmount >= humanPlayer.chips
              ? 'ALL-IN'
              : valid.canBet
              ? `Bet $${betAmount}`
              : `Raise to $${betAmount}`}
          </button>
        ) : (
          <button
            onClick={() => {
              sounds.playAllIn();
              onAllIn();
            }}
            className="py-3 px-4 rounded-xl bg-gradient-to-b from-amber-600 to-amber-700 text-slate-950 font-black text-sm shadow-md cursor-pointer"
          >
            All-In (${humanPlayer.chips})
          </button>
        )}
      </div>
    </div>
  );
};
