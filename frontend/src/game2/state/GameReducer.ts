import { setupReducer } from "./phase/setup";
import { diceRollReducer } from "./phase/diceRoll";
import { robberReducer } from "./phase/robber";
import { buildReducer } from "./phase/buildTrade";
import type { GameState } from "./GameState";
import type { GameAction } from "./GameAction";

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (state.phase) {
    case "setup":
      return setupReducer(state, action);

    case "dice_roll":
      return diceRollReducer(state, action);

    case "robber":
      return robberReducer(state, action);

    case "building_trading":
      return buildReducer(state, action);

    default:
      return state;
  }
}
