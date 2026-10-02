'use client';

import React, { useState } from 'react';
import { TableState } from '@/lib/poker/types';
import { CreateTableOptions } from '@/lib/poker/engine';
import { sounds } from '@/lib/audio';

interface LobbyProps {
  savedTable: TableState | null;
  onResumeTable: () => void;
  onDiscardSavedTable: () => void;
  onCreateTable: (options: CreateTableOptions) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  savedTable,
  onResumeTable,
  onDiscardSavedTable,
  onCreateTable,
}) => {
  const [playerName, setPlayerName] = useState<string>('Hero');
  const [numAIPlayers, setNumAIPlayers] = useState<number>(3);
  const [startingChips, setStartingChips] = useState<number>(1000);
  const [blinds, setBlinds] = useState<{ sb: number; bb: number }>({ sb: 10, bb: 20 });
  const [reasoningEffort, setReasoningEffort] = useState<import('@/lib/poker/types').ReasoningEffort>('low');

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playDealCard();
    onCreateTable({
      playerName: playerName.trim() || 'Hero',
      numAIPlayers,
      startingChips,
      smallBlind: blinds.sb,
      bigBlind: blinds.bb,
      reasoningEffort,
    });
  };

  const startingChipPresets = [500, 1000, 2500, 5000];
  const blindPresets = [
    { label: '$5 / $10', sb: 5, bb: 10 },
    { label: '$10 / $20', sb: 10, bb: 20 },
    { label: '$25 / $50', sb: 25, bb: 50 },
    { label: '$50 / $100', sb: 50, bb: 100 },
  ];

  return (
    <div className="min-h-screen bg-saloon-wood text-stone-100 flex flex-col justify-between p-3 sm:p-6 md:p-8 select-none">
      {/* Saloon Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-3 sm:py-4 border-b border-amber-800/40">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center font-serif text-stone-950 text-xl sm:text-2xl shadow-[0_4px_15px_rgba(245,158,11,0.5)] border border-amber-200">
            ★
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-saloon">
              TEXAS HOLD&apos;EM SALOON
            </h1>
            <p className="text-[10px] sm:text-xs text-amber-200/70 font-mono">
              High Stakes Lone Star Poker Against Autonomous AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 font-mono font-bold flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Saloon Open
          </span>
        </div>
      </header>

      {/* Main Lobby Form Container */}
      <main className="max-w-2xl mx-auto w-full my-auto py-6 sm:py-8 space-y-5 sm:space-y-6">
        {/* Saved Table Resume Card */}
        {savedTable && (
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#291409]/95 via-[#1a0c05]/95 to-[#120703]/95 border-2 border-amber-500/40 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-amber-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  Active Table In Progress
                </span>
                <span className="text-xs text-amber-200/60 font-mono">Hand #{savedTable.handCount}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-amber-100">
                Resume Game with {savedTable.players.filter((p) => p.isAI).map((p) => p.name).join(', ')}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 text-[11px] sm:text-xs font-mono text-amber-200/70 pt-1">
                <span>
                  Your Chips:{' '}
                  <strong className="text-amber-400">
                    ${savedTable.players.find((p) => !p.isAI)?.chips.toLocaleString()}
                  </strong>
                </span>
                <span>•</span>
                <span>Pot: ${savedTable.mainPot}</span>
                <span>•</span>
                <span>Blinds: ${savedTable.settings.smallBlind}/${savedTable.settings.bigBlind}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={onDiscardSavedTable}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold transition-colors cursor-pointer border border-stone-700"
              >
                Discard
              </button>
              <button
                onClick={() => {
                  sounds.playDealCard();
                  onResumeTable();
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 text-xs font-black tracking-wide shadow-lg transition-all active:scale-95 cursor-pointer uppercase font-saloon"
              >
                Resume Game ♠
              </button>
            </div>
          </div>
        )}

        {/* Create Table Card */}
        <div className="bg-[#1b0d06]/90 border-2 border-amber-700/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2.5 mb-5 pb-3.5 border-b border-amber-800/40">
            <span className="text-xl sm:text-2xl text-amber-400">★</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-100 font-saloon">
                Take a Seat at the Table
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-200/60">
                Configure your Texas Hold&apos;em game stakes and opponents
              </p>
            </div>
          </div>

          <form onSubmit={handleStartGame} className="space-y-4 sm:space-y-6">
            {/* Player Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs font-bold text-amber-200/80 uppercase tracking-wider">
                Your Player Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                placeholder="Enter cowboy nickname..."
                className="w-full bg-[#100703] border border-amber-700/50 focus:border-amber-400 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-amber-100 font-medium outline-none transition-colors"
              />
            </div>

            {/* Number of AI Opponents */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] sm:text-xs font-bold text-amber-200/80 uppercase tracking-wider">
                  AI Opponents
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {numAIPlayers} {numAIPlayers === 1 ? 'Bot' : 'Bots'} ({numAIPlayers + 1}-handed table)
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumAIPlayers(num)}
                    className={`py-2 sm:py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      numAIPlayers === num
                        ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 border-amber-300 shadow-md font-black scale-102'
                        : 'bg-[#100703] text-stone-300 border-amber-800/40 hover:border-amber-600/60'
                    }`}
                  >
                    {num} AI
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] sm:text-xs font-bold text-amber-200/80 uppercase tracking-wider">
                  Starting Stack
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ${startingChips.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {startingChipPresets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setStartingChips(amount)}
                    className={`py-2 sm:py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      startingChips === amount
                        ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 border-amber-300 shadow-md font-black'
                        : 'bg-[#100703] text-stone-300 border-amber-800/40 hover:border-amber-600/60'
                    }`}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Blind Stakes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] sm:text-xs font-bold text-amber-200/80 uppercase tracking-wider">
                  Blinds (SB / BB)
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ${blinds.sb} / ${blinds.bb}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {blindPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setBlinds({ sb: preset.sb, bb: preset.bb })}
                    className={`py-2 sm:py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      blinds.sb === preset.sb && blinds.bb === preset.bb
                        ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 border-amber-300 shadow-md font-black'
                        : 'bg-[#100703] text-stone-300 border-amber-800/40 hover:border-amber-600/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Reasoning Level */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] sm:text-xs font-bold text-amber-200/80 uppercase tracking-wider">
                  AI Reasoning Level
                </label>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  {reasoningEffort} (Default: Low)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {(['none', 'low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setReasoningEffort(level)}
                    className={`py-2 sm:py-2.5 rounded-xl text-xs font-bold border capitalize transition-all cursor-pointer ${
                      reasoningEffort === level
                        ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 border-amber-300 shadow-md font-black'
                        : 'bg-[#100703] text-stone-300 border-amber-800/40 hover:border-amber-600/60'
                    }`}
                  >
                    {level === 'low' ? 'Low ★' : level}
                  </button>
                ))}
              </div>
            </div>

            {/* Enter Table Button */}
            <button
              type="submit"
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-sm sm:text-base tracking-wider uppercase rounded-xl border-2 border-amber-300 shadow-[0_4px_25px_rgba(245,158,11,0.6)] transform transition-transform active:scale-98 cursor-pointer mt-5 font-saloon"
            >
              Enter Texas Saloon ♠
            </button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-amber-800/30 text-center text-[10px] sm:text-[11px] text-amber-200/50 font-mono">
            Table progress is automatically recorded & saved.
          </div>
        </div>
      </main>

      {/* Lobby Footer */}
      <footer className="max-w-2xl mx-auto w-full py-3 text-center text-[10px] sm:text-xs text-amber-200/50 font-mono border-t border-amber-800/30">
        Texas Hold&apos;em Saloon • Autonomous LLM Agents Pair-Playing Experience
      </footer>
    </div>
  );
};
