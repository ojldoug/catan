import type { GameState, PlayerState } from "../GameState";

/**
 * Points that are PUBLICLY visible to all players
 */
export function visibleVP(
  player: PlayerState,
  state: GameState
): number {
  let vp = 0;

  // Settlements = 1 VP each
  vp += player.settlements.length;

  // Cities = 2 VP each
  vp += player.cities.length * 2;

  // Later add:
  // Longest Road 
  // Largest Army 

  return vp;
}

export function totalVP(
  player: PlayerState,
  state: GameState
): number {
  let vp = visibleVP(player, state);

  // Hidden VP dev cards
  vp += player.devCards.victoryPoint;

  return vp;
}