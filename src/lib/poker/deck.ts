import { Card, Rank, Suit } from './types';

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

export const RANK_NAMES: Record<number, string> = {
  2: 'Deuce',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
  14: 'Ace',
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: RANK_VALUES[rank],
      });
    }
  }
  return deck;
}

/**
 * Cryptographically random Fisher-Yates shuffle
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    let rand = Math.random();
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      rand = arr[0] / (0xffffffff + 1);
    }
    const j = Math.floor(rand * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function formatCard(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function parseCard(cardStr: string): Card | null {
  const clean = cardStr.trim();
  const suitChar = clean.slice(-1) as Suit;
  const rankStr = clean.slice(0, -1) as Rank;

  if (!SUITS.includes(suitChar) || !RANKS.includes(rankStr)) {
    return null;
  }

  return {
    suit: suitChar,
    rank: rankStr,
    value: RANK_VALUES[rankStr],
  };
}

export function isRedSuit(suit: Suit): boolean {
  return suit === '♥' || suit === '♦';
}
