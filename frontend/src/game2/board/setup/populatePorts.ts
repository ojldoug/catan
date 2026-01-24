// import type { ResourceType } from "../../StaticTypes/ResourceTypes";
// import type { Vertex } from "../../StaticTypes/Vertex";
// import type { Edge } from "../../StaticTypes/Edge";
// import type { GeneratedMaps } from "./generateNodeMap";

// /**
//  * Annotate existing edges with ports
//  * - DOES NOT create edges
//  * - Mutates maps.edges in-place
//  */
// export function populatePorts(maps: GeneratedMaps): void {
//   const { tiles, vertices, edges } = maps;

//   const nonSeaTiles = Object.values(tiles).filter(
//     (t) => t.resource !== "sea"
//   );
//   const T = nonSeaTiles.length;

//   const nThreeOnePorts = Math.round(0.86 * Math.sqrt(T));
//   const nTwoOnePorts = Math.round(1.05 * Math.sqrt(T));

//   const resourceTypes: ResourceType[] = [
//     "wood",
//     "brick",
//     "sheep",
//     "wheat",
//     "ore",
//   ];

//   // Allocate 2:1 ports evenly
//   const basePerResource = Math.floor(
//     nTwoOnePorts / resourceTypes.length
//   );
//   let remainder = nTwoOnePorts % resourceTypes.length;

//   const resourcePortCounts: Record<string, number> = {};
//   resourceTypes.forEach((r) => (resourcePortCounts[r] = basePerResource));

//   while (remainder > 0) {
//     const r =
//       resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
//     resourcePortCounts[r]++;
//     remainder--;
//   }

//   const usedVertexIds = new Set<string>();

//   // ---------------- Helpers ----------------

//   function shuffle<T>(arr: T[]) {
//     for (let i = arr.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [arr[i], arr[j]] = [arr[j], arr[i]];
//     }
//   }

//   function findEdge(
//     v1: string,
//     v2: string
//   ): Edge | null {
//     return (
//       Object.values(edges).find(
//         (e) =>
//           (e.Vertex_IDs[0] === v1 && e.Vertex_IDs[1] === v2) ||
//           (e.Vertex_IDs[0] === v2 && e.Vertex_IDs[1] === v1)
//       ) ?? null
//     );
//   }

//   function buildCoastalPairs(
//     filter?: (v: Vertex) => boolean
//   ): [Vertex, Vertex][] {
//     const pairs: [Vertex, Vertex][] = [];

//     for (const v of Object.values(vertices)) {
//       if (!v.land || !v.sea || usedVertexIds.has(v.id)) continue;
//       if (filter && !filter(v)) continue;

//       for (const vid of v.adjacentVertices) {
//         const other = vertices[vid];
//         if (!other) continue;
//         if (!other.land || !other.sea || usedVertexIds.has(other.id))
//           continue;
//         if (filter && !filter(other)) continue;

//         if (v.id < other.id) {
//           const edge = findEdge(v.id, other.id);
//           if (edge) pairs.push([v, other]);
//         }
//       }
//     }

//     return pairs;
//   }

//   // ---------------- 2:1 Resource Ports ----------------

//   for (const resource of resourceTypes) {
//     let count = resourcePortCounts[resource];
//     if (count <= 0) continue;

//     const pairFilter = (v: Vertex) =>
//       v.adjacentTiles.every(
//         (tid) => (tiles[tid]?.resource ?? "sea") !== resource
//       );

//     const pairs = buildCoastalPairs(pairFilter);
//     shuffle(pairs);

//     for (const [v1, v2] of pairs) {
//       if (count <= 0) break;
//       if (usedVertexIds.has(v1.id) || usedVertexIds.has(v2.id))
//         continue;

//       const edge = findEdge(v1.id, v2.id);
//       if (!edge) continue;

//       edge.port = resource;

//       usedVertexIds.add(v1.id);
//       usedVertexIds.add(v2.id);
//       count--;
//     }
//   }

//   // ---------------- 3:1 Ports ----------------

//   let threeOneCount = nThreeOnePorts;
//   if (threeOneCount > 0) {
//     const pairs = buildCoastalPairs();
//     shuffle(pairs);

//     for (const [v1, v2] of pairs) {
//       if (threeOneCount <= 0) break;
//       if (usedVertexIds.has(v1.id) || usedVertexIds.has(v2.id))
//         continue;

