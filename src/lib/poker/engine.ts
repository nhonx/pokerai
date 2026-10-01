import {
  TableState,
  Player,
  PlayerAction,
  PlayerActionType,
  Card,
  GameSettings,
  HandResult,
  HandEvaluation,
} from './types';
import { createDeck, shuffleDeck } from './deck';
import { evaluateHand } from './evaluator';
import { calculatePots, resolvePots } from './pot';
import { ALL_MODELS, RECOMMENDED_MODELS } from '../ai/models';

export const DEFAULT_SETTINGS: GameSettings = {
  smallBlind: 10,
  bigBlind: 20,
  startingChips: 1000,
  numPlayers: 4,
  model: 'backend-managed',
  turnTimeoutSeconds: 30,
};

const AI_AVATARS = ['🤖', '⚡', '🧠', '💎', '🐋', '🔮', '🎭', '🦊', '🦅', '🦁'];
const AI_PERSONAS = ['shark', 'gto', 'gambler', 'station', 'rock'];

/**
 * Randomly picks distinct AI models from the available models list
 */
export function pickRandomAIModels(count: number) {
  const modelList = ALL_MODELS && ALL_MODELS.length > 0 ? ALL_MODELS : RECOMMENDED_MODELS;

  // Shuffle models to pick random models
  const shuffled = [...modelList].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((model, idx) => ({
    id: `ai-${Date.now()}-${idx}-${model.id.replace(/[^a-zA-Z0-9]/g, '-')}`,
    name: model.name, // Set name directly to its using model
    model: model.id,
    avatar: AI_AVATARS[idx % AI_AVATARS.length],
    personaId: AI_PERSONAS[idx % AI_PERSONAS.length],
  }));
}

export function getBackendAIRoster() {
  return pickRandomAIModels(5);
}

export const BACKEND_AI_ROSTER = getBackendAIRoster();

export interface CreateTableOptions {
  playerName?: string;
  numAIPlayers: number; // 1 to 5
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
}

export function createCustomTable(options: CreateTableOptions): TableState {
  const {
    playerName = 'Hero',
    numAIPlayers = 3,
    startingChips = 1000,
    smallBlind = 10,
    bigBlind = 20,
  } = options;

  const validNumAI = Math.max(1, Math.min(5, numAIPlayers));

  const humanPlayer: Player = {
    id: 'human',
    name: playerName.trim() || 'Hero',
    avatar: '👤',
    isAI: false,
    chips: startingChips,
    currentBet: 0,
    totalHandBet: 0,
    cards: [] as Card[],
    hasFolded: false,
    isAllIn: false,
    isSittingOut: false,
  };

  const randomAIs = pickRandomAIModels(validNumAI);
  const aiPlayers: Player[] = randomAIs.map((ai) => ({
    id: ai.id,
    name: ai.name,
    avatar: ai.avatar,
    isAI: true,
    model: ai.model,
    personaId: ai.personaId,
    chips: startingChips,
    currentBet: 0,
    totalHandBet: 0,
    cards: [] as Card[],
    hasFolded: false,
    isAllIn: false,
    isSittingOut: false,
  }));

  const allPlayers = [humanPlayer, ...aiPlayers];

  return {
    id: `table-${Date.now()}`,
    phase: 'IDLE',
    deck: [],
    communityCards: [],
    players: allPlayers,
    dealerIndex: 0,
    smallBlindIndex: 1,
    bigBlindIndex: allPlayers.length > 2 ? 2 : 1,
    currentTurnIndex: 0,
    currentHighestBet: 0,
    minRaiseAmount: bigBlind,
    mainPot: 0,
    sidePots: [],
    history: [`Table created with ${validNumAI} AI players (${aiPlayers.map((p) => p.name).join(', ')}).`],
    settings: {
      smallBlind,
      bigBlind,
      startingChips,
      numPlayers: allPlayers.length,
      model: 'backend-managed',
      turnTimeoutSeconds: 30,
    },
    handCount: 0,
    statusMessage: 'Ready to play! Click "Deal Hand" to begin.',
  };
}

export function createInitialTable(settings: GameSettings = DEFAULT_SETTINGS): TableState {
  return createCustomTable({
    numAIPlayers: Math.max(1, settings.numPlayers - 1),
    startingChips: settings.startingChips,
    smallBlind: settings.smallBlind,
    bigBlind: settings.bigBlind,
  });
}

/**
 * Returns next active player index clockwise from startingIndex.
 */
