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

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playDealCard();
    onCreateTable({
      playerName: playerName.trim() || 'Hero',
      numAIPlayers,
      startingChips,
      smallBlind: blinds.sb,
      bigBlind: blinds.bb,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 select-none">
      {/* Lobby Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg">
            ♠
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400">
              TEXAS HOLD&apos;EM CASINO
            </h1>
            <p className="text-xs text-slate-400 font-mono">High Stakes Poker Against Autonomous AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Lobby Ready
          </span>
        </div>
      </header>

      {/* Main Lobby Container */}
      <main className="max-w-2xl mx-auto w-full my-auto py-8 space-y-6">
        {/* Saved Table Resume Card (if exists) */}
        {savedTable && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900/90 border border-amber-500/40 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  Active Table In Progress
                </span>
                <span className="text-xs text-slate-400 font-mono">Hand #{savedTable.handCount}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                Resume Table with {savedTable.players.filter((p) => p.isAI).map((p) => p.name).join(', ')}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-mono text-slate-400 pt-1">
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

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onDiscardSavedTable}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
              >
                Discard Table
              </button>
              <button
                onClick={() => {
                  sounds.playDealCard();
                  onResumeTable();
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black tracking-wide shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all cursor-pointer uppercase"
              >
                Resume Game ▶
              </button>
            </div>
          </div>
        )}

        {/* Create Table Form */}
        <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
            <span className="text-xl">🎰</span>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Create New Poker Table</h2>
              <p className="text-xs text-slate-400">Configure your table and enter the game</p>
            </div>
          </div>

          <form onSubmit={handleStartGame} className="space-y-6">
            {/* Player Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Your Player Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                placeholder="Enter nickname..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-slate-100 font-medium outline-none transition-colors"
              />
            </div>

            {/* Number of AI Opponents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  AI Opponents
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {numAIPlayers} {numAIPlayers === 1 ? 'Bot' : 'Bots'} ({numAIPlayers + 1}-handed table)
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumAIPlayers(num)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      numAIPlayers === num
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-102'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {num} AI
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Starting Stack
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ${startingChips.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {startingChipPresets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setStartingChips(amount)}
                    className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      startingChips === amount
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Blind Stakes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Blinds (SB / BB)
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ${blinds.sb} / ${blinds.bb}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {blindPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setBlinds({ sb: preset.sb, bb: preset.bb })}
                    className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      blinds.sb === preset.sb && blinds.bb === preset.bb
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm tracking-wider uppercase rounded-xl shadow-[0_0_25px_rgba(251,191,36,0.6)] transform transition-transform active:scale-98 cursor-pointer mt-6"
            >
              Start Game ♠
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500 font-mono">
            Table progress is automatically saved so you can resume anytime.
          </div>
        </div>
      </main>

      {/* Lobby Footer */}
      <footer className="max-w-2xl mx-auto w-full py-4 text-center text-xs text-slate-500 font-mono border-t border-slate-900">
        Texas Hold&apos;em Poker • Built with Next.js & Autonomous AI Agents
      </footer>
    </div>
  );
};
