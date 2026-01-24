import type { Vertex } from "../../StaticTypes/Vertex";
import type { Tile } from "../../StaticTypes/Tile";
import type { Edge } from "../../StaticTypes/Edge";
import type { BoardGeometry } from "../../state/GameState";
import type { PlayerState } from "../../state/GameState";
import type { ResourceType } from "../../StaticTypes/ResourceTypes";

export function isBuildableLandVertex(
  vertex: Vertex,
  tiles: Record<string, Tile>
): boolean {
  return vertex.adjacentTiles.some(
    (tid) => tiles[tid]?.resource !== "sea"
  );
}

export function isBuildableLandEdge(
  edge: Edge,
  tiles: Record<string, Tile>
): boolean {
  return edge.adjacentTiles.some(
    (tid) => tiles[tid]?.resource !== "sea"
  );
}

export function grantPortsForVertex(
  player: PlayerState,
  vertexId: string,
  board: BoardGeometry
): PlayerState {
  const vertex = board.vertices[vertexId];
  if (!vertex) return player;

  // copy ports to avoid mutating original
  const updatedPorts = { ...player.ports };

  // find all edges touching this vertex
  const edges = Object.values(board.edges).filter((edge) =>
    edge.Vertex_IDs.includes(vertexId)
  );

  for (const edge of edges) {
    const port = edge.port;
    if (!port) continue;

    if (port === "3to1") {
      updatedPorts.any = true;
    } else {
      updatedPorts[port as ResourceType] = true;
    }
  }

  return {
    ...player,
    ports: updatedPorts,
  };
}