export function getNextActivePlayerIndex(players: Player[], fromIndex: number): number {
  const count = players.length;
  for (let i = 1; i <= count; i++) {
    const idx = (fromIndex + i) % count;
    const p = players[idx];
    if (!p.hasFolded && !p.isSittingOut && p.chips > 0 && !p.isAllIn) {
      return idx;
    }
  }
  return -1;
}

/**
 * Counts players still in hand (not folded, not sitting out).
 */
export function getActivePlayers(players: Player[]): Player[] {
  return players.filter((p) => !p.hasFolded && !p.isSittingOut);
}

/**
 * Counts players who can still make actions (not folded, not all-in).
 */
export function getActionablePlayers(players: Player[]): Player[] {
  return players.filter((p) => !p.hasFolded && !p.isSittingOut && !p.isAllIn && p.chips > 0);
}

/**
 * Starts a new hand.
 */
export function startNewHand(state: TableState): TableState {
  // Check if human player is out of chips
  const human = state.players.find((p) => !p.isAI);
  if (!human || human.chips <= 0) {
    return {
      ...state,
      phase: 'HAND_OVER',
      statusMessage: 'You are out of chips! Return to the lobby to start a new game.',
    };
  }

  // Identify busted AI players
  const bustedAIs = state.players.filter((p) => p.isAI && p.chips <= 0);
  const eliminatedLogs = bustedAIs.map((ai) => `${ai.name} was eliminated from the table (out of chips).`);

  // Exclude busted AI players completely from the table
  const survivingPlayers = state.players.filter((p) => (!p.isAI && p.chips > 0) || (p.isAI && p.chips > 0));

  // If only 1 player remains and it is the human, tournament won!
  if (survivingPlayers.length === 1 && !survivingPlayers[0].isAI) {
    return {
      ...state,
      players: survivingPlayers,
      phase: 'HAND_OVER',
      statusMessage: '🏆 Tournament Champion! You have eliminated all AI opponents!',
      history: ['🏆 Tournament Champion! You have eliminated all AI opponents!', ...eliminatedLogs, ...state.history],
    };
  }

  if (survivingPlayers.length < 2) {
    return {
      ...state,
      players: survivingPlayers,
      statusMessage: 'Not enough players with chips to start a new hand!',
    };
  }

  const players = survivingPlayers.map((p) => ({
    ...p,
    currentBet: 0,
    totalHandBet: 0,
    cards: [] as Card[],
    hasFolded: false,
    isAllIn: false,
    isSittingOut: false,
    lastAction: undefined,
    tableTalk: undefined,
    thought: undefined,
    showdownHand: undefined,
  }));

  // Advance dealer button across surviving players
  const dealerIndex = state.handCount === 0 ? 0 : (state.dealerIndex + 1) % players.length;

  // Determine blinds
  let sbIndex = (dealerIndex + 1) % players.length;
  let bbIndex = (dealerIndex + 2) % players.length;

  if (players.length === 2) {
    // In Heads-up, dealer is Small Blind
    sbIndex = dealerIndex;
    bbIndex = (dealerIndex + 1) % players.length;
  }

  // Deduct blinds
  const sbPlayer = players[sbIndex];
  const sbAmount = Math.min(sbPlayer.chips, state.settings.smallBlind);
  sbPlayer.chips -= sbAmount;
  sbPlayer.currentBet = sbAmount;
  sbPlayer.totalHandBet = sbAmount;
  sbPlayer.isAllIn = sbPlayer.chips === 0;

  const bbPlayer = players[bbIndex];
  const bbAmount = Math.min(bbPlayer.chips, state.settings.bigBlind);
  bbPlayer.chips -= bbAmount;
  bbPlayer.currentBet = bbAmount;
  bbPlayer.totalHandBet = bbAmount;
  bbPlayer.isAllIn = bbPlayer.chips === 0;

  // Shuffle and deal 2 cards to each active player
  let deck = shuffleDeck(createDeck());
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < players.length; i++) {
      if (!players[i].isSittingOut && deck.length > 0) {
        players[i].cards = [...players[i].cards, deck[0]];
        deck = deck.slice(1);
      }
    }
  }

  // First to act pre-flop is UTG (left of big blind), or dealer in heads-up
  const firstTurnIndex = players.length === 2 ? sbIndex : (bbIndex + 1) % players.length;

  const newHandCount = state.handCount + 1;
  const historyMsg = `--- Hand #${newHandCount} Started --- Blinds $${state.settings.smallBlind}/$${state.settings.bigBlind}`;

  return {
    ...state,
    phase: 'PRE_FLOP',
    deck,
    communityCards: [],
    players,
    dealerIndex,
    smallBlindIndex: sbIndex,
    bigBlindIndex: bbIndex,
    currentTurnIndex: firstTurnIndex,
    currentHighestBet: Math.max(sbAmount, bbAmount),
    minRaiseAmount: state.settings.bigBlind,
    mainPot: sbAmount + bbAmount,
    sidePots: calculatePots(players),
    history: [historyMsg, ...state.history],
    handCount: newHandCount,
    winners: undefined,
    statusMessage: `${players[firstTurnIndex].name}'s turn to act pre-flop.`,
  };
}

