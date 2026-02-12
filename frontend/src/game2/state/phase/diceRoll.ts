import type { GameState } from "../GameState";
import type { GameAction } from "../GameAction";
import type { ResourceType } from "../../StaticTypes/ResourceTypes";
import { transferInState } from "../utils/resourceTransfer";

export function diceRollReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ROLL_DICE": {
      if (state.phase !== "dice_roll") return state;
      if (state.diceRolled) return state;

      const roll = action.roll;

      // 🎲 ROLL = 7 → ROBBER
      if (roll === 7) {
        const turnOrder = state.turnOrder;
        const currentIndex = turnOrder.indexOf(state.currentPlayer);

        const orderedPlayers = [
          ...turnOrder.slice(currentIndex),
          ...turnOrder.slice(0, currentIndex),
        ];

        const discardAmounts: Record<string, number> = {};
        const pendingDiscards: string[] = [];

        for (const playerId of orderedPlayers) {
          const player = state.playerState[playerId];
          const total = Object.values(player.resources).reduce((a, b) => a + b, 0);

          if (total >= 8) {
            discardAmounts[playerId] = Math.floor(total / 2);
            pendingDiscards.push(playerId);
          }
        }

        return {
          ...state,
          phase: "robber",
          diceRolled: true,
          lastRoll: roll,
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

      // ==============================
      // DISTRIBUTE RESOURCES (deterministic one-card-at-a-time)
      // ==============================
      let nextState: GameState = state;

      // resource -> playerId -> amount owed
      const demand: Record<ResourceType, Record<string, number>> = {
        wood: {},
        brick: {},
        sheep: {},
        wheat: {},
        ore: {},
      };

      // Build demand from tiles matching roll
      for (const tile of Object.values(state.board.tiles)) {
        if (tile.token !== roll) continue;
        if (!tile.resource) continue;
        if (tile.id === state.robberTileId) continue;
        if (tile.resource === "sea" || tile.resource === "desert") continue;

        const resource = tile.resource as ResourceType;

        for (const vertexId of tile.adjacentVertices) {
          const vState = state.vertexState[vertexId];
          if (!vState || vState.building === "none") continue;

          const owner = vState.ownerId;
          if (!owner) continue;

          const payout = vState.building === "city" ? 2 : 1;
          demand[resource][owner] = (demand[resource][owner] ?? 0) + payout;
        }
      }

      // Priority order starting at current player (deterministic)
      const order = state.turnOrder;
      const startIdx = state.currentPlayerIndex;
      const priorityOrder = [...order.slice(startIdx), ...order.slice(0, startIdx)];

      // For each resource, pay out one card at a time in priority order
      for (const resource of Object.keys(demand) as ResourceType[]) {
        const owed = { ...demand[resource] };
        const playersOwed = Object.keys(owed);
        if (playersOwed.length === 0) continue;

        // Loop until bank is empty for this resource or everyone is satisfied
        // We cycle through priorityOrder repeatedly.
        while (nextState.bank[resource] > 0) {
          let paidSomeoneThisCycle = false;

          for (const p of priorityOrder) {
            if (nextState.bank[resource] <= 0) break;

            const remaining = owed[p] ?? 0;
            if (remaining <= 0) continue;

            const transferred = transferInState(
              nextState,
              { type: "bank" },
              { type: "player", playerId: p },
              { [resource]: 1 }
            );

            // If transfer fails, bank is effectively empty/blocked for some reason
            if (!transferred) {
              // stop paying this resource
              paidSomeoneThisCycle = false;
              break;
            }

            nextState = transferred;
            owed[p] = remaining - 1;
            paidSomeoneThisCycle = true;
          }

          // If we went through the whole priority list and nobody was owed anything,
          // we're done for this resource.
          if (!paidSomeoneThisCycle) break;
        }
      }

      return {
        ...nextState,
        diceRolled: true,
        lastRoll: roll,
        phase: "building_trading",
      };
    }

    default:
      return state;
  }
}
