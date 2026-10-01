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
    return 'bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2';
  }

  // 2 players: Heads-up (Hero at bottom, Opponent at top)
  if (totalPlayers === 2) {
    return 'top-2 sm:top-3 left-1/2 -translate-x-1/2';
  }

  // 3 players: Hero bottom, P1 top-left, P2 top-right
  if (totalPlayers === 3) {
    if (playerIndex === 1) return 'top-6 left-8 sm:left-24';
    return 'top-6 right-8 sm:right-24';
  }

  // 4 players: Hero bottom, P1 left, P2 top, P3 right
  if (totalPlayers === 4) {
    if (playerIndex === 1) return 'top-1/2 left-2 sm:left-4 -translate-y-1/2';
    if (playerIndex === 2) return 'top-2 sm:top-3 left-1/2 -translate-x-1/2';
    return 'top-1/2 right-2 sm:right-4 -translate-y-1/2';
  }

  // 5 players: Hero bottom, P1 bottom-left, P2 top-left, P3 top-right, P4 bottom-right
  if (totalPlayers === 5) {
    if (playerIndex === 1) return 'bottom-16 left-2 sm:left-6';
    if (playerIndex === 2) return 'top-4 left-6 sm:left-20';
    if (playerIndex === 3) return 'top-4 right-6 sm:right-20';
    return 'bottom-16 right-2 sm:right-6';
  }

  // 6 players: Hero bottom, P1 bottom-left, P2 top-left, P3 top-center, P4 top-right, P5 bottom-right
  if (playerIndex === 1) return 'bottom-16 left-2 sm:left-4';
  if (playerIndex === 2) return 'top-5 left-6 sm:left-16';
  if (playerIndex === 3) return 'top-2 sm:top-3 left-1/2 -translate-x-1/2';
  if (playerIndex === 4) return 'top-5 right-6 sm:right-16';
  return 'bottom-16 right-2 sm:right-4';
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
      // Backend automatically retrieves OPENROUTER_API_KEY from env and uses player.model
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
  const remainingAIs = state.players.filter((p) => p.isAI && p.chips > 0);
  const isHumanWinner = !isHumanBusted && remainingAIs.length === 0 && state.players.length > 1;

  return (
    <div className="relative w-full min-h-screen bg-slate-950 flex flex-col justify-between overflow-x-hidden font-sans select-none text-slate-100">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          {/* Leave Table / Back to Lobby Button */}
          <button
            onClick={onLeaveTable}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>←</span>
            <span>Lobby</span>
          </button>

          <div>
            <h1 className="text-sm sm:text-base font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400">
              TEXAS HOLD&apos;EM
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span>Hand #{state.handCount}</span>
              <span>•</span>
              <span>Blinds ${state.settings.smallBlind}/${state.settings.bigBlind}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 truncate max-w-[220px]">
              {isAIProcessing ? 'AI Agent Thinking...' : state.statusMessage}
            </span>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 transition-colors shadow-md cursor-pointer"
            title="Table Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Poker Arena & Felt Table */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-4 relative">
        <div className="relative w-full max-w-5xl h-[560px] md:h-[620px] rounded-[140px] md:rounded-[180px] bg-gradient-to-b from-stone-900 via-stone-950 to-black p-4 md:p-6 shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(0,0,0,0.9)] border-4 border-amber-900/40 flex items-center justify-center">
          {/* Outer Stitched Rail */}
          <div className="absolute inset-1.5 md:inset-2.5 rounded-[135px] md:rounded-[175px] border-2 border-dashed border-amber-700/25 pointer-events-none" />

          {/* Inner Deep Emerald Felt Surface */}
          <div className="relative w-full h-full rounded-[120px] md:rounded-[160px] bg-gradient-to-radial from-[#125835] via-[#0b3823] to-[#041a10] border-2 border-emerald-900/60 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center justify-center">
            {/* Subtle Felt Texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Central Pot Display */}
            <div className="relative z-10 flex flex-col items-center justify-center mb-3">
              <div className="text-[10px] font-mono tracking-widest text-emerald-300/60 uppercase">
                Current Pot
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <ChipStack amount={state.mainPot} size="md" />
              </div>
              {state.sidePots.length > 1 && (
                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-amber-300/80">
                  {state.sidePots.map((sp, idx) => (
                    <span key={idx} className="bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/20">
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

            {/* Winners Overlay Banner */}
            {state.phase === 'HAND_OVER' && state.winners && (
              <div className="absolute z-20 top-20 bg-slate-950/90 border border-amber-400/60 shadow-2xl px-6 py-2 rounded-2xl backdrop-blur-xl animate-fade-in flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  🏆 Hand Winner
                </span>
                <span className="text-sm md:text-base font-extrabold text-white">
                  {state.winners.map((w) => `${w.player.name} ($${w.amount})`).join(', ')}
                </span>
              </div>
            )}

            {/* Player Seats Dynamically Positioned */}
            {state.players.map((player, idx) => (
              <PlayerSeat
                key={player.id}
                player={player}
                isCurrentTurn={state.currentTurnIndex === idx && state.phase !== 'HAND_OVER' && state.phase !== 'IDLE'}
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

      {/* Bottom Control Bar */}
      <footer className="p-3 md:p-4 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md z-30 flex flex-col items-center gap-2">
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
        />
      </footer>

      {/* Out of Chips Bust Out Modal */}
      {state.phase === 'HAND_OVER' && isHumanBusted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-3xl shadow-inner">
              💸
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-rose-400">OUT OF CHIPS!</h2>
              <p className="text-sm text-slate-300">
                You have lost all your chips and have been eliminated from the table.
              </p>
              <div className="text-xs font-mono text-slate-400 pt-2">
                Hands Played: <strong className="text-white">{state.handCount}</strong>
              </div>
            </div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('pokerai_active_table');
                }
                onLeaveTable();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-sm tracking-wider uppercase rounded-xl shadow-lg cursor-pointer"
            >
              Exit to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Tournament Win Modal */}
      {state.phase === 'HAND_OVER' && isHumanWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-inner">
              🏆
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-amber-400">TABLE CHAMPION!</h2>
              <p className="text-sm text-slate-300">
                Congratulations! You have eliminated all AI opponents and claimed all the chips at the table!
              </p>
              <div className="text-xs font-mono text-slate-400 pt-2">
                Final Stack: <strong className="text-amber-400">${humanPlayer?.chips.toLocaleString()}</strong>
              </div>
            </div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('pokerai_active_table');
                }
                onLeaveTable();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm tracking-wider uppercase rounded-xl shadow-lg cursor-pointer"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Floating Table Log Drawer */}
      <TableLog state={state} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        onLeaveTable={onLeaveTable}
        onResetHand={handleResetHand}
      />
    </div>
  );
};
