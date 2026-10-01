import { Card, HandEvaluation, HandRankCategory } from './types';
import { RANK_NAMES } from './deck';

const CATEGORY_SCORES: Record<HandRankCategory, number> = {
  ROYAL_FLUSH: 10,
  STRAIGHT_FLUSH: 9,
  FOUR_OF_A_KIND: 8,
  FULL_HOUSE: 7,
  FLUSH: 6,
  STRAIGHT: 5,
  THREE_OF_A_KIND: 4,
  TWO_PAIR: 3,
  ONE_PAIR: 2,
  HIGH_CARD: 1,
};

/**
 * Evaluates exactly 5 cards and returns category, score, and description.
 * Score calculation:
 * Base category = categoryScore * 10,000,000
 * Plus kicker values encoded into base-15 digits.
 */
function evaluate5Cards(cards: Card[]): HandEvaluation {
  // Sort descending by value (Aces first: 14 down to 2)
  const sorted = [...cards].sort((a, b) => b.value - a.value);

  // Group by rank
  const rankCounts: Record<number, number> = {};
  for (const c of sorted) {
    rankCounts[c.value] = (rankCounts[c.value] || 0) + 1;
  }

  // Group cards by occurrence frequency, then by rank descending
  const groups: { value: number; count: number; cards: Card[] }[] = [];
  for (const [valStr, count] of Object.entries(rankCounts)) {
    const val = Number(valStr);
    groups.push({
      value: val,
      count,
      cards: sorted.filter((c) => c.value === val),
    });
  }

  // Sort groups: primary sort by count descending, secondary by value descending
  groups.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.value - a.value;
  });

  const isFlush = sorted.every((c) => c.suit === sorted[0].suit);

  // Check straight:
  // Distinct values in descending order
  const values = sorted.map((c) => c.value);
  let isStraight = false;
  let straightHigh = 0;

  // Normal straight: 5 consecutive cards
  if (
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  } else if (
    // Ace-low straight (Wheel): A, 5, 4, 3, 2
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    isStraight = true;
    straightHigh = 5; // In 5-high straight, 5 is the high card
  }

  // Compute tie-breaker kicker score based on group ordering
  // 5 positional weights: val0 * 15^4 + val1 * 15^3 + val2 * 15^2 + val3 * 15^1 + val4
  const orderedCards = groups.flatMap((g) => g.cards);
  let kickerScore = 0;
  if (isStraight && straightHigh === 5) {
    // For wheel straight, order values as 5, 4, 3, 2, 1
    kickerScore = 5 * 15 ** 4 + 4 * 15 ** 3 + 3 * 15 ** 2 + 2 * 15 + 1;
  } else {
    for (let i = 0; i < orderedCards.length; i++) {
      kickerScore += orderedCards[i].value * 15 ** (4 - i);
    }
  }

  // 1. Royal Flush & Straight Flush
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        category: 'ROYAL_FLUSH',
        categoryScore: CATEGORY_SCORES.ROYAL_FLUSH,
        score: CATEGORY_SCORES.ROYAL_FLUSH * 10_000_000 + kickerScore,
        description: `Royal Flush (${sorted[0].suit})`,
        bestFiveCards: sorted,
      };
    }
    return {
      category: 'STRAIGHT_FLUSH',
      categoryScore: CATEGORY_SCORES.STRAIGHT_FLUSH,
      score: CATEGORY_SCORES.STRAIGHT_FLUSH * 10_000_000 + kickerScore,
      description: `Straight Flush, ${RANK_NAMES[straightHigh]} High`,
      bestFiveCards: sorted,
    };
  }

  // 2. Four of a Kind (Quads)
  if (groups[0].count === 4) {
    const quadRank = groups[0].value;
    const kickerRank = groups[1].value;
    return {
      category: 'FOUR_OF_A_KIND',
      categoryScore: CATEGORY_SCORES.FOUR_OF_A_KIND,
      score: CATEGORY_SCORES.FOUR_OF_A_KIND * 10_000_000 + kickerScore,
      description: `Four of a Kind, ${RANK_NAMES[quadRank]}s with ${RANK_NAMES[kickerRank]} kicker`,
      bestFiveCards: orderedCards,
    };
  }

  // 3. Full House
  if (groups[0].count === 3 && groups[1].count === 2) {
    const tripleRank = groups[0].value;
    const pairRank = groups[1].value;
    return {
      category: 'FULL_HOUSE',
      categoryScore: CATEGORY_SCORES.FULL_HOUSE,
      score: CATEGORY_SCORES.FULL_HOUSE * 10_000_000 + kickerScore,
      description: `Full House, ${RANK_NAMES[tripleRank]}s full of ${RANK_NAMES[pairRank]}s`,
      bestFiveCards: orderedCards,
    };
  }

  // 4. Flush
  if (isFlush) {
    return {
      category: 'FLUSH',
      categoryScore: CATEGORY_SCORES.FLUSH,
      score: CATEGORY_SCORES.FLUSH * 10_000_000 + kickerScore,
      description: `Flush, ${RANK_NAMES[sorted[0].value]} High`,
      bestFiveCards: sorted,
    };
  }

  // 5. Straight
  if (isStraight) {
    return {
      category: 'STRAIGHT',
      categoryScore: CATEGORY_SCORES.STRAIGHT,
      score: CATEGORY_SCORES.STRAIGHT * 10_000_000 + kickerScore,
      description: `Straight, ${RANK_NAMES[straightHigh]} High`,
      bestFiveCards: sorted,
    };
  }

  // 6. Three of a Kind
  if (groups[0].count === 3) {
    const tripRank = groups[0].value;
    return {
      category: 'THREE_OF_A_KIND',
      categoryScore: CATEGORY_SCORES.THREE_OF_A_KIND,
      score: CATEGORY_SCORES.THREE_OF_A_KIND * 10_000_000 + kickerScore,
      description: `Three of a Kind, ${RANK_NAMES[tripRank]}s`,
      bestFiveCards: orderedCards,
    };
  }

  // 7. Two Pair
  if (groups[0].count === 2 && groups[1].count === 2) {
    const highPair = groups[0].value;
    const lowPair = groups[1].value;
    const kicker = groups[2].value;
    return {
      category: 'TWO_PAIR',
      categoryScore: CATEGORY_SCORES.TWO_PAIR,
      score: CATEGORY_SCORES.TWO_PAIR * 10_000_000 + kickerScore,
      description: `Two Pair, ${RANK_NAMES[highPair]}s and ${RANK_NAMES[lowPair]}s with ${RANK_NAMES[kicker]} kicker`,
      bestFiveCards: orderedCards,
    };
  }

  // 8. One Pair
  if (groups[0].count === 2) {
    const pairRank = groups[0].value;
    return {
      category: 'ONE_PAIR',
      categoryScore: CATEGORY_SCORES.ONE_PAIR,
      score: CATEGORY_SCORES.ONE_PAIR * 10_000_000 + kickerScore,
      description: `One Pair of ${RANK_NAMES[pairRank]}s`,
      bestFiveCards: orderedCards,
    };
  }

  // 9. High Card
  return {
    category: 'HIGH_CARD',
    categoryScore: CATEGORY_SCORES.HIGH_CARD,
    score: CATEGORY_SCORES.HIGH_CARD * 10_000_000 + kickerScore,
    description: `High Card, ${RANK_NAMES[sorted[0].value]}`,
    bestFiveCards: sorted,
  };
}

