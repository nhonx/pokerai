export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 2..14 (A = 14)
}

export type HandRankCategory =
  | 'ROYAL_FLUSH'
  | 'STRAIGHT_FLUSH'
  | 'FOUR_OF_A_KIND'
  | 'FULL_HOUSE'
  | 'FLUSH'
  | 'STRAIGHT'
  | 'THREE_OF_A_KIND'
  | 'TWO_PAIR'
  | 'ONE_PAIR'
  | 'HIGH_CARD';

export interface HandEvaluation {
  category: HandRankCategory;
  categoryScore: number; // 1 to 10 (10 = Royal Flush)
  score: number; // full comparable numeric score with tie-breaking kickers
  description: string;
  bestFiveCards: Card[];
}

export type PlayerActionType = 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN';

export interface PlayerAction {
  playerId: string;
  type: PlayerActionType;
  amount: number;
  reasoning?: string;
  tableTalk?: string;
}

export type TablePhase =
  | 'IDLE'
  | 'DEALING'
  | 'PRE_FLOP'
  | 'FLOP'
  | 'TURN'
  | 'RIVER'
  | 'SHOWDOWN'
  | 'HAND_OVER';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
  model?: string;
  personaId?: string;
  chips: number;
  currentBet: number;
  totalHandBet: number;
  cards: Card[];
  hasFolded: boolean;
  isAllIn: boolean;
  isSittingOut: boolean;
  lastAction?: {
    type: PlayerActionType;
    amount?: number;
    text: string;
  };
  tableTalk?: string;
  thought?: string;
  showdownHand?: HandEvaluation;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface HandResult {
  winners: {
    player: Player;
    amount: number;
    hand?: HandEvaluation;
    potIndex: number;
  }[];
  summary: string;
}

export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high';

export interface GameSettings {
  smallBlind: number;
  bigBlind: number;
  startingChips: number;
  numPlayers: number;
  model: string;
  openRouterApiKey?: string;
  turnTimeoutSeconds: number;
  reasoningEffort?: ReasoningEffort;
}

export interface TableState {
  id: string;
  phase: TablePhase;
  deck: Card[];
  communityCards: Card[];
  players: Player[];
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  currentTurnIndex: number;
  currentHighestBet: number;
  minRaiseAmount: number;
  mainPot: number;
  sidePots: SidePot[];
  history: string[];
  settings: GameSettings;
  handCount: number;
  winners?: HandResult['winners'];
  statusMessage: string;
}
