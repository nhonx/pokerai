import { TableState } from '../poker/types';
import { formatCard } from '../poker/deck';
import { evaluateHand } from '../poker/evaluator';
import { getValidActions, calculatePotOdds } from '../poker/engine';
import { AIPersona } from './personas';

export interface AIDecisionOutput {
  action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN';
  amount: number;
  confidence: number;
  internal_reasoning: string;
  table_talk: string;
}

/**
 * Builds a fair, compact, and token-optimized prompt for AI poker players.
 * Treats AI like a human player sitting at a live table:
 * Only public table information, private hole cards, and previous hand logs are provided.
 */
export function buildAIPrompt(
  state: TableState,
  playerIndex: number,
  persona: AIPersona,
  previousRoundsSummary?: string
): { system: string; user: string } {
  const player = state.players[playerIndex];
  const validActions = getValidActions(state, playerIndex);
  const potOdds = calculatePotOdds(state, playerIndex);

  // Evaluate current hand strength
  const allCards = [...player.cards, ...state.communityCards];
  const evaluation = evaluateHand(allCards);

  const holeCardsStr = player.cards.map(formatCard).join(' ') || 'None';
  const boardCardsStr =
    state.communityCards.length > 0
      ? state.communityCards.map(formatCard).join(' ')
      : 'None (Pre-flop)';

  // Clean table players list (public information visible to anyone at the table)
  const playersList = state.players
    .map((p, idx) => {
      const pos =
        idx === state.dealerIndex
          ? ' [D]'
          : idx === state.smallBlindIndex
          ? ' [SB]'
          : idx === state.bigBlindIndex
          ? ' [BB]'
          : '';
      const isYou = idx === playerIndex ? ' (YOU)' : '';
      const status = p.hasFolded ? 'Folded' : p.isAllIn ? 'All-In' : 'Active';
      return `${p.name}${pos}${isYou}: $${p.chips} chips, bet $${p.currentBet} [${status}]`;
    })
    .join('\n');

  // Allowed actions summary
  const allowedList: string[] = [];
  if (validActions.canCheck) allowedList.push('CHECK ($0)');
  if (validActions.canCall) allowedList.push(`CALL ($${validActions.callAmount})`);
  if (validActions.canBet) allowedList.push(`BET ($${validActions.minBet}-$${validActions.maxBet})`);
  if (validActions.canRaise) allowedList.push(`RAISE ($${validActions.minRaise}-$${validActions.maxRaise})`);
  if (validActions.canFold) allowedList.push('FOLD');
  allowedList.push(`ALL_IN ($${player.chips})`);

  // Recent hand actions (last 6 table events)
  const recentActions = state.history.slice(0, 6).join(' | ');

  const system = `You are ${player.name}, a Texas Hold'em player with a ${persona.archetype} style.
Persona: ${persona.styleDescription}
RULES:
1. Fast response required. Do NOT write chain-of-thought, internal monologue, or markdown code blocks.
2. Return ONLY a single raw JSON object matching:
{"action":"FOLD"|"CHECK"|"CALL"|"BET"|"RAISE"|"ALL_IN","amount":number,"confidence":number,"internal_reasoning":"1 short sentence","table_talk":"1 witty in-character sentence"}`;

  const user = `TABLE STATUS:
Hand #${state.handCount} | Street: ${state.phase} | Pot: $${state.mainPot} | Current Bet: $${state.currentHighestBet}
Your Cards: [${holeCardsStr}] (${evaluation.description})
Board: [${boardCardsStr}]
Your Chips: $${player.chips} | To Call: $${validActions.callAmount} (Pot Odds: ${potOdds.oddsPercent}%)
Allowed Actions: ${allowedList.join(', ')}

Players:
${playersList}

Recent Table Log:
${recentActions || 'Hand started.'}
${previousRoundsSummary ? `\nPrevious Rounds:\n${previousRoundsSummary}` : ''}

Respond with JSON decision:`;

  return { system, user };
}
