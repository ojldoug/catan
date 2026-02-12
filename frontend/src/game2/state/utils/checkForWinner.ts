import type { GameState } from "../GameState";
import { totalVP } from "./calculateVP";

const WINNING_VP = 15;

export function checkForWinner(state: GameState): string | null {
  for (const playerId of state.turnOrder) {
    const player = state.playerState[playerId];
    const vp = totalVP(player, state);

    if (vp >= WINNING_VP) {
      return playerId;
    }
  }

  return null;
}
