import type { GameState } from "../GameState";
import type { GameAction } from "../GameAction";
import type { ResourceType } from "../../StaticTypes/ResourceTypes";
import { transferInState } from "../utils/resourceTransfer";

export function robberReducer(
  state: GameState,
  action: GameAction
): GameState {
  if (state.phase !== "robber" || !state.robberState) return state;

  const robber = state.robberState;
  const currentPlayer = state.currentPlayer;

  switch (robber.step) {
    // ==============================
    // STEP 1: DISCARD
    // ==============================
    case "discard": {
      if (action.type !== "DISCARD_RESOURCES") return state;

      const discarder = robber.activeDiscarder;
      if (!discarder) return state;

      const player = state.playerState[discarder];
      const discard = action.resources;

      const totalResources = Object.values(player.resources).reduce(
        (a, b) => a + b,
        0
      );

      const requiredDiscard = Math.floor(totalResources / 2);

      const discardCount = Object.values(discard).reduce(
        (a, b) => a + (b ?? 0),
        0
      );

      if (discardCount !== requiredDiscard) return state;

      // ✅ Transfer discarded cards back to bank via transferInState
      const nextState = transferInState(
        state,
        { type: "player", playerId: discarder },
        { type: "bank" },
        discard
      );

      if (!nextState) return state; // safety check (insufficient resources etc.)

      const remaining = robber.pendingDiscards.filter(id => id !== discarder);

      // Still players left to discard
      if (remaining.length > 0) {
        return {
          ...nextState,
          currentPlayer: remaining[0],
          robberState: {
            ...robber,
            pendingDiscards: remaining,
            activeDiscarder: remaining[0],
          },
        };
      }

      // Done discarding → move robber
      return {
        ...nextState,
        currentPlayer: robber.originalRoller,
        robberState: {
          ...robber,
          step: "move",
          pendingDiscards: [],
          activeDiscarder: null,
        },
      };
    }

    // ==============================
    // STEP 2: MOVE ROBBER
    // ==============================
    case "move": {
      if (action.type !== "PLACE_ROBBER") return state;

      const tile = state.board.tiles[action.tileId];
      if (!tile) return state;

      // Build steal candidates upfront
      const stealSet = new Set<string>();
      for (const vId of tile.adjacentVertices) {
        const v = state.vertexState[vId];
        if (!v?.ownerId) continue;
        const ownerId = v.ownerId;
        const owner = state.playerState[ownerId];

        if (
          ownerId !== currentPlayer &&
          Object.values(owner.resources).some(n => n > 0)
        ) {
          stealSet.add(ownerId);
        }
      }

      const stealCandidates = [...stealSet];

      // 0 candidates → skip
      if (stealCandidates.length === 0) {
        return {
          ...state,
          robberTileId: action.tileId,
          phase: "building_trading",
          robberState: null,
        };
      }

      // 1 candidate → auto-steal (NOW via transferInState)
      if (stealCandidates.length === 1) {
        const victimId = stealCandidates[0];
        const victim = state.playerState[victimId];

        const available = Object.entries(victim.resources)
          .filter(([, n]) => n > 0)
          .map(([r]) => r as ResourceType);

        if (available.length === 0) {
          return {
            ...state,
            robberTileId: action.tileId,
            phase: "building_trading",
            robberState: null,
          };
        }

        const stolen = available[Math.floor(Math.random() * available.length)];

        const next = transferInState(
          state,
          { type: "player", playerId: victimId },
          { type: "player", playerId: currentPlayer },
          { [stolen]: 1 }
        );

        if (!next) return state;

        return {
          ...next,
          robberTileId: action.tileId,
          phase: "building_trading",
          robberState: null,
        };
      }

      // 2+ candidates → wait for STEAL UI
      return {
        ...state,
        robberTileId: action.tileId,
        robberState: {
          ...robber,
          step: "steal",
          stealCandidates,
        },
      };
    }

    // ==============================
    // STEP 3: STEAL (UI only for 2+ candidates)
    // ==============================
    case "steal": {
      const candidates = robber.stealCandidates ?? [];

      if (candidates.length <= 1) {
        return {
          ...state,
          phase: "building_trading",
          robberState: null,
        };
      }

      if (action.type !== "STEAL_RESOURCE") return state;

      const victimId = action.victimId;
      if (!candidates.includes(victimId)) return state;

      const victim = state.playerState[victimId];

      const available = Object.entries(victim.resources)
        .filter(([, n]) => n > 0)
        .map(([r]) => r as ResourceType);

      if (available.length === 0) {
        return {
          ...state,
          phase: "building_trading",
          robberState: null,
        };
      }

      const stolen = available[Math.floor(Math.random() * available.length)];

      const next = transferInState(
        state,
        { type: "player", playerId: victimId },
        { type: "player", playerId: currentPlayer },
        { [stolen]: 1 }
      );

      if (!next) return state;

      return {
        ...next,
        phase: "building_trading",
        robberState: null,
      };
    }

    default:
      return state;
  }
}
