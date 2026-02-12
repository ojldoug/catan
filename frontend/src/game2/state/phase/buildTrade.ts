import type { GameState, PlayerState } from "../GameState";
import type { GameAction } from "../GameAction";
import type { ResourceType } from "../../StaticTypes/ResourceTypes";
import { grantPortsForVertex, isBuildableLandVertex } from "../../board/rules/placementRules";
import { checkForWinner } from "../utils/checkForWinner";
import { canBuild, BUILD_COSTS } from "../utils/buildRequirements";
import { placeRoad } from "../../board/rules/roadPlacement";

// ✅ NEW: finite-bank transfers
import { transferInState, exchangeInState } from "../utils/resourceTransfer";

// TRADE FUNCTIONS
function getTradeRatio(player: PlayerState, resource: ResourceType): number {
  if (player.ports[resource]) return 2; // specific 2:1 port
  if (player.ports.any) return 3;       // generic 3:1 port
  return 4;                              // default bank trade
}

// REDUCER
export function buildReducer(state: GameState, action: GameAction): GameState {
  if (state.phase !== "building_trading") return state;

  const playerId = state.currentPlayer;
  const player = state.playerState[playerId];

  switch (action.type) {
    case "SET_BUILD_TRADE_MODE":
      return {
        ...state,
        buildTradeMode: action.mode,
      };

    case "VERTEX_CLICKED": {
      if (state.buildTradeMode === "none") return state;

      const vId = action.vertexId;
      const vState = state.vertexState[vId];
      const vertex = state.board.vertices[vId];
      if (!vertex || !isBuildableLandVertex(vertex, state.board.tiles)) return state;

      // ======================
      // BUILD CITY
      // ======================
      if (state.buildTradeMode === "city") {
        if (vState.ownerId === playerId && vState.building === "settlement") {
          if (!canBuild(player, "city")) return state;

          // ✅ Pay cost: player -> bank (finite resources, no burning)
          const paid = transferInState(
            state,
            { type: "player", playerId },
            { type: "bank" },
            BUILD_COSTS.city
          );
          if (!paid) return state;

          const paidPlayer = paid.playerState[playerId];

          const newState: GameState = {
            ...paid,
            vertexState: {
              ...paid.vertexState,
              [vId]: { building: "city", ownerId: playerId },
            },
            playerState: {
              ...paid.playerState,
              [playerId]: {
                ...paidPlayer,
                settlements: paidPlayer.settlements.filter(id => id !== vId),
                cities: [...paidPlayer.cities, vId],
              },
            },
          };

          const winner = checkForWinner(newState);
          if (winner) return { ...newState, phase: "game_over", winner };

          return newState;
        }

        return state;
      }

      // ======================
      // BUILD SETTLEMENT
      // ======================
      if (state.buildTradeMode !== "settlement") return state;
      if (vState.building !== "none") return state;
      if (!canBuild(player, "settlement")) return state;

      // ❌ DISTANCE RULE — no adjacent settlements or cities
      const adjacentOccupied = state.board.vertices[vId].adjacentVertices.some((adjId) => {
        const adjState = state.vertexState[adjId];
        return adjState && adjState.building !== "none";
      });
      if (adjacentOccupied) return state;

      // must touch own road
      const touchesOwnRoad = Object.values(state.board.edges).some(
        (edge) =>
          edge.Vertex_IDs.includes(vId) &&
          state.edgeState[edge.id]?.ownerId === playerId
      );
      if (!touchesOwnRoad) return state;

      // ✅ Pay cost: player -> bank
      const paid = transferInState(
        state,
        { type: "player", playerId },
        { type: "bank" },
        BUILD_COSTS.settlement
      );
      if (!paid) return state;

      const paidPlayer = paid.playerState[playerId];

      const newState: GameState = {
        ...paid,
        vertexState: {
          ...paid.vertexState,
          [vId]: { building: "settlement", ownerId: playerId },
        },
        playerState: {
          ...paid.playerState,
          [playerId]: grantPortsForVertex(
            {
              ...paidPlayer,
              settlements: [...paidPlayer.settlements, vId],
            },
            vId,
            paid.board
          ),
        },
      };

      const winner = checkForWinner(newState);
      if (winner) return { ...newState, phase: "game_over", winner };

      return newState;
    }

    case "EDGE_CLICKED": {
      if (state.buildTradeMode !== "road") return state;
      if (!canBuild(player, "road")) return state;

      // ✅ Pay first (player -> bank), then place road (atomic-ish; payment doesn't affect placement validity)
      const paid = transferInState(
        state,
        { type: "player", playerId },
        { type: "bank" },
        BUILD_COSTS.road
      );
      if (!paid) return state;

      const placed = placeRoad(paid, playerId, action.edgeId);
      if (!placed) return state;

      return placed;
    }

    // ======================
    // BUY DEV CARD
    // ======================
    case "BUY_DEV_CARD": {
      if (!canBuild(player, "devCard")) return state;

      // ✅ Pay cost: player -> bank
      const paid = transferInState(
        state,
        { type: "player", playerId },
        { type: "bank" },
        BUILD_COSTS.devCard
      );
      if (!paid) return state;

      const [drawnCard, ...restDeck] = paid.devDeck;
      if (!drawnCard) return state; // no cards left (you might choose to refund; current behavior is "can't buy")

      const paidPlayer = paid.playerState[playerId];

      const updatedPlayerCards = {
        ...paidPlayer.devCards,
        [drawnCard]: (paidPlayer.devCards[drawnCard] || 0) + 1,
      };

      const newState: GameState = {
        ...paid,
        devDeck: restDeck,
        playerState: {
          ...paid.playerState,
          [playerId]: {
            ...paidPlayer,
            devCards: updatedPlayerCards,
          },
        },
      };

      // ✅ Only VP cards can immediately win on draw
      if (drawnCard === "victoryPoint") {
        const winner = checkForWinner(newState);
        if (winner) return { ...newState, phase: "game_over", winner };
      }

      return newState;
    }

    // ======================
    // BANK / PORT TRADE
    // ======================
    case "BANK_TRADE": {
      const { give, receive } = action;
      const ratio = getTradeRatio(player, give);

      const next = exchangeInState(
        state,
        { type: "player", playerId },
        { type: "bank" },
        { [give]: ratio },  // player pays ratio to bank
        { [receive]: 1 }    // bank pays 1 to player
      );

      // If player can't pay or bank can't supply, do nothing
      if (!next) return state;

      return next;
    }

    // END TURN
    case "END_TURN": {
      const nextIndex = (state.currentPlayerIndex + 1) % state.turnOrder.length;
      const nextPlayerId = state.turnOrder[nextIndex];

      return {
        ...state,
        currentPlayerIndex: nextIndex,
        currentPlayer: nextPlayerId,
        phase: "dice_roll",
        diceRolled: false,
        devCardPlayedThisTurn: false,
      };
    }

    default:
      return state;
  }
}
