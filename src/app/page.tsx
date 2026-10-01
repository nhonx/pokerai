'use client';

import React, { useState, useEffect } from 'react';
import { TableState } from '@/lib/poker/types';
import { createCustomTable, CreateTableOptions } from '@/lib/poker/engine';
import { Lobby } from '@/components/poker/Lobby';
import { PokerTable } from '@/components/poker/PokerTable';

export default function Home() {
  const [view, setView] = useState<'LOADING' | 'LOBBY' | 'TABLE'>('LOADING');
  const [activeTable, setActiveTable] = useState<TableState | null>(null);

  // Initialize and check localStorage for existing active table
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('pokerai_active_table');
        if (stored) {
          const parsed = JSON.parse(stored) as TableState;
          if (parsed && parsed.players && parsed.players.length > 0) {
            setActiveTable(parsed);
          }
        }
      } catch (err) {
        console.warn('Could not parse stored table state from localStorage:', err);
      }
      // Always start in the lobby as requested ("When enter the app, start with empty lobby...")
      setView('LOBBY');
    }
  }, []);

  // Handle table creation from lobby
  const handleCreateTable = (options: CreateTableOptions) => {
    const newTable = createCustomTable(options);
    setActiveTable(newTable);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pokerai_active_table', JSON.stringify(newTable));
    }
    setView('TABLE');
  };

  // Resume existing table from lobby
  const handleResumeTable = () => {
    if (activeTable) {
      setView('TABLE');
    }
  };

  // Discard saved table
  const handleDiscardSavedTable = () => {
    setActiveTable(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pokerai_active_table');
    }
  };

  // Exit table back to lobby
  const handleLeaveTable = () => {
    setView('LOBBY');
  };

  // Table state updates while playing
  const handleStateChange = (updatedState: TableState) => {
    setActiveTable(updatedState);
  };

  if (view === 'LOADING') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 font-mono text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Entering Casino Lobby...</span>
        </div>
      </div>
    );
  }

  if (view === 'TABLE' && activeTable) {
    return (
      <PokerTable
        key={activeTable.id}
        initialState={activeTable}
        onLeaveTable={handleLeaveTable}
        onStateChange={handleStateChange}
      />
    );
  }

  return (
    <Lobby
      savedTable={activeTable}
      onResumeTable={handleResumeTable}
      onDiscardSavedTable={handleDiscardSavedTable}
      onCreateTable={handleCreateTable}
    />
  );
}
