import { TableState, Player } from '../poker/types';
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

export function buildAIPrompt(
  state: TableState,
  playerIndex: number,
  persona: AIPersona,
  memoryContext?: string
): { system: string; user: string } {
  const player = state.players[playerIndex];
  const validActions = getValidActions(state, playerIndex);
  const potOdds = calculatePotOdds(state, playerIndex);

  // Evaluate current hand strength
  const allCards = [...player.cards, ...state.communityCards];
  const evaluation = evaluateHand(allCards);

  const holeCardsStr = player.cards.map(formatCard).join(' ');
  const communityCardsStr =
    state.communityCards.length > 0
      ? state.communityCards.map(formatCard).join(' ')
      : 'None (Pre-flop)';

  const otherPlayersInfo = state.players.map((p, idx) => {
    const isDealer = idx === state.dealerIndex ? ' [DEALER]' : '';
    const isSB = idx === state.smallBlindIndex ? ' [SB]' : '';
    const isBB = idx === state.bigBlindIndex ? ' [BB]' : '';
    const status = p.hasFolded ? 'FOLDED' : p.isAllIn ? 'ALL-IN' : 'ACTIVE';
    return `- ${p.name}${isDealer}${isSB}${isBB}: Chips $${p.chips}, Current Bet $${p.currentBet}, Status: ${status}`;
  });

  const recentHistory = state.history.slice(0, 8).join('\n');

  const system = `${persona.systemPrompt}

You are competing in a real Texas Hold'em game.
CRITICAL RULES FOR DECISION:
1. You must respond ONLY with a valid JSON object matching the schema below. No Markdown wrapping, no extra prose outside the JSON.
2. Valid action types are:
   - "FOLD" (only if facing a bet you do not want to call)
   - "CHECK" (only allowed if canCheck is true: current bet to call is 0)
   - "CALL" (only allowed if canCall is true, pays callAmount: $${validActions.callAmount})
   - "BET" (only allowed if canBet is true, amount between $${validActions.minBet} and $${validActions.maxBet})
   - "RAISE" (only allowed if canRaise is true, amount between $${validActions.minRaise} and $${validActions.maxRaise})
   - "ALL_IN" (wagers all remaining chips: $${player.chips})
3. If canCheck is true, DO NOT FOLD unless you want to forfeit for no reason. Checking is free!
4. Strictly respect chip limits and minimum/maximum bets.
5. Analyze the PERSISTED TABLE MEMORY to read opponent tendencies, identify aggressive or passive behaviors, and exploit their play styles.

JSON SCHEMA:
{
  "action": "FOLD" | "CHECK" | "CALL" | "BET" | "RAISE" | "ALL_IN",
  "amount": number,
  "confidence": number between 0 and 1,
  "internal_reasoning": "brief 1-2 sentence poker logic in character",
  "table_talk": "short 1 sentence dialogue spoken out loud to opponents in character"
}`;

  const user = `CURRENT TABLE STATE:
- Your Name: ${player.name}
- Your Hole Cards: [ ${holeCardsStr} ]
- Community Board: [ ${communityCardsStr} ]
- Current Street: ${state.phase}
- Your Hand Strength: ${evaluation.description}
- Main Pot Size: $${state.mainPot}
- Current Highest Bet on Table: $${state.currentHighestBet}
- Your Current Bet This Round: $${player.currentBet}
- Amount Needed To Call: $${validActions.callAmount}
- Pot Odds: Need $${potOdds.toCall} to win pot of $${potOdds.totalPot} (${potOdds.oddsPercent}% required equity)
- Your Remaining Chips: $${player.chips}

VALID ACTIONS AVAILABLE TO YOU:
- canCheck: ${validActions.canCheck}
- canCall: ${validActions.canCall} (Amount: $${validActions.callAmount})
- canBet: ${validActions.canBet} (Min: $${validActions.minBet}, Max: $${validActions.maxBet})
- canRaise: ${validActions.canRaise} (Min: $${validActions.minRaise}, Max: $${validActions.maxRaise})
- canFold: ${validActions.canFold}

PLAYERS AT TABLE:
${otherPlayersInfo.join('\n')}

RECENT TABLE ACTIONS:
${recentHistory}
${memoryContext ? `\n--- PERSISTED TABLE MEMORY & OPPONENT PROFILING ---\n${memoryContext}\n` : ''}
Decide your action now as JSON.`;

  return { system, user };
}
