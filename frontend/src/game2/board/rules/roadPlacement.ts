import type { GameState } from "../../state/GameState";
import { isBuildableLandEdge } from "./placementRules";

export function placeRoad(
  state: GameState,
  playerId: string,
  edgeId: string
): GameState | null {
  const player = state.playerState[playerId];
  const edge = state.board.edges[edgeId];
  const edgeState = state.edgeState[edgeId];

  if (!edge || edgeState.ownerId !== null) return null;
  if (!isBuildableLandEdge(edge, state.board.tiles)) return null;

  const [v1, v2] = edge.Vertex_IDs;

  const touchesNetwork =
    state.vertexState[v1]?.ownerId === playerId ||
    state.vertexState[v2]?.ownerId === playerId ||
    player.roads.some(rid =>
      state.board.edges[rid].Vertex_IDs.includes(v1) ||
      state.board.edges[rid].Vertex_IDs.includes(v2)
    );

  if (!touchesNetwork) return null;

  return {
    ...state,
    edgeState: {
      ...state.edgeState,
      [edgeId]: { ownerId: playerId },
    },
    playerState: {
      ...state.playerState,
      [playerId]: {
        ...player,
        roads: [...player.roads, edgeId],
      },
    },
  };
}