export interface ValidActionsInfo {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canBet: boolean;
  minBet: number;
  maxBet: number;
  canRaise: boolean;
  minRaise: number;
  maxRaise: number;
  isAllIn: boolean;
}

export function getValidActions(state: TableState, playerIndex: number): ValidActionsInfo {
  const player = state.players[playerIndex];
  if (!player || player.hasFolded || player.isAllIn || player.chips <= 0) {
    return {
      canFold: false,
      canCheck: false,
      canCall: false,
      callAmount: 0,
      canBet: false,
      minBet: 0,
      maxBet: 0,
      canRaise: false,
      minRaise: 0,
      maxRaise: 0,
      isAllIn: false,
    };
  }

  const callAmount = Math.max(0, state.currentHighestBet - player.currentBet);
  const canCheck = callAmount === 0;
  const canCall = callAmount > 0 && player.chips > 0;
  const effectiveCall = Math.min(callAmount, player.chips);

  const canBet = state.currentHighestBet === 0 && player.chips > 0;
  const minBet = Math.min(player.chips, state.settings.bigBlind);
  const maxBet = player.chips;

  const canRaise = state.currentHighestBet > 0 && player.chips > callAmount;
  const minRaise = Math.min(
    player.chips,
    state.currentHighestBet + Math.max(state.minRaiseAmount, state.settings.bigBlind) - player.currentBet
  );
  const maxRaise = player.chips;

  return {
    canFold: true,
    canCheck,
    canCall,
    callAmount: effectiveCall,
    canBet,
    minBet,
    maxBet,
    canRaise,
    minRaise,
    maxRaise,
    isAllIn: player.chips <= effectiveCall,
  };
}

/**
 * Advance to next street or showdown.
 */
function advanceStreet(state: TableState): TableState {
  let { phase, deck, communityCards, players, mainPot, dealerIndex } = state;

  // Reset players' current round bet to 0
  players = players.map((p) => ({
    ...p,
    currentBet: 0,
  }));

  const activePlayers = getActivePlayers(players);
  const actionablePlayers = getActionablePlayers(players);

  // If 1 or fewer players can act (others all-in or folded), deal remaining community cards and go straight to showdown
  if (actionablePlayers.length <= 1 && activePlayers.length > 1) {
    while (communityCards.length < 5 && deck.length > 0) {
      communityCards = [...communityCards, deck[0]];
      deck = deck.slice(1);
    }
    return executeShowdown({
      ...state,
      phase: 'SHOWDOWN',
      deck,
      communityCards,
      players,
      currentHighestBet: 0,
      minRaiseAmount: state.settings.bigBlind,
    });
  }

  if (phase === 'PRE_FLOP') {
    // Deal Flop (3 cards)
    communityCards = deck.slice(0, 3);
    deck = deck.slice(3);
    phase = 'FLOP';
  } else if (phase === 'FLOP') {
    // Deal Turn (1 card)
    communityCards = [...communityCards, deck[0]];
    deck = deck.slice(1);
    phase = 'TURN';
  } else if (phase === 'TURN') {
    // Deal River (1 card)
    communityCards = [...communityCards, deck[0]];
    deck = deck.slice(1);
    phase = 'RIVER';
  } else if (phase === 'RIVER') {
    // Showdown!
    return executeShowdown({
      ...state,
      phase: 'SHOWDOWN',
      deck,
      communityCards,
      players,
      currentHighestBet: 0,
      minRaiseAmount: state.settings.bigBlind,
    });
  }

  // First turn post-flop is first active player after dealer
  let nextTurn = (dealerIndex + 1) % players.length;
  if (players[nextTurn].hasFolded || players[nextTurn].isAllIn || players[nextTurn].chips <= 0) {
    nextTurn = getNextActivePlayerIndex(players, dealerIndex);
  }

  const phaseMsg = `[Street] Dealing ${phase}: ${communityCards.map((c) => `${c.rank}${c.suit}`).join(' ')}`;

  return {
    ...state,
    phase,
    deck,
    communityCards,
    players,
    currentTurnIndex: nextTurn,
    currentHighestBet: 0,
    minRaiseAmount: state.settings.bigBlind,
    history: [phaseMsg, ...state.history],
    statusMessage: `${phase} dealt. ${players[nextTurn].name}'s turn.`,
  };
}

