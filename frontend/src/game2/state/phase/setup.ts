import type { GameState } from "../GameState";
import type { GameAction } from "../GameAction";
import { grantPortsForVertex, isBuildableLandVertex, isBuildableLandEdge } from "../../board/rules/placementRules";


/**
 * Setup phase reducer
 * Handles:
 *  - placing settlements
 *  - placing roads
 *  - advancing setup turn (forward then reverse)
 */

export function setupReducer(
  state: GameState,
  action: GameAction
): GameState {
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
      let updatedResources = state.playerState[currentPlayer].resources;

      if (state.setupTurn === 1) {
        updatedResources = { ...updatedResources };

        for (const tileId of vertex.adjacentTiles) {
          const tile = state.board.tiles[tileId];
          if (!tile) continue;

          const resource = tile.resource;
          if (resource === "sea" || resource === "desert") continue;

          updatedResources[resource] =
            (updatedResources[resource] ?? 0) + 1;
        }
      }

      return {
        ...state,

        vertexState: {
          ...state.vertexState,
          [vertexId]: {
            building: "settlement",
            ownerId: currentPlayer,
          },
        },

        playerState: {
          ...state.playerState,
          [currentPlayer]: grantPortsForVertex(
            {
              ...state.playerState[currentPlayer],
              resources: updatedResources,
              settlements: [
                ...state.playerState[currentPlayer].settlements,
                vertexId,
              ],
            },
            vertexId,
            state.board
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

      // reuse existing logic
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
