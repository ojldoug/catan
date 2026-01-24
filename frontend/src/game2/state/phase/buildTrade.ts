import type { GameState, PlayerState } from "../GameState";
import type { GameAction } from "../GameAction";
import type { PlayerResources } from "../GameState";
import type { ResourceType } from "../../StaticTypes/ResourceTypes";
import { grantPortsForVertex, isBuildableLandEdge, isBuildableLandVertex } from "../../board/rules/placementRules";


const BUILD_COSTS = {
  settlement: {
    wood: 1,
    brick: 1,
    sheep: 1,
    wheat: 1,
  },
  road: {
    wood: 1,
    brick: 1,
  },
  city: {
    wheat: 2,
    ore: 3,
  },
} as const;


type ResourceCost = Partial<Record<ResourceType, number>>;

// BUILD FUNCTIONS

function hasResources(
  resources: PlayerResources,
  cost: ResourceCost
): boolean {
  return (Object.keys(cost) as ResourceType[]).every(
    (r) => resources[r] >= (cost[r] ?? 0)
  );
}


function payResources(
  resources: PlayerResources,
  cost: ResourceCost
): PlayerResources {
  const updated: PlayerResources = { ...resources };

  (Object.keys(cost) as ResourceType[]).forEach((r) => {
    updated[r] -= cost[r] ?? 0;
  });

  return updated;
}

// TRADE FUNCTIONS
function getTradeRatio(player: PlayerState, resource: ResourceType): number {
  if (player.ports[resource]) return 2;    // specific 2:1 port
  if (player.ports.any) return 3;          // generic 3:1 port
  return 4;                                 // default bank trade
}

function performBankTrade(
  player: PlayerState,
  give: ResourceType,
  receive: ResourceType
): PlayerState {
  const ratio = getTradeRatio(player, give);

  if (player.resources[give] < ratio) return player; // not enough to trade

  return {
    ...player,
    resources: {
      ...player.resources,
      [give]: player.resources[give] - ratio,
      [receive]: player.resources[receive] + 1,
    },
  };
}



//REDUCER
export function buildReducer(
  state: GameState,
  action: GameAction
): GameState {
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

      // BUILD CITY
      if (state.buildTradeMode === "city") {
        if (
          vState.ownerId === playerId &&
          vState.building === "settlement"
        ) {
          if (!hasResources(player.resources, BUILD_COSTS.city)) return state;

          return {
            ...state,
            vertexState: {
              ...state.vertexState,
              [vId]: { building: "city", ownerId: playerId },
            },
            playerState: {
              ...state.playerState,
              [playerId]: {
                ...player,
                resources: payResources(player.resources, BUILD_COSTS.city),
                settlements: player.settlements.filter(id => id !== vId),
                cities: [...player.cities, vId],
              },
            },
          };
        }
      }

      // BUILD SETTLEMENT
      if (state.buildTradeMode !== "settlement") return state;
      if (vState.building !== "none") return state;
      if (!hasResources(player.resources, BUILD_COSTS.settlement)) return state;

      // ❌ DISTANCE RULE — no adjacent settlements or cities
      const adjacentOccupied = state.board.vertices[vId].adjacentVertices.some(
        (adjId) => {
          const adjState = state.vertexState[adjId];
          return adjState && adjState.building !== "none";
        }
      );

      if (adjacentOccupied) return state;

      // must touch own road
      const touchesOwnRoad = Object.values(state.board.edges).some(
        (edge) =>
          edge.Vertex_IDs.includes(vId) &&
          state.edgeState[edge.id]?.ownerId === playerId
      );

      if (!touchesOwnRoad) return state;

      return {
        ...state,
        vertexState: {
          ...state.vertexState,
          [vId]: { building: "settlement", ownerId: playerId },
        },
        playerState: {
          ...state.playerState,
          [playerId]: grantPortsForVertex(
            {
              ...player,
              resources: payResources(player.resources, BUILD_COSTS.settlement),
              settlements: [...player.settlements, vId],
            },
            vId,
            state.board
          ),
        },
      };

    }

    case "EDGE_CLICKED": {
      if (state.buildTradeMode !== "road") return state;
      
      const eId = action.edgeId;
      const eState = state.edgeState[eId];
      const edge = state.board.edges[eId];

      if (!isBuildableLandEdge(edge, state.board.tiles)) return state;
      if (!edge || eState.ownerId !== null) return state;
      if (!hasResources(player.resources, BUILD_COSTS.road)) return state;

      const [v1, v2] = edge.Vertex_IDs;
      const touchesNetwork =
        state.vertexState[v1]?.ownerId === playerId ||
        state.vertexState[v2]?.ownerId === playerId ||
        player.roads.some(rid =>
          state.board.edges[rid].Vertex_IDs.includes(v1) ||
          state.board.edges[rid].Vertex_IDs.includes(v2)
        );

      if (!touchesNetwork) return state;

      return {
        ...state,
        edgeState: {
          ...state.edgeState,
          [eId]: { ownerId: playerId },
        },
        playerState: {
          ...state.playerState,
          [playerId]: {
            ...player,
            resources: payResources(player.resources, BUILD_COSTS.road),
            roads: [...player.roads, eId],
          },
        },
      };
    }

    // TRADING ACTIONS

    // BANK TRADE

    case "BANK_TRADE": {
      const { give, receive } = action;
      const updatedPlayer = performBankTrade(player, give, receive);

      return {
        ...state,
        playerState: {
          ...state.playerState,
          [playerId]: updatedPlayer,
        },
      };
    }


    // END TURN
    case "END_TURN": {
      const nextIndex =
        (state.currentPlayerIndex + 1) % state.turnOrder.length;

      return {
        ...state,
        currentPlayerIndex: nextIndex,
        currentPlayer: state.turnOrder[nextIndex],
        phase: "dice_roll",
        diceRolled: false,
      };
    }

    default:
      return state;
  }
}
