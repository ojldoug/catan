import type { Tile } from "../../StaticTypes/Tile";
import type { GeneratedMaps } from "./generateNodeMap";

const TOKEN_PRIORITY: number[] = [6, 8, 5, 9, 4, 10, 3, 11, 2, 12];

// hex adjacency offsets
const DELTAS: [number, number][] = [
  [1, -1],
  [2, 1],
  [1, 2],
  [-1, 1],
  [-2, -1],
  [-1, -2],
];

export function populateTokens(maps: GeneratedMaps): Record<string, Tile> {
  const { tiles, nodeMatrix } = maps;

  // ------------------------------------------------------
  // Build tileId -> node {x,y} lookup
  // ------------------------------------------------------
  const tileNodes: Record<string, { x: number; y: number }> = {};
  for (const row of nodeMatrix) {
    for (const node of row) {
      if (node.type === "tile") tileNodes[node.id] = { x: node.x, y: node.y };
    }
  }

  // ------------------------------------------------------
  // Filter tiles that can get a number
  // ------------------------------------------------------
  const tokenableTiles = Object.values(tiles).filter(
    (t) => t.resource !== "desert" && t.resource !== "sea"
  );

  // ------------------------------------------------------
  // Compute token counts
  // ------------------------------------------------------
  const T = tokenableTiles.length;
  const base = Math.floor(T / 10);
  const rem = T % 10;

  const tokenCounts: Record<number, number> = {};
  TOKEN_PRIORITY.forEach((token, i) => {
    tokenCounts[token] = base + (i < rem ? 1 : 0);
  });

  // ------------------------------------------------------
  // TEMPORARY adjacency flags (not stored in Tile!)
  // ------------------------------------------------------
  const sixEightBlocked = new Map<string, boolean>();

  function markNeighbours(tile: Tile) {
    const p = tileNodes[tile.id];
    for (const [dx, dy] of DELTAS) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const n = nodeMatrix[ny]?.[nx];
      if (!n || n.type !== "tile") continue;

      const neigh = tiles[n.id];
      if (neigh.resource === "desert" || neigh.resource === "sea") continue;

      sixEightBlocked.set(n.id, true);
    }
  }

  // ------------------------------------------------------
  // Assign 6s and 8s first (strict rule)
  // ------------------------------------------------------
  const remaining = [...tokenableTiles];
  const assigned: Tile[] = [];

  for (const HOT of [6, 8]) {
    let count = tokenCounts[HOT];

    while (count-- > 0) {
      // tiles not adjacent to a placed 6/8
      const valid = remaining.filter((t) => !sixEightBlocked.get(t.id));

      const chosen =
        valid.length > 0
          ? valid[Math.random() * valid.length | 0]
          : remaining[Math.random() * remaining.length | 0];

      chosen.token = HOT;
      assigned.push(chosen);

      markNeighbours(chosen);

      remaining.splice(remaining.indexOf(chosen), 1);
    }
  }

  // ------------------------------------------------------
  // Assign all other tokens (randomised)
  // ------------------------------------------------------
  const restTokens: number[] = [];
  TOKEN_PRIORITY.forEach((t) => {
    if (t === 6 || t === 8) return;
    for (let i = 0; i < tokenCounts[t]; i++) restTokens.push(t);
  });

  // shuffle
  for (let i = restTokens.length - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    [restTokens[i], restTokens[j]] = [restTokens[j], restTokens[i]];
  }

  remaining.forEach((tile, i) => {
    tile.token = restTokens[i];
    assigned.push(tile);
  });

  // ------------------------------------------------------
  // Return updated tile map
  // ------------------------------------------------------
  const updated: Record<string, Tile> = {};
  for (const t of Object.values(tiles)) {
    updated[t.id] = assigned.find((a) => a.id === t.id) ?? t;
  }

  return updated;
}