/**
 * Evaluates hands and distributes pots at Showdown.
 */
function executeShowdown(state: TableState): TableState {
  const { players, communityCards } = state;
  const activePlayers = getActivePlayers(players);

  // Evaluate hand for each active player
  const evaluations = new Map<string, HandEvaluation>();
  const updatedPlayers = players.map((p) => {
    if (activePlayers.some((ap) => ap.id === p.id)) {
      const evaluation = evaluateHand([...p.cards, ...communityCards]);
      evaluations.set(p.id, evaluation);
      return {
        ...p,
        showdownHand: evaluation,
      };
    }
    return p;
  });

  const pots = calculatePots(updatedPlayers);
  const potAwards = resolvePots(pots, updatedPlayers, evaluations);

  // Award chips
  for (const award of potAwards) {
    const p = updatedPlayers.find((player) => player.id === award.player.id);
    if (p) {
      p.chips += award.amount;
    }
  }

  // Mark players who have 0 chips as busted
  updatedPlayers.forEach((p) => {
    if (p.chips <= 0) {
      p.isSittingOut = true;
      p.hasFolded = true;
      p.lastAction = { type: 'FOLD', text: 'Busted' };
    }
  });

  const winnersSummary = potAwards
    .map((a) => `${a.player.name} wins $${a.amount} with ${a.hand?.description || 'best hand'}`)
    .join(' | ');

  return {
    ...state,
    phase: 'HAND_OVER',
    players: updatedPlayers,
    winners: potAwards,
    sidePots: pots,
    history: [`[Showdown] ${winnersSummary}`, ...state.history],
    statusMessage: `Hand complete! ${winnersSummary}`,
  };
}

/**
 * Handle sole survivor win when all opponents fold.
 */
function handleSoleSurvivor(state: TableState, winner: Player): TableState {
  const totalPot = state.players.reduce((sum, p) => sum + p.totalHandBet, 0);
  const updatedPlayers = state.players.map((p) => {
    if (p.id === winner.id) {
      return {
        ...p,
        chips: p.chips + totalPot,
      };
    }
    return {
      ...p,
      isSittingOut: p.chips <= 0 ? true : p.isSittingOut,
      hasFolded: p.chips <= 0 ? true : p.hasFolded,
      lastAction: p.chips <= 0 ? { type: 'FOLD' as const, text: 'Busted' } : p.lastAction,
    };
  });

  const award: HandResult['winners'] = [
    {
      player: { ...winner, chips: winner.chips + totalPot },
      amount: totalPot,
      potIndex: 0,
    },
  ];

  return {
    ...state,
    phase: 'HAND_OVER',
    players: updatedPlayers,
    winners: award,
    history: [`${winner.name} wins $${totalPot} (all others folded).`, ...state.history],
    statusMessage: `${winner.name} wins $${totalPot} because everyone else folded.`,
  };
}

/**
 * Applies a player action to the table state.
 */
