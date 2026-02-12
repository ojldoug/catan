import type { GameState } from "../GameState";
import type { GameAction } from "../GameAction";
import type { ResourceType } from "../../StaticTypes/ResourceTypes";
import { placeRoad } from "../../board/rules/roadPlacement";
import { transferInState } from "../utils/resourceTransfer";

export function devCardReducer(
  state: GameState,
  action: GameAction
): GameState {
  const playerId = state.currentPlayer;
  const player = state.playerState[playerId];

  switch (action.type) {
    // =========================
    // PLAY YEAR OF PLENTY (opens UI)
    // =========================
    case "PLAY_YEAR_OF_PLENTY": {
      if (player.devCards.yearOfPlenty <= 0) return state;
      if (state.devCardPlayedThisTurn) return state;

      return {
        ...state,
        devCardPlayedThisTurn: true,
        devCardActionState: { type: "year_of_plenty_select" },
        playerState: {
          ...state.playerState,
          [playerId]: {
            ...player,
            devCards: {
              ...player.devCards,
              yearOfPlenty: player.devCards.yearOfPlenty - 1,
            },
          },
        },
      };
    }

    // =====================================
    // CONFIRM YEAR OF PLENTY (bank -> player)
    // =====================================
    case "SELECT_YEAR_OF_PLENTY_RESOURCES": {
      if (state.devCardActionState?.type !== "year_of_plenty_select") return state;

      const picks = action.resources; // { wood?: n, brick?: n, ... }

      // Validate exactly 2 total picks
      const totalPicked = Object.values(picks).reduce((sum, n) => sum + (n ?? 0), 0);
      if (totalPicked !== 2) return state;

      let nextState = state;

      // Transfer each chosen resource from bank to current player.
      // If bank is short on a requested resource, those transfers just won't happen,
      // but we still clear the action. (This matches your “bank can be empty” behavior elsewhere.)
      for (const r of Object.keys(picks) as ResourceType[]) {
        const amt = picks[r] ?? 0;
        if (amt <= 0) continue;

        const transferred = transferInState(
          nextState,
          { type: "bank" },
          { type: "player", playerId },
          { [r]: amt }
        );

        if (transferred) nextState = transferred;
        // else bank lacked that resource -> skip (player gets less than 2 if bank empty)
      }

      return {
        ...nextState,
        devCardActionState: null,
      };
    }

    // =========================
    // PLAY MONOPOLY (opens UI)
    // =========================
    case "PLAY_MONOPOLY": {
      if (player.devCards.monopoly <= 0) return state;
      if (state.devCardPlayedThisTurn) return state;

      return {
        ...state,
        devCardPlayedThisTurn: true,
        devCardActionState: { type: "monopoly_select" },
        playerState: {
          ...state.playerState,
          [playerId]: {
            ...player,
            devCards: {
              ...player.devCards,
              monopoly: player.devCards.monopoly - 1,
            },
          },
        },
      };
    }

    // ===========================================
    // SELECT MONOPOLY RESOURCE (executes transfers)
    // ===========================================
    case "SELECT_MONOPOLY_RESOURCE": {
      if (state.devCardActionState?.type !== "monopoly_select") return state;

      const resource: ResourceType = action.resource;

      let nextState: GameState = state;

      // Take ALL of the chosen resource from every opponent
      for (const otherId of nextState.turnOrder) {
        if (otherId === playerId) continue;

        const other = nextState.playerState[otherId];
        const amount = other.resources[resource];

        if (amount <= 0) continue;

        const transferred = transferInState(
          nextState,
          { type: "player", playerId: otherId },
          { type: "player", playerId },
          { [resource]: amount }
        );

        // Should always succeed because we're transferring exactly what they have,
        // but keep safety behavior.
        if (transferred) nextState = transferred;
      }

      return {
        ...nextState,
        devCardActionState: null,
      };
    }
    
    // =========================
    // PLAY ROAD BUILDING
    // =========================
    case "PLAY_ROAD_BUILDING": {
      // Must have card
      if (player.devCards.roadBuilding <= 0) return state;

      // Only one dev card per turn
      if (state.devCardPlayedThisTurn) return state;

      return {
        ...state,
        devCardPlayedThisTurn: true,
        devCardActionState: {
          type: "road_building",
          roadsRemaining: 2,
        },
        playerState: {
          ...state.playerState,
          [playerId]: {
            ...player,
            devCards: {
              ...player.devCards,
              roadBuilding: player.devCards.roadBuilding - 1,
            },
          },
        },
      };
    }

    case "EDGE_CLICKED": {
        if (state.devCardActionState?.type !== "road_building") return state;

        const playerId = state.currentPlayer;

        const placed = placeRoad(state, playerId, action.edgeId);
        if (!placed) return state;

        const remaining = state.devCardActionState.roadsRemaining - 1;

        return {
            ...placed,
            devCardActionState:
            remaining > 0
                ? { type: "road_building", roadsRemaining: remaining }
                : null,
        };
        }

  }

  return state;
}
