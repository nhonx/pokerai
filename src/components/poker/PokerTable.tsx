'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { TableState, PlayerAction, Card } from '@/lib/poker/types';
import { applyAction, startNewHand } from '@/lib/poker/engine';
import { PlayerSeat } from './PlayerSeat';
import { CommunityCards } from './CommunityCards';
import { ActionControls } from './ActionControls';
import { ChipStack } from './ChipStack';
import { HandStrengthHUD } from './HandStrengthHUD';
import { SettingsModal } from './SettingsModal';
import { TableLog } from './TableLog';
import { sounds } from '@/lib/audio';

interface PokerTableProps {
  initialState: TableState;
  onLeaveTable: () => void;
  onStateChange: (updatedState: TableState) => void;
}

export function getSeatPositionClass(playerIndex: number, totalPlayers: number): string {
  // Player 0 (Hero / User) is always bottom center
  if (playerIndex === 0) {
    return 'bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2';
  }

  // 2 players: Heads-up (Hero at bottom, Opponent at top)
  if (totalPlayers === 2) {
    return 'top-2 sm:top-4 left-1/2 -translate-x-1/2';
  }

  // 3 players: Hero bottom, P1 top-left, P2 top-right
  if (totalPlayers === 3) {
    if (playerIndex === 1) return 'top-3 sm:top-6 left-3 sm:left-12 md:left-24';
    return 'top-3 sm:top-6 right-3 sm:right-12 md:right-24';
  }

  // 4 players: Hero bottom, P1 upper-left, P2 top-center, P3 upper-right (keeps center open for community cards)
  if (totalPlayers === 4) {
    if (playerIndex === 1) return 'top-5 sm:top-8 left-1.5 sm:left-6 md:left-14';
    if (playerIndex === 2) return 'top-1 sm:top-2 left-1/2 -translate-x-1/2';
    return 'top-5 sm:top-8 right-1.5 sm:right-6 md:right-14';
  }

  // 5 players: Hero bottom, P1 bottom-left, P2 top-left, P3 top-right, P4 bottom-right
  if (totalPlayers === 5) {
    if (playerIndex === 1) return 'bottom-8 sm:bottom-12 left-1 sm:left-4 md:left-8';
    if (playerIndex === 2) return 'top-3 sm:top-5 left-2 sm:left-8 md:left-16';
    if (playerIndex === 3) return 'top-3 sm:top-5 right-2 sm:right-8 md:right-16';
    return 'bottom-8 sm:bottom-12 right-1 sm:right-4 md:right-8';
  }

  // 6 players: Hero bottom, P1 bottom-left, P2 top-left, P3 top-center, P4 top-right, P5 bottom-right
  if (playerIndex === 1) return 'bottom-8 sm:bottom-12 left-1 sm:left-3 md:left-6';
  if (playerIndex === 2) return 'top-4 sm:top-6 left-1.5 sm:left-6 md:left-14';
  if (playerIndex === 3) return 'top-1 sm:top-2 left-1/2 -translate-x-1/2';
  if (playerIndex === 4) return 'top-4 sm:top-6 right-1.5 sm:right-6 md:right-14';
  return 'bottom-8 sm:bottom-12 right-1 sm:right-3 md:right-6';
}