export function applyAction(state: TableState, action: PlayerAction): TableState {
  const playerIndex = state.players.findIndex((p) => p.id === action.playerId);
  if (playerIndex === -1 || playerIndex !== state.currentTurnIndex) {
    return state;
  }

  const players = state.players.map((p) => ({ ...p }));
  const player = players[playerIndex];
  let { currentHighestBet, minRaiseAmount, history } = state;
  let actionText = '';

  switch (action.type) {
    case 'FOLD': {
      player.hasFolded = true;
      player.lastAction = { type: 'FOLD', text: 'Fold' };
      actionText = `${player.name} folds.`;
      break;
    }

    case 'CHECK': {
      player.lastAction = { type: 'CHECK', text: 'Check' };
      actionText = `${player.name} checks.`;
      break;
    }

    case 'CALL': {
      const needed = currentHighestBet - player.currentBet;
      const actualCall = Math.min(needed, player.chips);
      player.chips -= actualCall;
      player.currentBet += actualCall;
      player.totalHandBet += actualCall;
      if (player.chips === 0) {
        player.isAllIn = true;
        player.lastAction = { type: 'ALL_IN', amount: actualCall, text: `All-in ($${actualCall})` };
        actionText = `${player.name} calls all-in for $${actualCall}.`;
      } else {
        player.lastAction = { type: 'CALL', amount: actualCall, text: `Call $${actualCall}` };
        actionText = `${player.name} calls $${actualCall}.`;
      }
      break;
    }

    case 'BET':
    case 'RAISE': {
      const addedChips = Math.min(action.amount, player.chips);
      const newTotalBet = player.currentBet + addedChips;
      const raiseDifference = newTotalBet - currentHighestBet;

      if (raiseDifference > 0) {
        minRaiseAmount = raiseDifference;
      }

      currentHighestBet = newTotalBet;
      player.chips -= addedChips;
      player.currentBet = newTotalBet;
      player.totalHandBet += addedChips;

      if (player.chips === 0) {
        player.isAllIn = true;
        player.lastAction = { type: 'ALL_IN', amount: addedChips, text: `All-in ($${addedChips})` };
        actionText = `${player.name} raises all-in to $${newTotalBet}.`;
      } else {
        player.lastAction = {
          type: action.type,
          amount: addedChips,
          text: `${action.type === 'BET' ? 'Bet' : 'Raise'} $${addedChips}`,
        };
        actionText = `${player.name} ${action.type === 'BET' ? 'bets' : 'raises'} $${addedChips} (to $${newTotalBet}).`;
      }
      break;
    }

    case 'ALL_IN': {
      const allInAmount = player.chips;
      const newTotalBet = player.currentBet + allInAmount;
      if (newTotalBet > currentHighestBet) {
        minRaiseAmount = Math.max(minRaiseAmount, newTotalBet - currentHighestBet);
        currentHighestBet = newTotalBet;
      }
      player.chips = 0;
      player.currentBet = newTotalBet;
      player.totalHandBet += allInAmount;
      player.isAllIn = true;
      player.lastAction = { type: 'ALL_IN', amount: allInAmount, text: `All-in ($${allInAmount})` };
      actionText = `${player.name} goes ALL-IN for $${allInAmount}!`;
      break;
    }
  }

  if (action.tableTalk) {
    player.tableTalk = action.tableTalk;
  }
  if (action.reasoning) {
    player.thought = action.reasoning;
  }

  const updatedHistory = [actionText, ...history];
  const sidePots = calculatePots(players);
  const totalPot = players.reduce((sum, p) => sum + p.totalHandBet, 0);

  let nextState: TableState = {
    ...state,
    players,
    currentHighestBet,
    minRaiseAmount,
    mainPot: totalPot,
    sidePots,
    history: updatedHistory,
    statusMessage: actionText,
  };

  // Check if only 1 active player remains (all others folded)
  const remainingActive = getActivePlayers(players);
  if (remainingActive.length === 1) {
    return handleSoleSurvivor(nextState, remainingActive[0]);
  }

  // Check if betting round is complete:
  // All active, non-all-in players have acted and matched the current highest bet
  const actionable = getActionablePlayers(players);
  const roundIsComplete = actionable.every(
    (p) => p.lastAction !== undefined && p.currentBet === currentHighestBet
  );

  if (roundIsComplete) {
    // Clear lastAction for the next street
    nextState.players = nextState.players.map((p) => ({
      ...p,
      lastAction: undefined,
    }));
    return advanceStreet(nextState);
  }

  // Otherwise, advance to next actionable player
  const nextTurn = getNextActivePlayerIndex(players, playerIndex);
  if (nextTurn === -1) {
    // All players are all-in, advance street
    return advanceStreet(nextState);
  }

  nextState.currentTurnIndex = nextTurn;
  nextState.statusMessage = `${players[nextTurn].name}'s turn.`;

  return nextState;
}

/**
 * Calculates current pot odds for a player facing a bet.
 */
export function calculatePotOdds(state: TableState, playerIndex: number): { toCall: number; totalPot: number; oddsPercent: number } {
  const player = state.players[playerIndex];
  if (!player) return { toCall: 0, totalPot: state.mainPot, oddsPercent: 0 };

  const toCall = Math.max(0, state.currentHighestBet - player.currentBet);
  if (toCall === 0) {
    return { toCall: 0, totalPot: state.mainPot, oddsPercent: 0 };
  }

  const totalPot = state.mainPot + toCall;
  const oddsPercent = Math.round((toCall / totalPot) * 100);

  return { toCall, totalPot, oddsPercent };
}
