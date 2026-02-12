import { setupReducer } from "./phase/setup";
import { diceRollReducer } from "./phase/diceRoll";
import { robberReducer } from "./phase/robber";
import { buildReducer } from "./phase/buildTrade";
import type { GameState } from "./GameState";
import type { GameAction } from "./GameAction";
import { devCardReducer } from "./phase/devCardAction";

export function gameReducer(state: GameState, action: GameAction): GameState {
  // Dev cards can be played during building/trading
  const afterDev = devCardReducer(state, action);
  if (afterDev !== state) return afterDev;
  
  switch (state.phase) {
    case "setup":
      return setupReducer(state, action);

    case "dice_roll":
      return diceRollReducer(state, action);

    case "robber":
      return robberReducer(state, action);

    case "building_trading":
      return buildReducer(state, action);

    case "dev_card_action":
      return devCardReducer(state, action);

    default:
      return state;
  }
}
