import { createDeck, shuffleDeck, parseCard } from '../src/lib/poker/deck';
import { evaluateHand, compareHands } from '../src/lib/poker/evaluator';
import { calculatePots, resolvePots } from '../src/lib/poker/pot';
import {
  createInitialTable,
  startNewHand,
  applyAction,
  getValidActions,
  DEFAULT_SETTINGS,
} from '../src/lib/poker/engine';
import { getLocalFallbackDecision } from '../src/lib/ai/fallback';
import { AI_PERSONAS } from '../src/lib/ai/personas';
import { Card, Player } from '../src/lib/poker/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- 1. Testing Deck Creation & Shuffle ---');
const deck = createDeck();
assert(deck.length === 52, `Deck should have 52 cards, got ${deck.length}`);
const shuffled = shuffleDeck(deck);
assert(shuffled.length === 52, 'Shuffled deck should have 52 cards');
const uniqueCards = new Set(shuffled.map((c) => `${c.rank}${c.suit}`));
assert(uniqueCards.size === 52, 'All 52 cards must be unique');
console.log('✓ Deck & shuffle passed');

console.log('--- 2. Testing Hand Evaluation Categories ---');
const royalFlushCards: Card[] = [
  { rank: 'A', suit: '♠', value: 14 },
  { rank: 'K', suit: '♠', value: 13 },
  { rank: 'Q', suit: '♠', value: 12 },
  { rank: 'J', suit: '♠', value: 11 },
  { rank: '10', suit: '♠', value: 10 },
  { rank: '2', suit: '♦', value: 2 },
  { rank: '3', suit: '♣', value: 3 },
];
const rfEval = evaluateHand(royalFlushCards);
assert(rfEval.category === 'ROYAL_FLUSH', `Expected ROYAL_FLUSH, got ${rfEval.category}`);

// Wheel straight (A, 2, 3, 4, 5)
const wheelCards: Card[] = [
  { rank: 'A', suit: '♠', value: 14 },
  { rank: '2', suit: '♦', value: 2 },
  { rank: '3', suit: '♣', value: 3 },
  { rank: '4', suit: '♥', value: 4 },
  { rank: '5', suit: '♠', value: 5 },
  { rank: 'K', suit: '♦', value: 13 },
  { rank: '9', suit: '♣', value: 9 },
];
const wheelEval = evaluateHand(wheelCards);
assert(wheelEval.category === 'STRAIGHT', `Expected STRAIGHT for wheel, got ${wheelEval.category}`);
assert(wheelEval.description.includes('Five High'), `Expected Five High straight, got ${wheelEval.description}`);

// Full House vs Flush
const fullHouseCards: Card[] = [
  { rank: 'K', suit: '♠', value: 13 },
  { rank: 'K', suit: '♦', value: 13 },
  { rank: 'K', suit: '♣', value: 13 },
  { rank: '10', suit: '♥', value: 10 },
  { rank: '10', suit: '♠', value: 10 },
  { rank: '2', suit: '♦', value: 2 },
  { rank: '4', suit: '♣', value: 4 },
];
const flushCards: Card[] = [
  { rank: 'A', suit: '♥', value: 14 },
  { rank: 'J', suit: '♥', value: 11 },
  { rank: '9', suit: '♥', value: 9 },
  { rank: '6', suit: '♥', value: 6 },
  { rank: '2', suit: '♥', value: 2 },
  { rank: 'K', suit: '♠', value: 13 },
  { rank: 'Q', suit: '♦', value: 12 },
];
const fhEval = evaluateHand(fullHouseCards);
const flEval = evaluateHand(flushCards);
assert(fhEval.category === 'FULL_HOUSE', 'Should be FULL_HOUSE');
assert(flEval.category === 'FLUSH', 'Should be FLUSH');
assert(compareHands(fhEval, flEval) > 0, 'Full House should beat Flush');

// Kicker comparison: Pair of Aces with King vs Pair of Aces with Queen
const pairWithKing: Card[] = [
  { rank: 'A', suit: '♠', value: 14 },
  { rank: 'A', suit: '♦', value: 14 },
  { rank: 'K', suit: '♣', value: 13 },
  { rank: '8', suit: '♥', value: 8 },
  { rank: '4', suit: '♠', value: 4 },
];
const pairWithQueen: Card[] = [
  { rank: 'A', suit: '♥', value: 14 },
  { rank: 'A', suit: '♣', value: 14 },
  { rank: 'Q', suit: '♦', value: 12 },
  { rank: '8', suit: '♠', value: 8 },
  { rank: '4', suit: '♦', value: 4 },
];
const evalK = evaluateHand(pairWithKing);
const evalQ = evaluateHand(pairWithQueen);
assert(compareHands(evalK, evalQ) > 0, 'Pair of Aces with King kicker must beat Queen kicker');
console.log('✓ Hand evaluation & kicker tie-breaking passed');