/**
 * Generates all 21 combinations of 5 cards from 7 cards.
 */
function getCombinations5(cards: Card[]): Card[][] {
  const result: Card[][] = [];
  const n = cards.length;

  function backtrack(start: number, combo: Card[]) {
    if (combo.length === 5) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < n; i++) {
      combo.push(cards[i]);
      backtrack(i + 1, combo);
      combo.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * Evaluates any hand of 5, 6, or 7 cards (hole cards + community cards)
 * and returns the best 5-card poker hand evaluation.
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    // If fewer than 5 cards (e.g. pre-flop or flop), return partial ranking based on available cards
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    if (cards.length === 2 && cards[0].value === cards[1].value) {
      return {
        category: 'ONE_PAIR',
        categoryScore: CATEGORY_SCORES.ONE_PAIR,
        score: CATEGORY_SCORES.ONE_PAIR * 10_000_000 + cards[0].value,
        description: `Pocket Pair of ${RANK_NAMES[cards[0].value]}s`,
        bestFiveCards: cards,
      };
    }
    return {
      category: 'HIGH_CARD',
      categoryScore: CATEGORY_SCORES.HIGH_CARD,
      score: CATEGORY_SCORES.HIGH_CARD * 10_000_000 + (sorted[0]?.value || 0),
      description: sorted[0] ? `High Card, ${RANK_NAMES[sorted[0].value]}` : 'Waiting for cards',
      bestFiveCards: sorted,
    };
  }

  if (cards.length === 5) {
    return evaluate5Cards(cards);
  }

  const combinations = getCombinations5(cards);
  let bestEval: HandEvaluation | null = null;

  for (const combo of combinations) {
    const currentEval = evaluate5Cards(combo);
    if (!bestEval || currentEval.score > bestEval.score) {
      bestEval = currentEval;
    }
  }

  return bestEval!;
}

/**
 * Compare two hands.
 * Returns > 0 if handA wins, < 0 if handB wins, 0 if exact tie (split pot).
 */
export function compareHands(handA: HandEvaluation, handB: HandEvaluation): number {
  return handA.score - handB.score;
}
