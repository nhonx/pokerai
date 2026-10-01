import { TableState } from '../poker/types';
import { getValidActions } from '../poker/engine';
import { evaluateHand } from '../poker/evaluator';
import { AIPersona, AI_PERSONAS } from './personas';
import { AIDecisionOutput } from './prompt';

/**
 * Deterministic / heuristic AI decision maker.
 * Used when OpenRouter API key is not provided or as a reliable fallback on API error/timeout.
 */
export function getLocalFallbackDecision(
  state: TableState,
  playerIndex: number,
  persona: AIPersona = AI_PERSONAS.shark
): AIDecisionOutput {
  const player = state.players[playerIndex];
  const valid = getValidActions(state, playerIndex);
  const cards = [...player.cards, ...state.communityCards];
  const handEval = evaluateHand(cards);

  // Score from 1 to 10
  const scoreCategory = handEval.categoryScore;

  // Pick random quote from persona
  const quote = persona.sampleQuotes[Math.floor(Math.random() * persona.sampleQuotes.length)];

  // If check is available:
  if (valid.canCheck) {
    // Bet if we have good hand or if persona is aggressive and wants to bet/bluff
    const wantToBet =
      valid.canBet &&
      (scoreCategory >= 3 || Math.random() < persona.aggressionFactor * 0.4);

    if (wantToBet) {
      // Sizing based on persona
      const fraction = persona.id === 'gto' ? 0.33 : persona.id === 'gambler' ? 0.75 : 0.5;
      const betSize = Math.max(
        valid.minBet,
        Math.min(valid.maxBet, Math.round(state.mainPot * fraction))
      );

      return {
        action: 'BET',
        amount: betSize,
        confidence: 0.75,
        internal_reasoning: `Value betting with ${handEval.description} according to ${persona.archetype} strategy.`,
        table_talk: quote,
      };
    }

    return {
      action: 'CHECK',
      amount: 0,
      confidence: 0.8,
      internal_reasoning: `Checking to see next card with ${handEval.description}.`,
      table_talk: quote,
    };
  }

  // Facing a bet: we can CALL, RAISE, or FOLD
  const callRatio = valid.callAmount / Math.max(1, state.mainPot);

  // Strong hand (Two Pair or better)
  if (scoreCategory >= 3) {
    if (valid.canRaise && Math.random() < persona.aggressionFactor) {
      const raiseAmt = Math.min(
        valid.maxRaise,
        valid.minRaise + Math.round(state.mainPot * 0.5)
      );
      return {
        action: 'RAISE',
        amount: raiseAmt,
        confidence: 0.9,
        internal_reasoning: `Strong hand (${handEval.description}), raising for value.`,
        table_talk: quote,
      };
    }

    if (valid.canCall) {
      return {
        action: 'CALL',
        amount: valid.callAmount,
        confidence: 0.85,
        internal_reasoning: `Calling with good hand (${handEval.description}).`,
        table_talk: quote,
      };
    }
  }

  // Medium hand (One Pair)
  if (scoreCategory === 2) {
    if (callRatio <= 0.4 || persona.id === 'station') {
      return {
        action: 'CALL',
        amount: valid.callAmount,
        confidence: 0.6,
        internal_reasoning: `Pot odds are fair for pair (${handEval.description}), calling.`,
        table_talk: quote,
      };
    }
  }

  // Weak hand (High Card)
  // Calling stations or gamblers might call anyway or bluff
  if (persona.id === 'gambler' && Math.random() < persona.bluffFrequency && valid.canRaise) {
    return {
      action: 'RAISE',
      amount: valid.minRaise,
      confidence: 0.5,
      internal_reasoning: `Bluffing with high card to attack weakness.`,
      table_talk: quote,
    };
  }

  if (persona.id === 'station' && callRatio < 0.2 && valid.canCall) {
    return {
      action: 'CALL',
      amount: valid.callAmount,
      confidence: 0.4,
      internal_reasoning: `Cheap enough to chase, calling.`,
      table_talk: quote,
    };
  }

  // Default: Fold when facing a bet with weak hand
  return {
    action: 'FOLD',
    amount: 0,
    confidence: 0.7,
    internal_reasoning: `Hand strength (${handEval.description}) does not justify the call amount of $${valid.callAmount}.`,
    table_talk: "I'll let you have this one.",
  };
}
