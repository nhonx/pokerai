'use client';

import React, { useState } from 'react';
import { TableState, GameSettings, ReasoningEffort } from '@/lib/poker/types';
import { sounds } from '@/lib/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TableState;
  onLeaveTable: () => void;
  onResetHand: () => void;
  onUpdateSettings?: (settings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  onLeaveTable,
  onResetHand,
  onUpdateSettings,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sounds.enabled);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const currentReasoning = state.settings.reasoningEffort || 'low';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-[#1a0c05] border-2 border-amber-600/60 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-stone-200">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-amber-800/40">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">★</span>
            <h2 className="text-base sm:text-lg font-bold text-amber-300 font-saloon">
              Saloon Table Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-amber-400 hover:text-amber-200 p-1 cursor-pointer text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3.5 py-4">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#100703] rounded-xl border border-amber-800/40">
            <div>
              <div className="text-xs font-bold text-amber-100">Sound Effects</div>
              <div className="text-[10px] sm:text-[11px] text-amber-200/60">
                Card deals, chip clicks, knocks, and fanfare
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                soundEnabled
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  : 'bg-stone-900 text-stone-400 border-stone-700'
              }`}
            >
              {soundEnabled ? 'Enabled 🔊' : 'Muted 🔇'}
            </button>
          </div>

          {/* Reasoning Effort Selector */}
          <div className="p-3 bg-[#100703] rounded-xl border border-amber-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-amber-100">AI Thinking & Reasoning Effort</div>
              <span className="text-[10px] font-mono text-amber-400 uppercase font-black">
                {currentReasoning}
              </span>
            </div>
            <div className="text-[10px] text-amber-200/60">
              Control the depth of reasoning tokens for AI players (Default: Low)
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {(['none', 'low', 'medium', 'high'] as ReasoningEffort[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onUpdateSettings?.({ reasoningEffort: level })}
                  className={`py-1.5 rounded-lg text-xs font-bold border capitalize transition-all cursor-pointer ${
                    currentReasoning === level
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 border-amber-300 shadow font-black'
                      : 'bg-stone-900 text-stone-300 border-amber-800/40 hover:border-amber-600/60'
                  }`}
                >
                  {level === 'low' ? 'Low ★' : level}
                </button>
              ))}
            </div>
          </div>

          {/* Table Details */}
          <div className="p-3 bg-[#100703] rounded-xl border border-amber-800/40 space-y-2">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider font-saloon">
              Table Information
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <div className="text-stone-400">Blinds:</div>
              <div className="text-right text-amber-400 font-bold">
                ${state.settings.smallBlind} / ${state.settings.bigBlind}
              </div>
              <div className="text-stone-400">Timeout:</div>
              <div className="text-right text-amber-400 font-bold">30s limit</div>
              <div className="text-stone-400">Hands Played:</div>
              <div className="text-right text-stone-200 font-bold">{state.handCount}</div>
              <div className="text-stone-400">Players at Table:</div>
              <div className="text-right text-stone-200 font-bold">{state.players.length}</div>
            </div>
          </div>

          {/* Reset Current Hand */}
          <button
            onClick={() => {
              if (confirm('Re-deal the current hand from scratch?')) {
                onResetHand();
                onClose();
              }
            }}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-200/90 rounded-xl text-xs font-bold border border-amber-800/40 cursor-pointer transition-colors"
          >
            Re-deal Current Hand 🔄
          </button>

          {/* Leave Table Button */}
          <button
            onClick={() => {
              onClose();
              onLeaveTable();
            }}
            className="w-full py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-xl text-xs font-bold border border-rose-800/80 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>←</span>
            <span>Leave Table & Exit to Saloon Lobby</span>
          </button>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-amber-800/40">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer font-saloon uppercase"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
