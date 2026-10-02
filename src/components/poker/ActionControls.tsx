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
  onRebuy?: () => void;
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
  onRebuy,
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

  // When hand is over or game is completed:
  if (isHandOver) {
    // Human is busted: DO NOT block screen. Display non-intrusive decision bar!
    if (isHumanBusted) {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 bg-[#1b0d06]/95 border-2 border-rose-500/40 rounded-2xl shadow-2xl max-w-xl mx-auto w-full backdrop-blur-md">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-rose-400 font-black text-xs uppercase tracking-wider">
                💸 Out of Chips
              </span>
              <span className="text-[10px] text-amber-200/60 font-mono">
                Hand #{state.handCount}
              </span>
            </div>
            <p className="text-xs text-amber-100/90 mt-0.5">
              Observe the final showdown above. You can return to lobby or rebuy.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('pokerai_active_table');
                }
                onLeaveTable?.();
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-600 text-stone-200 text-xs font-bold transition-colors cursor-pointer"
            >
              ← Exit to Lobby
            </button>
            {onRebuy && (
              <button
                onClick={() => {
                  sounds.playChipClink();
                  onRebuy();
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 text-xs font-black tracking-wide shadow-lg transition-all active:scale-95 cursor-pointer uppercase"
              >
                Rebuy & Play ♠
              </button>
            )}
          </div>
        </div>
      );
    }

    // Human is the tournament champion
    if (isHumanWinner) {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 bg-[#1b0d06]/95 border-2 border-amber-400/60 rounded-2xl shadow-2xl max-w-xl mx-auto w-full backdrop-blur-md">
          <div className="text-center sm:text-left">
            <span className="text-amber-400 font-black text-xs uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
              🏆 Saloon Champion!
            </span>
            <p className="text-xs text-amber-100/90 mt-0.5">
              You cleared the table and claimed all the chips!
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('pokerai_active_table');
                }
                onLeaveTable?.();
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 text-xs font-black tracking-wide shadow-lg transition-all active:scale-95 cursor-pointer uppercase"
            >
              Return to Lobby 🏆
            </button>
          </div>
        </div>
      );
    }

    // Ready to deal next hand
    return (
      <div className="flex items-center justify-center p-2 sm:p-3">
        <button
          onClick={() => {
            sounds.playDealCard();
            onDealHand();
          }}
          className="px-8 sm:px-12 py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-base sm:text-lg tracking-wider rounded-xl border-2 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.6)] transform transition-transform active:scale-95 cursor-pointer uppercase font-saloon"
        >
          Deal Hand ♠
        </button>
      </div>
    );
  }

  const isInteractive = Boolean(isHumanTurn && valid && humanPlayer);

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

  const canFold = Boolean(isInteractive && valid?.canFold);
  const canCheck = Boolean(isInteractive && valid?.canCheck);
  const canCall = Boolean(isInteractive && valid?.canCall);
  const callAmount = valid?.callAmount ?? 0;
  const canBet = Boolean(isInteractive && valid?.canBet);
  const canRaise = Boolean(isInteractive && valid?.canRaise);
  const isWagerAvailable = Boolean(isInteractive && (canBet || canRaise));
  const chips = humanPlayer?.chips ?? 0;

  return (
    <div
      className={`flex flex-col gap-2 sm:gap-3 p-2.5 sm:p-4 bg-[#1b0d06]/95 backdrop-blur-xl rounded-2xl border-2 border-amber-700/50 shadow-[0_10px_35px_rgba(0,0,0,0.9)] max-w-2xl mx-auto w-full transition-opacity duration-300 ${
        isInteractive ? 'opacity-100' : 'opacity-40 pointer-events-none'
      }`}
    >
      {/* Quick Bet Presets (if bet/raise available) */}
      {isWagerAvailable && (
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => handlePreset('MIN')}
            className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-200 border border-amber-700/40 cursor-pointer active:scale-95 transition-all"
          >
            Min
          </button>
          <button
            onClick={() => handlePreset('2.5X')}
            className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-200 border border-amber-700/40 cursor-pointer active:scale-95 transition-all"
          >
            2.5x
          </button>
          <button
            onClick={() => handlePreset('3X')}
            className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-200 border border-amber-700/40 cursor-pointer active:scale-95 transition-all"
          >
            3x
          </button>
          <button
            onClick={() => handlePreset('HALF_POT')}
            className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-200 border border-amber-700/40 cursor-pointer active:scale-95 transition-all"
          >
            ½ Pot
          </button>
          <button
            onClick={() => handlePreset('POT')}
            className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-200 border border-amber-700/40 cursor-pointer active:scale-95 transition-all"
          >
            Pot
          </button>
          <button
            onClick={() => handlePreset('ALL_IN')}
            className="px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-mono font-black rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 border border-amber-400 cursor-pointer active:scale-95 transition-all"
          >
            All-In
          </button>
        </div>
      )}

      {/* Slider & Quick Adjust for Touch/Mobile */}
      {isWagerAvailable && maxWager > minWager && (
        <div className="flex items-center gap-2 sm:gap-4 px-1">
          {/* Step Down Button */}
          <button
            onClick={() =>
              setBetAmount((prev) =>
                Math.max(minWager, prev - state.settings.smallBlind)
              )
            }
            className="w-7 h-7 rounded-lg bg-stone-900 border border-amber-700/50 text-amber-300 font-bold flex items-center justify-center text-sm active:scale-90"
          >
            -
          </button>

          <input
            type="range"
            min={minWager}
            max={maxWager}
            step={state.settings.smallBlind}
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="flex-1 accent-amber-400 h-2 bg-stone-900 rounded-lg cursor-pointer"
          />

          {/* Step Up Button */}
          <button
            onClick={() =>
              setBetAmount((prev) =>
                Math.min(maxWager, prev + state.settings.smallBlind)
              )
            }
            className="w-7 h-7 rounded-lg bg-stone-900 border border-amber-700/50 text-amber-300 font-bold flex items-center justify-center text-sm active:scale-90"
          >
            +
          </button>

          <span className="font-mono font-black text-amber-400 text-xs sm:text-sm min-w-[70px] text-right">
            ${betAmount.toLocaleString()}
          </span>
        </div>
      )}

      {/* Main Action Buttons Deck */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Fold Button */}
        <button
          onClick={() => {
            sounds.playFold();
            onFold();
          }}
          disabled={!canFold}
          className="btn-saloon-fold py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl text-stone-100 font-bold text-xs sm:text-sm tracking-wide transition-all active:scale-95 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed uppercase"
        >
          Fold
        </button>

        {/* Check or Call Button */}
        {canCheck ? (
          <button
            onClick={() => {
              sounds.playKnock();
              onCheck();
            }}
            disabled={!canCheck}
            className="btn-saloon-check py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl text-stone-100 font-bold text-xs sm:text-sm tracking-wide transition-all active:scale-95 cursor-pointer uppercase disabled:opacity-35 disabled:cursor-not-allowed"
          >
            Check
          </button>
        ) : (
          <button
            onClick={() => {
              sounds.playChipClink();
              onCall();
            }}
            disabled={!canCall}
            className="btn-saloon-call py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl text-stone-100 font-bold text-xs sm:text-sm tracking-wide transition-all active:scale-95 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed uppercase"
          >
            Call ${callAmount}
          </button>
        )}

        {/* Bet, Raise, or All-In Button */}
        {isWagerAvailable ? (
          <button
            onClick={() => {
              sounds.playChipClink();
              if (betAmount >= chips) {
                sounds.playAllIn();
                onAllIn();
              } else {
                onBetRaise(betAmount);
              }
            }}
            className="btn-saloon-raise py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl text-stone-950 font-black text-xs sm:text-sm tracking-wide transition-all active:scale-95 cursor-pointer uppercase"
          >
            {betAmount >= chips
              ? 'ALL-IN'
              : canBet
              ? `Bet $${betAmount}`
              : `Raise $${betAmount}`}
          </button>
        ) : (
          <button
            onClick={() => {
              sounds.playAllIn();
              onAllIn();
            }}
            disabled={!isInteractive}
            className="btn-saloon-raise py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl text-stone-950 font-black text-xs sm:text-sm shadow-md cursor-pointer uppercase disabled:opacity-35 disabled:cursor-not-allowed"
          >
            All-In (${chips})
          </button>
        )}
      </div>
    </div>
  );
};
