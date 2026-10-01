'use client';

import React, { useState } from 'react';
import { TableState } from '@/lib/poker/types';
import { sounds } from '@/lib/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TableState;
  onLeaveTable: () => void;
  onResetHand: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  onLeaveTable,
  onResetHand,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sounds.enabled);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-lg font-bold text-amber-400">Table Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 py-4">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">Sound Effects</div>
              <div className="text-[11px] text-slate-400">Card deals, chip clicks, knocks, and fanfare</div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {soundEnabled ? 'Enabled 🔊' : 'Muted 🔇'}
            </button>
          </div>

          {/* Table Details */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Table Information
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="text-slate-400">Blinds:</div>
              <div className="text-right text-amber-400 font-bold">
                ${state.settings.smallBlind} / ${state.settings.bigBlind}
              </div>
              <div className="text-slate-400">Hands Played:</div>
              <div className="text-right text-slate-200 font-bold">{state.handCount}</div>
              <div className="text-slate-400">Players at Table:</div>
              <div className="text-right text-slate-200 font-bold">{state.players.length}</div>
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
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
          >
            Re-deal Current Hand 🔄
          </button>

          {/* Leave Table Button */}
          <button
            onClick={() => {
              onClose();
              onLeaveTable();
            }}
            className="w-full py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-xl text-xs font-bold border border-rose-800/80 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>←</span>
            <span>Leave Table & Exit to Lobby</span>
          </button>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
