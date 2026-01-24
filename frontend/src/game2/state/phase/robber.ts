import type { GameState } from "../GameState";
import type { GameAction } from "../GameAction";
import type { ResourceType } from "../../StaticTypes/ResourceTypes";

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

      const newResources = { ...player.resources };
      for (const [r, n] of Object.entries(discard)) {
        const res = r as ResourceType;
        if (newResources[res] < (n ?? 0)) return state;
        newResources[res] -= n ?? 0;
      }

      const remaining = robber.pendingDiscards.filter(id => id !== discarder);

      // Still players left to discard
      if (remaining.length > 0) {
        return {
          ...state,
          currentPlayer: remaining[0], // 👈 THIS IS THE FIX
          playerState: {
            ...state.playerState,
            [discarder]: {
              ...player,
              resources: newResources,
            },
          },
          robberState: {
            ...robber,
            pendingDiscards: remaining,
            activeDiscarder: remaining[0],
          },
        };
      }

      // Done discarding → move robber
      return {
        ...state,
        currentPlayer: robber.originalRoller, // 👈 restore turn owner
        playerState: {
          ...state.playerState,
          [discarder]: {
            ...player,
            resources: newResources,
          },
        },
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

      // -----------------------------
      // Build steal candidates upfront
      // -----------------------------
      const stealSet = new Set<string>();
      for (const vId of tile.adjacentVertices) {
        const v = state.vertexState[vId];
        if (!v?.ownerId) continue;
        const ownerId = v.ownerId;
        const owner = state.playerState[ownerId];

        // Only include opponents with >0 total resources
        if (ownerId !== currentPlayer && Object.values(owner.resources).some(n => n > 0)) {
          stealSet.add(ownerId);
        }
      }

      const stealCandidates = [...stealSet];

      // -----------------------------
      // 0 candidates → skip
      // -----------------------------
      if (stealCandidates.length === 0) {
        return {
          ...state,
          robberTileId: action.tileId,
          phase: "building_trading",
          robberState: null,
        };
      }

      // -----------------------------
      // 1 candidate → auto-steal
      // -----------------------------
      if (stealCandidates.length === 1) {
        const victimId = stealCandidates[0];
        const victim = state.playerState[victimId];
        const thief = state.playerState[currentPlayer];

        const available = Object.entries(victim.resources)
          .filter(([, n]) => n > 0)
          .map(([r]) => r as ResourceType);

        const stolen = available[Math.floor(Math.random() * available.length)];

        return {
          ...state,
          robberTileId: action.tileId,
          playerState: {
            ...state.playerState,
            [victimId]: {
              ...victim,
              resources: {
                ...victim.resources,
                [stolen]: victim.resources[stolen] - 1,
              },
            },
            [currentPlayer]: {
              ...thief,
              resources: {
                ...thief.resources,
                [stolen]: thief.resources[stolen] + 1,
              },
            },
          },
          phase: "building_trading",
          robberState: null,
        };
      }

      // -----------------------------
      // 2+ candidates → wait for STEAL UI
      // -----------------------------
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

      // If somehow 0 or 1 candidate reached STEAL step, just exit
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
      const thief = state.playerState[currentPlayer];

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

      return {
        ...state,
        playerState: {
          ...state.playerState,
          [victimId]: {
            ...victim,
            resources: {
              ...victim.resources,
              [stolen]: victim.resources[stolen] - 1,
            },
          },
          [currentPlayer]: {
            ...thief,
            resources: {
              ...thief.resources,
              [stolen]: thief.resources[stolen] + 1,
            },
          },
        },
        phase: "building_trading",
        robberState: null,
      };
    }

    default:
      return state;
  }
}
