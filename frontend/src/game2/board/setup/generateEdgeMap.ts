import type { Vertex } from "../../StaticTypes/Vertex";
import type { Edge } from "../../StaticTypes/Edge";

export function generateEdgeMap(
  vertices: Record<string, Vertex>
): Record<string, Edge> {
  const edges: Record<string, Edge> = {};
  const seen = new Set<string>();
  let edgeIdCounter = 0;

  for (const v of Object.values(vertices)) {
    for (const adjId of v.adjacentVertices) {
      const key =
        v.id < adjId ? `${v.id}_${adjId}` : `${adjId}_${v.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const other = vertices[adjId];
      if (!other) continue;

      // Tiles touching BOTH vertices define the edge adjacency
      const adjacentTiles = v.adjacentTiles.filter((tid) =>
        other.adjacentTiles.includes(tid)
      );

      const edgeId = `E_${edgeIdCounter++}`;

      edges[edgeId] = {
        id: edgeId,
        Vertex_IDs: [v.id, adjId],
        adjacentTiles,
        port: null,
      };
    }
  }

  return edges;
}