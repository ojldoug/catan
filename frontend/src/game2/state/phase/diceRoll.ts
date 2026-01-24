import type { GameState } from "../GameState";
import type { GameAction } from "../GameAction";
import type { ResourceType } from "../../StaticTypes/ResourceTypes";


export function diceRollReducer(
  state: GameState,
  action: GameAction
): GameState {
    //console.log("ENTER diceRollReducer", state.phase, action);
  switch (action.type) {
    case "ROLL_DICE": {
      if (state.phase !== "dice_roll") return state;
      if (state.diceRolled) return state;

      const roll = action.roll;

      // 🎲 ROLL = 7 → ROBBER
      if (roll === 7) {
        const turnOrder = state.turnOrder;
        const currentIndex = turnOrder.indexOf(state.currentPlayer);

        // Rotate turn order so currentPlayer is first
        const orderedPlayers = [
          ...turnOrder.slice(currentIndex),
          ...turnOrder.slice(0, currentIndex),
        ];

        const discardAmounts: Record<string, number> = {};
        const pendingDiscards: string[] = [];

        for (const playerId of orderedPlayers) {
          const player = state.playerState[playerId];
          const total = Object.values(player.resources).reduce(
            (a, b) => a + b,
            0
          );

          if (total >= 8) {
            discardAmounts[playerId] = Math.floor(total / 2);
            pendingDiscards.push(playerId);
          }
        }

        return {
          ...state,
          phase: "robber",
          robberState: {
            step: pendingDiscards.length > 0 ? "discard" : "move",
            pendingDiscards,
            discardAmounts,
            activeDiscarder: pendingDiscards.length > 0 ? pendingDiscards[0] : null,
            stealCandidates: null,
            originalRoller: state.currentPlayer,
          },
        };
      }

      // 🪵 RESOURCE DISTRIBUTION
      const updatedPlayerState = { ...state.playerState };

      for (const tile of Object.values(state.board.tiles)) {
        if (tile.token !== roll) continue;
        if (!tile.resource) continue;
        if (tile.id === state.robberTileId) continue;

        const resource = tile.resource as ResourceType;

        for (const vertexId of tile.adjacentVertices) {
          const vState = state.vertexState[vertexId];
          if (!vState || vState.building === "none") continue;

          const owner = vState.ownerId;
          if (!owner) continue;

          const payout =
            vState.building === "city" ? 2 : 1;

          const player = updatedPlayerState[owner];

          updatedPlayerState[owner] = {
            ...player,
            resources: {
              ...player.resources,
              [resource]: player.resources[resource] + payout,
            },
          };
        }
      }

      return {
        ...state,
        diceRolled: true,
        lastRoll: roll,
        playerState: updatedPlayerState,
        phase: "building_trading",
      };
    }

    default:
      return state;
  }
}
