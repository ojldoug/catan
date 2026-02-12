import type { GameState } from "../GameState";
import type { GameAction } from "../GameAction";
import {
  grantPortsForVertex,
  isBuildableLandVertex,
  isBuildableLandEdge,
} from "../../board/rules/placementRules";
import { transferInState } from "../utils/resourceTransfer"; // ✅ changed

/**
 * Setup phase reducer
 * Handles:
 *  - placing settlements
 *  - placing roads
 *  - advancing setup turn (forward then reverse)
 */

export function setupReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLACE_SETTLEMENT": {
      const { vertexId } = action;
      const currentPlayer = state.currentPlayer;

      const vertex = state.board.vertices[vertexId];
      if (!vertex) return state;

      // must be land
      if (!isBuildableLandVertex(vertex, state.board.tiles)) return state;

      const vState = state.vertexState[vertexId];
      if (!vState || vState.building !== "none") return state;

      // distance rule
      for (const adjId of vertex.adjacentVertices) {
        if (state.vertexState[adjId]?.building !== "none") {
          return state;
        }
      }

      // ----------------------------------
      // STARTING RESOURCES (2nd settlement)
      // ----------------------------------
      let nextState = state;

      if (state.setupTurn === 1) {
        for (const tileId of vertex.adjacentTiles) {
          const tile = nextState.board.tiles[tileId];
          if (!tile) continue;

          const resource = tile.resource;
          if (resource === "sea" || resource === "desert") continue;

          const transferred = transferInState(
            nextState,
            { type: "bank" },
            { type: "player", playerId: currentPlayer },
            { [resource]: 1 }
          );

          // If bank had the card, apply the transfer; otherwise skip
          if (transferred) nextState = transferred;
        }
      }

      // IMPORTANT:
      // from here on, use nextState (it contains any bank/player updates)
      const updatedPlayer = nextState.playerState[currentPlayer];

      return {
        ...nextState,

        vertexState: {
          ...nextState.vertexState,
          [vertexId]: {
            building: "settlement",
            ownerId: currentPlayer,
          },
        },

        playerState: {
          ...nextState.playerState,
          [currentPlayer]: grantPortsForVertex(
            {
              ...updatedPlayer,
              settlements: [...updatedPlayer.settlements, vertexId],
            },
            vertexId,
            nextState.board
          ),
        },

        setupStep: "road",
      };
    }

    case "PLACE_ROAD": {
      const { edgeId } = action;
      const playerId = state.currentPlayer;
      const edge = state.board.edges[edgeId];
      const edgeState = state.edgeState[edgeId];
      if (!edgeState || edgeState.ownerId !== null) return state;
      if (!isBuildableLandEdge(edge, state.board.tiles)) return state;

      const lastSettlementId = state.playerState[playerId].settlements.at(-1);
      if (!lastSettlementId) return state;

      // enforce adjacency rule for setup
      if (!edge.Vertex_IDs.includes(lastSettlementId)) return state;

      if (!edgeState || edgeState.ownerId !== null) return state;

      if (!isBuildableLandEdge(edge, state.board.tiles)) return state;

      const order = state.turnOrder;
      const idx = state.currentPlayerIndex;
      const lastIndex = order.length - 1;

      let nextPlayerIndex = idx;
      let nextSetupTurn = state.setupTurn;
      let nextPhase = state.phase;

      // ----------------------------
      // ADVANCE SETUP TURN / PLAYER
      // ----------------------------
      if (state.setupTurn === 0) {
        // ---- forward ----
        if (idx < lastIndex) {
          nextPlayerIndex = idx + 1;
        } else {
          // reached last player → reverse begins
          nextSetupTurn = 1;
          nextPlayerIndex = lastIndex;
        }
      } else {
        // ---- reverse ----
        if (idx > 0) {
          nextPlayerIndex = idx - 1;
        } else {
          // reached first player → setup finished
          nextPhase = "dice_roll";
        }
      }

      return {
        ...state,

        // place road
        edgeState: {
          ...state.edgeState,
          [edgeId]: {
            ownerId: playerId,
          },
        },

        playerState: {
          ...state.playerState,
          [playerId]: {
            ...state.playerState[playerId],
            roads: [...state.playerState[playerId].roads, edgeId],
          },
        },

        // reset step for next placement
        setupStep: nextPhase === "dice_roll" ? state.setupStep : "settlement",

        // turn management
        currentPlayerIndex: nextPlayerIndex,
        currentPlayer: order[nextPlayerIndex] ?? state.currentPlayer,
        setupTurn: nextSetupTurn,
        phase: nextPhase,
      };
    }

    case "VERTEX_CLICKED": {
      console.log("SETUP REDUCER VERTEX_CLICKED", action.vertexId);
      if (state.setupStep !== "settlement") return state;

      return setupReducer(state, {
        type: "PLACE_SETTLEMENT",
        vertexId: action.vertexId,
      });
    }

    case "EDGE_CLICKED": {
      if (state.setupStep !== "road") return state;

      return setupReducer(state, {
        type: "PLACE_ROAD",
        edgeId: action.edgeId,
      });
    }

    default:
      return state;
  }
}
