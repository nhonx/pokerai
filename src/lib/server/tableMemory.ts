import fs from 'fs';
import path from 'path';
import { TableState, Player, PlayerAction } from '../poker/types';

/**
 * Returns safe filesystem path for a table under workspace /inprogress/<tableId>/
 */
export function getTableDir(tableId: string): string {
  const safeId = tableId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(process.cwd(), 'inprogress', safeId);
}

/**
 * Ensures table directory exists
 */
export function ensureTableDir(tableId: string): string {
  const dir = getTableDir(tableId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Clean filename from player/model name
 */
export function getSafePlayerFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

export interface PlayerStats {
  id: string;
  name: string;
  isAI: boolean;
  handsPlayed: number;
  folds: number;
  checks: number;
  calls: number;
  bets: number;
  raises: number;
  allIns: number;
  totalChipsWon: number;
  totalChipsLost: number;
}

/**
 * Persists high-level table history and updates behavioral profiling in inprogress/<tableId>/
 */
export function recordTableStateToFile(state: TableState): void {
  try {
    const dir = ensureTableDir(state.id);
    const historyPath = path.join(dir, 'history.txt');
    const behaviorPath = path.join(dir, 'player_behavior.txt');
    const statsJsonPath = path.join(dir, 'player_stats.json');

    // 1. Write or update history.txt with recent entries
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const recentHistoryLines = state.history.slice(0, 15).reverse();
    const formattedHistory = `=== TABLE: ${state.id} | HAND #${state.handCount} | UPDATED: ${timestamp} ===\n` +
      `Community Cards: [ ${state.communityCards.map((c) => `${c.rank}${c.suit}`).join(' ') || 'None'} ]\n` +
      `Main Pot: $${state.mainPot} | Current Bet: $${state.currentHighestBet}\n` +
      `Players: ${state.players.map((p) => `${p.name} ($${p.chips}${p.hasFolded ? ', Folded' : ''})`).join(' | ')}\n\n` +
      `--- RECENT ACTIONS ---\n` +
      recentHistoryLines.map((line) => `[${timestamp}] ${line}`).join('\n') +
      '\n\n';

    fs.writeFileSync(historyPath, formattedHistory, { encoding: 'utf-8' });

    // 2. Load existing stats or initialize
    let statsRecord: Record<string, PlayerStats> = {};
    if (fs.existsSync(statsJsonPath)) {
      try {
        statsRecord = JSON.parse(fs.readFileSync(statsJsonPath, 'utf-8'));
      } catch {
        statsRecord = {};
      }
    }

    state.players.forEach((p) => {
      if (!statsRecord[p.id]) {
        statsRecord[p.id] = {
          id: p.id,
          name: p.name,
          isAI: p.isAI,
          handsPlayed: state.handCount,
          folds: 0,
          checks: 0,
          calls: 0,
          bets: 0,
          raises: 0,
          allIns: 0,
          totalChipsWon: 0,
          totalChipsLost: 0,
        };
      }

      const st = statsRecord[p.id];
      if (p.lastAction) {
        if (p.lastAction.type === 'FOLD') st.folds++;
        if (p.lastAction.type === 'CHECK') st.checks++;
        if (p.lastAction.type === 'CALL') st.calls++;
        if (p.lastAction.type === 'BET') st.bets++;
        if (p.lastAction.type === 'RAISE') st.raises++;
        if (p.lastAction.type === 'ALL_IN') st.allIns++;
      }
    });

    fs.writeFileSync(statsJsonPath, JSON.stringify(statsRecord, null, 2), { encoding: 'utf-8' });

    // 3. Format player behavior summary text
    let behaviorSummary = `=== PLAYER PROFILING & MEMORY CONTEXT ===\n`;
    Object.values(statsRecord).forEach((st) => {
      const totalActions = st.folds + st.checks + st.calls + st.bets + st.raises + st.allIns;
      const aggFactor = totalActions > 0 ? Math.round(((st.bets + st.raises + st.allIns) / totalActions) * 100) : 0;
      const foldFactor = totalActions > 0 ? Math.round((st.folds / totalActions) * 100) : 0;
      const callFactor = totalActions > 0 ? Math.round((st.calls / totalActions) * 100) : 0;

      let style = 'Neutral';
      if (aggFactor > 50) style = 'Aggressive / Pressure player';
      else if (callFactor > 40) style = 'Passive / Calling Station';
      else if (foldFactor > 40) style = 'Tight / Cautious';

      behaviorSummary += `- ${st.name} (${st.isAI ? 'AI' : 'Human'}): Style: ${style} | Aggression: ${aggFactor}% | Calls: ${st.calls} | Raises: ${st.raises + st.bets} | Folds: ${st.folds}\n`;
    });

    fs.writeFileSync(behaviorPath, behaviorSummary, { encoding: 'utf-8' });
  } catch (err) {
    console.error('Error writing table memory to disk:', err);
  }
}

/**
 * Loads the persisted memory context for a table to inject into LLM prompts.
 */
export function getTableMemoryContext(tableId: string): string {
  try {
    const dir = getTableDir(tableId);
    let memoryText = '';

    const behaviorPath = path.join(dir, 'player_behavior.txt');
    if (fs.existsSync(behaviorPath)) {
      memoryText += fs.readFileSync(behaviorPath, 'utf-8') + '\n';
    }

    const historyPath = path.join(dir, 'history.txt');
    if (fs.existsSync(historyPath)) {
      memoryText += fs.readFileSync(historyPath, 'utf-8');
    }

    return memoryText.trim();
  } catch (err) {
    console.warn('Could not read table memory context:', err);
    return '';
  }
}

export interface AIDecisionTraceData {
  timestamp: string;
  tableId: string;
  handCount: number;
  street: string;
  player: Player;
  modelUsed: string;
  systemPrompt: string;
  userPrompt: string;
  httpStatus?: number;
  latencyMs?: number;
  rawResponse?: string;
  parsedDecision?: any;
  error?: string;
  isFallback: boolean;
}

/**
 * Logs an AI player's OpenRouter request, raw response, and decision to a dedicated log file.
 */
export function logAIDecisionToFile(trace: AIDecisionTraceData): void {
  try {
    const dir = ensureTableDir(trace.tableId);
    const safePlayerName = getSafePlayerFileName(trace.player.name);
    const logFilePath = path.join(dir, `${safePlayerName}.log`);

    const logBlock =
      `================================================================================\n` +
      `[TIMESTAMP]: ${trace.timestamp}\n` +
      `[PLAYER]: ${trace.player.name} (ID: ${trace.player.id})\n` +
      `[MODEL]: ${trace.modelUsed}\n` +
      `[TABLE]: ${trace.tableId} | HAND #${trace.handCount} | STREET: ${trace.street}\n` +
      `[FALLBACK MODE]: ${trace.isFallback ? 'YES (Local Heuristic)' : 'NO (OpenRouter API)'}\n` +
      (trace.httpStatus ? `[HTTP STATUS]: ${trace.httpStatus} (Latency: ${trace.latencyMs}ms)\n` : '') +
      `--------------------------------------------------------------------------------\n` +
      `[PROMPT SENT TO MODEL]:\n` +
      `-- SYSTEM --\n${trace.systemPrompt}\n\n` +
      `-- USER --\n${trace.userPrompt}\n` +
      `--------------------------------------------------------------------------------\n` +
      (trace.rawResponse
        ? `[RAW MODEL RESPONSE]:\n${trace.rawResponse}\n--------------------------------------------------------------------------------\n`
        : '') +
      (trace.error
        ? `[ERROR / WARNING]:\n${trace.error}\n--------------------------------------------------------------------------------\n`
        : '') +
      `[PARSED DECISION]:\n${JSON.stringify(trace.parsedDecision, null, 2)}\n` +
      `================================================================================\n\n`;

    fs.appendFileSync(logFilePath, logBlock, { encoding: 'utf-8' });
  } catch (err) {
    console.error('Failed to write AI decision log to disk:', err);
  }
}