export const PokerTable: React.FC<PokerTableProps> = ({
  initialState,
  onLeaveTable,
  onStateChange,
}) => {
  const [state, setState] = useState<TableState>(initialState);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const aiProcessingRef = useRef(false);

  // Sync state upward, persist to localStorage, and record to server file memory
  const updateTableState = useCallback((newState: TableState) => {
    setState(newState);
    onStateChange(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pokerai_active_table', JSON.stringify(newState));
    }
    // Record to server inprogress/<tableId>/
    fetch('/api/table/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: newState }),
    }).catch(() => {});
  }, [onStateChange]);

  // Ensure table directory and initial state is recorded on mount
  useEffect(() => {
    fetch('/api/table/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: initialState }),
    }).catch(() => {});
  }, [initialState]);

  // Human player actions
  const handleFold = () => {
    const humanIndex = state.players.findIndex((p) => !p.isAI);
    if (humanIndex === -1) return;
    const human = state.players[humanIndex];

    const nextState = applyAction(state, {
      playerId: human.id,
      type: 'FOLD',
      amount: 0,
    });
    updateTableState(nextState);
  };

  const handleCheck = () => {
    const humanIndex = state.players.findIndex((p) => !p.isAI);
    if (humanIndex === -1) return;
    const human = state.players[humanIndex];

    const nextState = applyAction(state, {
      playerId: human.id,
      type: 'CHECK',
      amount: 0,
    });
    updateTableState(nextState);
  };

  const handleCall = () => {
    const humanIndex = state.players.findIndex((p) => !p.isAI);
    if (humanIndex === -1) return;
    const human = state.players[humanIndex];
    const callAmount = Math.max(0, state.currentHighestBet - human.currentBet);

    const nextState = applyAction(state, {
      playerId: human.id,
      type: 'CALL',
      amount: callAmount,
    });
    updateTableState(nextState);
  };

  const handleBetRaise = (amount: number) => {
    const humanIndex = state.players.findIndex((p) => !p.isAI);
    if (humanIndex === -1) return;
    const human = state.players[humanIndex];
    const type = state.currentHighestBet === 0 ? 'BET' : 'RAISE';

    const nextState = applyAction(state, {
      playerId: human.id,
      type,
      amount,
    });
    updateTableState(nextState);
  };

  const handleAllIn = () => {
    const humanIndex = state.players.findIndex((p) => !p.isAI);
    if (humanIndex === -1) return;
    const human = state.players[humanIndex];

    const nextState = applyAction(state, {
      playerId: human.id,
      type: 'ALL_IN',
      amount: human.chips,
    });
    updateTableState(nextState);
  };

  const handleDealHand = () => {
    const nextState = startNewHand(state);
    updateTableState(nextState);
  };

  const handleResetHand = () => {
    const nextState = startNewHand(state);
    updateTableState(nextState);
  };

  // Rebuy support: replenishes chips and deals next hand while staying at the table!
  const handleRebuy = () => {
    const starting = state.settings.startingChips || 1000;
    const replenishedPlayers = state.players.map((p) => ({
      ...p,
      chips: p.chips <= 0 ? starting : p.chips,
      isSittingOut: false,
      hasFolded: false,
      isAllIn: false,
    }));

    const stateWithChips = {
      ...state,
      players: replenishedPlayers,
      history: [
        `Hero rebought for $${starting.toLocaleString()}! Table replenished.`,
        ...state.history,
      ],
      statusMessage: `Hero rebought! New hand ready to deal.`,
    };

    const nextState = startNewHand(stateWithChips);
    updateTableState(nextState);
  };

  // Celebrate human win with fanfare & confetti
  useEffect(() => {
    if (state.phase === 'HAND_OVER' && state.winners && state.winners.length > 0) {
      const humanWon = state.winners.some((w) => w.player.id === 'human');
      if (humanWon) {
        sounds.playWin();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 },
          });
        } catch {
          // ignore if confetti fails
        }
      }
    }
  }, [state.phase, state.winners]);

  // AI Turn execution handler
  const processAITurn = useCallback(async () => {
    if (aiProcessingRef.current) return;

    const currentPlayer = state.players[state.currentTurnIndex];
    if (
      !currentPlayer ||
      !currentPlayer.isAI ||
      currentPlayer.chips <= 0 ||
      currentPlayer.isSittingOut ||
      currentPlayer.hasFolded ||
      currentPlayer.isAllIn ||
      state.phase === 'IDLE' ||
      state.phase === 'HAND_OVER' ||
      state.phase === 'SHOWDOWN'
    ) {
      return;
    }

    aiProcessingRef.current = true;
    setIsAIProcessing(true);

    // Natural delay so human can read the action flow
    await new Promise((res) => setTimeout(res, 900));

    try {
      const response = await fetch('/api/ai/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          playerIndex: state.currentTurnIndex,
        }),
      });

      if (!response.ok) {
        throw new Error('AI decision fetch failed');
      }

      const data = await response.json();
      const decision = data.decision;

      // Play matching audio
      if (decision.action === 'FOLD') {
        sounds.playFold();
      } else if (decision.action === 'CHECK') {
        sounds.playKnock();
      } else if (decision.action === 'ALL_IN') {
        sounds.playAllIn();
      } else {
        sounds.playChipClink();
      }

      const action: PlayerAction = {
        playerId: currentPlayer.id,
        type: decision.action,
        amount: decision.amount,
        reasoning: decision.internal_reasoning,
        tableTalk: decision.table_talk,
      };

      const updated = applyAction(state, action);
      updateTableState(updated);
    } catch (err) {
      console.error('Error during AI turn execution:', err);
    } finally {
      aiProcessingRef.current = false;
      setIsAIProcessing(false);
    }
  }, [state, updateTableState]);

  useEffect(() => {
    const currentPlayer = state.players[state.currentTurnIndex];
    if (
      currentPlayer &&
      currentPlayer.isAI &&
      currentPlayer.chips > 0 &&
      !currentPlayer.isSittingOut &&
      !currentPlayer.hasFolded &&
      !currentPlayer.isAllIn &&
      state.phase !== 'IDLE' &&
      state.phase !== 'HAND_OVER' &&
      state.phase !== 'SHOWDOWN'
    ) {
      processAITurn();
    }
  }, [state.currentTurnIndex, state.phase, processAITurn]);

  // Determine winning cards to highlight
  const winningCards: Card[] = [];
  if (state.phase === 'HAND_OVER' && state.winners) {
    state.winners.forEach((w) => {
      if (w.hand?.bestFiveCards) {
        winningCards.push(...w.hand.bestFiveCards);
      }
    });
  }

  const isShowdown = state.phase === 'SHOWDOWN' || state.phase === 'HAND_OVER';
  const humanPlayer = state.players.find((p) => !p.isAI);
  const isHumanBusted = humanPlayer ? humanPlayer.chips <= 0 : false;

  const handleUpdateSettings = (updated: Partial<import('@/lib/poker/types').GameSettings>) => {
    const updatedState = {
      ...state,
      settings: {
        ...state.settings,
        ...updated,
      },
    };
    updateTableState(updatedState);
  };

  return (
    <div className="relative w-full min-h-screen bg-saloon-wood flex flex-col justify-between overflow-x-hidden select-none text-stone-100">
      {/* Top Texas Saloon Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#170a04]/90 border-b border-amber-800/50 backdrop-blur-md z-30">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Back to Lobby Button */}
          <button
            onClick={onLeaveTable}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-700/40 text-[11px] sm:text-xs font-bold text-amber-200/90 hover:text-amber-100 transition-colors cursor-pointer shadow-md active:scale-95"
          >
            <span>←</span>
            <span>Lobby</span>
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 text-xs sm:text-sm">★</span>
              <h1 className="text-xs sm:text-sm md:text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-saloon">
                TEXAS HOLD&apos;EM
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-amber-200/60">
              <span>Hand #{state.handCount}</span>
              <span>•</span>
              <span>Blinds ${state.settings.smallBlind}/${state.settings.bigBlind}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Turn / Hand Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#100703] rounded-full border border-amber-800/40 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isAIProcessing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="text-amber-200/90 truncate max-w-[200px] md:max-w-[280px]">
              {isAIProcessing ? 'AI Opponent Deciding...' : state.statusMessage}
            </span>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-700/40 text-amber-300 hover:text-amber-100 transition-colors shadow-md cursor-pointer active:scale-95"
            title="Saloon Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Texas Saloon Poker Arena */}
      <main className="flex-1 flex items-center justify-center p-1 sm:p-3 md:p-6 relative">
        {/* Racetrack Poker Table Container */}
        <div className="relative w-full max-w-5xl h-[380px] sm:h-[460px] md:h-[530px] lg:h-[580px] rounded-[70px] sm:rounded-[120px] md:rounded-[170px] bg-leather-rail p-3 sm:p-4 md:p-6 flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-2 border-amber-900/40">
          {/* Outer Stitched Rail Thread Detail */}
          <div className="absolute inset-1.5 sm:inset-2 md:inset-3 rounded-[65px] sm:rounded-[115px] md:rounded-[165px] border border-dashed border-amber-600/30 pointer-events-none" />

          {/* Inner Brass Rim & Texas Emerald Felt Surface */}
          <div className="relative w-full h-full rounded-[55px] sm:rounded-[105px] md:rounded-[150px] bg-texas-felt border-2 border-amber-600/40 flex flex-col items-center justify-center">
            {/* Subtle Felt Fabric Weave Texture & Central Watermark */}
            <div className="absolute inset-0 rounded-[53px] sm:rounded-[103px] md:rounded-[148px] overflow-hidden pointer-events-none">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#bbf7d0_1px,transparent_1px)] [background-size:14px_14px]" />
              <div className="absolute inset-0 flex items-center justify-center select-none opacity-15">
                <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-amber-300/40 flex items-center justify-center">
                  <span className="text-amber-200 text-6xl sm:text-8xl font-serif">★</span>
                </div>
              </div>
            </div>

            {/* Central Pot Display */}
            <div className="relative z-10 flex flex-col items-center justify-center mb-1 sm:mb-2 md:mb-3">
              <div className="text-[9px] sm:text-[10px] font-mono tracking-widest text-amber-200/70 uppercase font-bold">
                Current Pot
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ChipStack amount={state.mainPot} size="md" />
              </div>
              {state.sidePots.length > 1 && (
                <div className="flex items-center gap-1 mt-1 text-[8px] sm:text-[9px] font-mono text-amber-300/80">
                  {state.sidePots.map((sp, idx) => (
                    <span
                      key={idx}
                      className="bg-black/50 px-1.5 py-0.5 rounded border border-amber-500/20"
                    >
                      Pot #{idx + 1}: ${sp.amount}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Central Community Cards Board */}
            <div className="relative z-10">
              <CommunityCards cards={state.communityCards} winningCards={winningCards} />
            </div>

            {/* Hand Winners Overlay Banner */}
            {state.phase === 'HAND_OVER' && state.winners && (
              <div className="absolute z-30 top-14 sm:top-18 bg-[#170a04]/95 border-2 border-amber-400/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)] px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl backdrop-blur-xl animate-fade-in flex flex-col items-center">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400 font-saloon">
                  🏆 Hand Winner
                </span>
                <span className="text-xs sm:text-sm md:text-base font-extrabold text-stone-100">
                  {state.winners.map((w) => `${w.player.name} ($${w.amount})`).join(', ')}
                </span>
              </div>
            )}

            {/* Out of Chips Banner (Non-blocking, so user can observe final round!) */}
            {state.phase === 'HAND_OVER' && isHumanBusted && (
              <div className="absolute z-30 bottom-18 sm:bottom-20 bg-rose-950/90 border border-rose-500/60 shadow-2xl px-4 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 text-rose-200 text-[10px] sm:text-xs font-bold animate-pulse">
                <span>💸 You are out of chips! Inspect the final board & decide below.</span>
              </div>
            )}

            {/* Player Seats Dynamically Positioned on the Felt */}
            {state.players.map((player, idx) => (
              <PlayerSeat
                key={player.id}
                player={player}
                isCurrentTurn={
                  state.currentTurnIndex === idx &&
                  state.phase !== 'HAND_OVER' &&
                  state.phase !== 'IDLE'
                }
                isDealer={state.dealerIndex === idx}
                isSmallBlind={state.smallBlindIndex === idx}
                isBigBlind={state.bigBlindIndex === idx}
                showCards={!player.isAI || isShowdown}
                winningCards={winningCards}
                positionClass={getSeatPositionClass(idx, state.players.length)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Saloon Control Console */}
      <footer className="p-2 sm:p-3 md:p-4 bg-[#140803]/95 border-t border-amber-800/50 backdrop-blur-md z-30 flex flex-col items-center gap-1.5 sm:gap-2">
        <HandStrengthHUD state={state} />
        <ActionControls
          state={state}
          onFold={handleFold}
          onCheck={handleCheck}
          onCall={handleCall}
          onBetRaise={handleBetRaise}
          onAllIn={handleAllIn}
          onDealHand={handleDealHand}
          onLeaveTable={onLeaveTable}
          onRebuy={handleRebuy}
        />
      </footer>

      {/* Floating Table Feed Drawer */}
      <TableLog state={state} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        onLeaveTable={onLeaveTable}
        onResetHand={handleResetHand}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
};
