'use client';

import React, { useState } from 'react';
import { TableState } from '@/lib/poker/types';

interface TableLogProps {
  state: TableState;
}

export const TableLog: React.FC<TableLogProps> = ({ state }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'AI_THOUGHTS'>('ACTIONS');

  const aiPlayersWithThoughts = state.players.filter((p) => p.isAI && p.thought);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen ? (
        <div className="w-80 md:w-96 h-80 bg-slate-950/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-xs">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('ACTIONS')}
                className={`font-bold px-2 py-0.5 rounded cursor-pointer ${
                  activeTab === 'ACTIONS'
                    ? 'text-amber-400 bg-amber-400/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Table Feed
              </button>
              <button
                onClick={() => setActiveTab('AI_THOUGHTS')}
                className={`font-bold px-2 py-0.5 rounded cursor-pointer ${
                  activeTab === 'AI_THOUGHTS'
                    ? 'text-purple-400 bg-purple-400/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AI Reasoning ({aiPlayersWithThoughts.length})
              </button>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer px-1"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono text-[11px]">
            {activeTab === 'ACTIONS' ? (
              state.history.map((msg, idx) => (
                <div
                  key={idx}
                  className={`py-1 border-b border-slate-900/80 ${
                    msg.includes('wins')
                      ? 'text-amber-400 font-bold'
                      : msg.includes('Street')
                      ? 'text-emerald-400 font-bold'
                      : msg.includes('Hand #')
                      ? 'text-blue-400 font-bold'
                      : 'text-slate-300'
                  }`}
                >
                  {msg}
                </div>
              ))
            ) : aiPlayersWithThoughts.length === 0 ? (
              <div className="text-slate-500 italic p-4 text-center">
                No AI internal thoughts recorded yet for this hand.
              </div>
            ) : (
              aiPlayersWithThoughts.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 bg-slate-900/80 border border-purple-500/20 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between text-purple-300 font-bold">
                    <span>{p.avatar} {p.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-purple-400">
                      {p.lastAction?.text || 'Thinking'}
                    </span>
                  </div>
                  <div className="text-slate-300 font-sans text-xs italic">
                    &ldquo;{p.thought}&rdquo;
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-full shadow-xl backdrop-blur-md text-xs font-mono font-bold cursor-pointer"
        >
          <span>📜</span>
          <span>Table Feed</span>
        </button>
      )}
    </div>
  );
};