//       const edge = findEdge(v1.id, v2.id);
//       if (!edge) continue;

//       edge.port = "3to1";

//       usedVertexIds.add(v1.id);
//       usedVertexIds.add(v2.id);
//       threeOneCount--;
//     }
//   }
// }


import type { ResourceType } from "../../StaticTypes/ResourceTypes";
import type { Edge } from "../../StaticTypes/Edge";
import type { GeneratedMaps } from "./generateNodeMap";

/**
 * Annotate existing edges with ports
 * - DOES NOT create edges
 * - Mutates maps.edges in-place
 */
export function populatePorts(maps: GeneratedMaps): void {
  const { tiles, edges } = maps;

  const nonSeaTiles = Object.values(tiles).filter(
    (t) => t.resource !== "sea"
  );
  const T = nonSeaTiles.length;

  const nThreeOnePorts = Math.round(0.86 * Math.sqrt(T));
  const nTwoOnePorts = Math.round(1.05 * Math.sqrt(T));

  const resourceTypes: ResourceType[] = [
    "wood",
    "brick",
    "sheep",
    "wheat",
    "ore",
  ];

  // Allocate 2:1 ports evenly
  const basePerResource = Math.floor(
    nTwoOnePorts / resourceTypes.length
  );
  let remainder = nTwoOnePorts % resourceTypes.length;

  const resourcePortCounts: Record<ResourceType, number> = {} as any;
  resourceTypes.forEach((r) => (resourcePortCounts[r] = basePerResource));

  while (remainder > 0) {
    const r =
      resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    resourcePortCounts[r]++;
    remainder--;
  }

  const usedVertexIds = new Set<string>();
  const usedSeaTileIds = new Set<string>();

  // ---------------- Helpers ----------------

  function shuffle<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function getSeaTileId(edge: Edge): string | null {
    if (edge.adjacentTiles.length !== 2) return null;

    const seaTiles = edge.adjacentTiles.filter(
      (tid) => tiles[tid].resource === "sea"
    );

    if (seaTiles.length !== 1) return null;
    return seaTiles[0];
  }

  function isEligibleEdge(edge: Edge): boolean {
    const seaTileId = getSeaTileId(edge);
    if (!seaTileId) return false;

    const [v1, v2] = edge.Vertex_IDs;
    if (usedVertexIds.has(v1) || usedVertexIds.has(v2)) return false;
    if (usedSeaTileIds.has(seaTileId)) return false;

    return true;
  }

  // ---------------- Collect coastal edges ----------------

  const coastalEdges = Object.values(edges).filter(
    (e) => getSeaTileId(e) !== null
  );

  // ---------------- 2:1 Resource Ports ----------------

  for (const resource of resourceTypes) {
    let count = resourcePortCounts[resource];
    if (count <= 0) continue;

    const candidates = coastalEdges.filter((edge) => {
      if (!isEligibleEdge(edge)) return false;

      // Resource restriction: land tile must NOT be of this resource
      const landTileId = edge.adjacentTiles.find(
        (tid) => tiles[tid].resource !== "sea"
      );
      if (!landTileId) return false;

      return tiles[landTileId].resource !== resource;
    });

    shuffle(candidates);

    for (const edge of candidates) {
      if (count <= 0) break;
      if (!isEligibleEdge(edge)) continue;

      const seaTileId = getSeaTileId(edge);
      if (!seaTileId) continue;

      edge.port = resource;

      usedSeaTileIds.add(seaTileId);
      usedVertexIds.add(edge.Vertex_IDs[0]);
      usedVertexIds.add(edge.Vertex_IDs[1]);

      count--;
    }
  }

  // ---------------- 3:1 Ports ----------------

  let threeOneCount = nThreeOnePorts;
  if (threeOneCount > 0) {
    const candidates = coastalEdges.slice();
    shuffle(candidates);

    for (const edge of candidates) {
      if (threeOneCount <= 0) break;
      if (!isEligibleEdge(edge)) continue;

      const seaTileId = getSeaTileId(edge);
      if (!seaTileId) continue;

      edge.port = "3to1";

      usedSeaTileIds.add(seaTileId);
      usedVertexIds.add(edge.Vertex_IDs[0]);
      usedVertexIds.add(edge.Vertex_IDs[1]);

      threeOneCount--;
    }
  }
}