console.log('--- 3. Testing Pot & Side Pot Math ---');
const mockPlayers: Player[] = [
  {
    id: 'p1',
    name: 'Player 1 (Short Stack)',
    avatar: '👤',
    isAI: false,
    chips: 0,
    currentBet: 50,
    totalHandBet: 50,
    cards: [],
    hasFolded: false,
    isAllIn: true,
    isSittingOut: false,
  },
  {
    id: 'p2',
    name: 'Player 2 (Mid Stack)',
    avatar: '🤖',
    isAI: true,
    chips: 0,
    currentBet: 150,
    totalHandBet: 150,
    cards: [],
    hasFolded: false,
    isAllIn: true,
    isSittingOut: false,
  },
  {
    id: 'p3',
    name: 'Player 3 (Deep Stack)',
    avatar: '🤠',
    isAI: true,
    chips: 500,
    currentBet: 150,
    totalHandBet: 150,
    cards: [],
    hasFolded: false,
    isAllIn: false,
    isSittingOut: false,
  },
];

const calculatedPots = calculatePots(mockPlayers);
// Main pot: 50 * 3 = 150 (all 3 players eligible)
// Side pot 1: (150 - 50) * 2 = 200 (p2 and p3 eligible)
assert(calculatedPots.length === 2, `Expected 2 pots, got ${calculatedPots.length}`);
assert(calculatedPots[0].amount === 150, `Main pot should be 150, got ${calculatedPots[0].amount}`);
assert(calculatedPots[0].eligiblePlayerIds.length === 3, 'Main pot should have 3 eligible players');
assert(calculatedPots[1].amount === 200, `Side pot should be 200, got ${calculatedPots[1].amount}`);
assert(calculatedPots[1].eligiblePlayerIds.length === 2, 'Side pot should have 2 eligible players');
console.log('✓ Pot and side pot calculation passed');

console.log('--- 4. Testing Table Game State Progression ---');
let state = createInitialTable(DEFAULT_SETTINGS);
assert(state.phase === 'IDLE', 'Initial state should be IDLE');

state = startNewHand(state);
assert(state.phase === 'PRE_FLOP', 'Phase should be PRE_FLOP after startNewHand');
assert(state.mainPot === state.settings.smallBlind + state.settings.bigBlind, 'Blinds should be in main pot');
assert(state.players[0].cards.length === 2, 'Hero should have 2 hole cards');
assert(state.players[1].cards.length === 2, 'AI 1 should have 2 hole cards');

const validActions = getValidActions(state, state.currentTurnIndex);
assert(validActions.canFold, 'Current turn should be able to fold');
assert(validActions.canCall, 'Current turn should be able to call pre-flop big blind');
console.log('✓ Game engine state progression passed');

console.log('--- 5. Testing AI Heuristic Fallback ---');
const aiDecision = getLocalFallbackDecision(state, 1, AI_PERSONAS.shark);
assert(
  ['FOLD', 'CHECK', 'CALL', 'BET', 'RAISE', 'ALL_IN'].includes(aiDecision.action),
  `Valid AI action expected, got ${aiDecision.action}`
);
assert(typeof aiDecision.table_talk === 'string', 'AI should provide table talk');
console.log(`✓ AI fallback decision: ${aiDecision.action} ("${aiDecision.table_talk}")`);

console.log('--- 6. Testing Out of Chips Handling & Player Elimination ---');
// Scenario A: AI Player busts out (0 chips)
const bustTable = createInitialTable({ ...DEFAULT_SETTINGS, numPlayers: 3 });
// Give player 2 zero chips
bustTable.players[2].chips = 0;
const handAfterAIBust = startNewHand(bustTable);
assert(
  !handAfterAIBust.players.some((p) => p.id === bustTable.players[2].id),
  'Busted AI player must be completely excluded from the table'
);
assert(handAfterAIBust.players.length === 2, 'Table should resize to 2 players after AI elimination');
console.log('✓ Busted AI player excluded and table resized');

// Scenario B: Human Player runs out of chips
const humanBustTable = createInitialTable(DEFAULT_SETTINGS);
humanBustTable.players[0].chips = 0;
const handAfterHumanBust = startNewHand(humanBustTable);
assert(
  handAfterHumanBust.statusMessage.includes('out of chips'),
  'Should indicate human is out of chips'
);
assert(handAfterHumanBust.phase === 'HAND_OVER', 'Phase should remain HAND_OVER when human is out of chips');
console.log('✓ Human out-of-chips condition properly handled');

// Scenario C: Human eliminates all AI players
const winTable = createInitialTable({ ...DEFAULT_SETTINGS, numPlayers: 3 });
winTable.players[1].chips = 0;
winTable.players[2].chips = 0;
const championState = startNewHand(winTable);
assert(
  championState.statusMessage.includes('Tournament Champion'),
  'Should declare tournament champion when all AI players are eliminated'
);
console.log('✓ Tournament champion logic verified');

console.log('\n========================================');
console.log('🎉 ALL POKER ENGINE TESTS PASSED SUCCESSFULLY!');
console.log('========================================\n');
