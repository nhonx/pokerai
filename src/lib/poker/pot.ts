import { Player, SidePot, HandEvaluation } from './types';
import { compareHands } from './evaluator';

export interface CalculatedPots {
  pots: {
    amount: number;
    eligiblePlayerIds: string[];
  }[];
}

/**
 * Calculates main pot and any side pots based on each player's totalHandBet.
 */
export function calculatePots(players: Player[]): SidePot[] {
  // Only consider players who put chips into this hand
  const activeBets = players
    .filter((p) => p.totalHandBet > 0)
    .map((p) => ({
      id: p.id,
      bet: p.totalHandBet,
      folded: p.hasFolded,
    }));

  if (activeBets.length === 0) {
    return [];
  }

  // Get all unique bet amounts sorted ascending
  const uniqueBets = Array.from(new Set(activeBets.map((b) => b.bet))).sort((a, b) => a - b);

  const pots: SidePot[] = [];
  let previousBetLevel = 0;

  for (const betLevel of uniqueBets) {
    const contributionPerPlayer = betLevel - previousBetLevel;
    if (contributionPerPlayer <= 0) continue;

    let potAmount = 0;
    const eligiblePlayerIds: string[] = [];

    for (const b of activeBets) {
      if (b.bet >= betLevel) {
        potAmount += contributionPerPlayer;
        if (!b.folded) {
          eligiblePlayerIds.push(b.id);
        }
      } else if (b.bet > previousBetLevel) {
        potAmount += b.bet - previousBetLevel;
      }
    }

    if (potAmount > 0 && eligiblePlayerIds.length > 0) {
      pots.push({
        amount: potAmount,
        eligiblePlayerIds,
      });
    } else if (potAmount > 0 && eligiblePlayerIds.length === 0 && pots.length > 0) {
      // If nobody eligible (e.g. all who reached this level folded), roll into previous pot
      pots[pots.length - 1].amount += potAmount;
    }

    previousBetLevel = betLevel;
  }

  return pots;
}

export interface PotAward {
  player: Player;
  amount: number;
  hand?: HandEvaluation;
  potIndex: number;
}

/**
 * Distribute pots to winners at showdown.
 */
export function resolvePots(
  pots: SidePot[],
  players: Player[],
  playerEvaluations: Map<string, HandEvaluation>
): PotAward[] {
  const awards: PotAward[] = [];
  const playerMap = new Map(players.map((p) => [p.id, p]));

  pots.forEach((pot, potIndex) => {
    if (pot.amount <= 0 || pot.eligiblePlayerIds.length === 0) return;

    // Filter eligible players who have not folded
    const eligiblePlayers = pot.eligiblePlayerIds
      .map((id) => playerMap.get(id))
      .filter((p): p is Player => p !== undefined && !p.hasFolded);

    if (eligiblePlayers.length === 0) return;

    if (eligiblePlayers.length === 1) {
      awards.push({
        player: eligiblePlayers[0],
        amount: pot.amount,
        hand: playerEvaluations.get(eligiblePlayers[0].id),
        potIndex,
      });
      return;
    }

    // Find the highest hand score among eligible players
    let bestScore = -Infinity;
    let winningPlayers: Player[] = [];

    for (const player of eligiblePlayers) {
      const evaluation = playerEvaluations.get(player.id);
      if (!evaluation) continue;

      if (evaluation.score > bestScore) {
        bestScore = evaluation.score;
        winningPlayers = [player];
      } else if (evaluation.score === bestScore) {
        winningPlayers.push(player);
      }
    }

    if (winningPlayers.length === 0) {
      winningPlayers = [eligiblePlayers[0]];
    }

    // Split pot equally among winners
    const splitShare = Math.floor(pot.amount / winningPlayers.length);
    let remainder = pot.amount % winningPlayers.length;

    for (const winner of winningPlayers) {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;

      awards.push({
        player: winner,
        amount: splitShare + extra,
        hand: playerEvaluations.get(winner.id),
        potIndex,
      });
    }
  });

  return awards;
}
