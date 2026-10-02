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
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40">
      {isOpen ? (
        <div className="w-76 sm:w-88 md:w-96 h-76 sm:h-84 bg-[#170a04]/95 border-2 border-amber-700/60 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-xs">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-amber-800/40 bg-[#120703]/80">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setActiveTab('ACTIONS')}
                className={`font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeTab === 'ACTIONS'
                    ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40'
                    : 'text-amber-200/60 hover:text-amber-100'
                }`}
              >
                Table Feed
              </button>
              <button
                onClick={() => setActiveTab('AI_THOUGHTS')}
                className={`font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeTab === 'AI_THOUGHTS'
                    ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40'
                    : 'text-amber-200/60 hover:text-amber-100'
                }`}
              >
                AI Reasoning ({aiPlayersWithThoughts.length})
              </button>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-amber-400 hover:text-amber-200 cursor-pointer px-1.5 font-bold"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1.5 font-mono text-[10px] sm:text-[11px]">
            {activeTab === 'ACTIONS' ? (
              state.history.map((msg, idx) => (
                <div
                  key={idx}
                  className={`py-1 border-b border-amber-900/30 ${
                    msg.includes('wins')
                      ? 'text-amber-300 font-bold'
                      : msg.includes('Street')
                      ? 'text-emerald-400 font-bold'
                      : msg.includes('Hand #')
                      ? 'text-blue-300 font-bold'
                      : 'text-stone-300'
                  }`}
                >
                  {msg}
                </div>
              ))
            ) : aiPlayersWithThoughts.length === 0 ? (
              <div className="text-amber-200/50 italic p-4 text-center">
                No AI internal thoughts recorded yet for this hand.
              </div>
            ) : (
              aiPlayersWithThoughts.map((p) => (
                <div
                  key={p.id}
                  className="p-2 sm:p-2.5 bg-[#120703]/90 border border-amber-600/30 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>
                      {p.avatar} {p.name}
                    </span>
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-400/80">
                      {p.lastAction?.text || 'Thinking'}
                    </span>
                  </div>
                  <div className="text-stone-200 font-sans text-xs italic">
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
          className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-[#1b0d06]/90 hover:bg-[#251309] text-amber-300 border border-amber-600/40 rounded-full shadow-xl backdrop-blur-md text-[11px] sm:text-xs font-mono font-bold cursor-pointer active:scale-95 transition-all"
        >
          <span>📜</span>
          <span>Feed</span>
        </button>
      )}
    </div>
  );
};
