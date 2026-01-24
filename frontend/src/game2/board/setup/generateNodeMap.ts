import { type Node } from "../../StaticTypes/Node";
import { type Tile } from "../../StaticTypes/Tile";
import { type Vertex } from "../../StaticTypes/Vertex";
import { type Edge } from "../../StaticTypes/Edge";
import { generateTileMap } from "./generateTileMap";

export interface GeneratedMaps {
  nodeMatrix: Node[][];
  tiles: Record<string, Tile>;
  vertices: Record<string, Vertex>;
  edges: Record<string, Edge>;
}

export function generateNodeMap(): GeneratedMaps {
  const tileMap = generateTileMap();
  const rows = tileMap.length;
  const cols = tileMap[0].length;

  const nodeCols = 3 * cols;
  const nodeRows = rows;

  const nodeMatrix: Node[][] = Array.from({ length: nodeRows }, () =>
    Array.from({ length: nodeCols }, () => null as any)
  );

  const tiles: Record<string, Tile> = {};
  const vertices: Record<string, Vertex> = {};
  const edges: Record<string, Edge> = {};

  // ----------------------------------------------------
  // 1. Place tile nodes
  // ----------------------------------------------------
  for (let y_tile = 0; y_tile < rows; y_tile++) {
    for (let x_tile = 0; x_tile < cols; x_tile++) {
      const raw = tileMap[y_tile][x_tile];
      const resource = raw === 1 ? "desert" : "sea";

      const x_node = 3 * x_tile + (((-y_tile) % 3 + 3) % 3);
      const y_node = y_tile;

      const id = `N_${x_node}_${y_node}`;

      nodeMatrix[y_node][x_node] = {
        id,
        type: "tile",
        x: x_node,
        y: y_node,
      };

      tiles[id] = {
        id,
        resource,
        token: null,
        adjacentVertices: [], // filled below
      };
    }
  }

  // ----------------------------------------------------
  // 2. Create vertex nodes
  // ----------------------------------------------------
  for (let y = 0; y < nodeRows; y++) {
    for (let x = 0; x < nodeCols; x++) {
      if (nodeMatrix[y][x]) continue; // skip tile nodes

      const id = `N_${x}_${y}`;

      nodeMatrix[y][x] = {
        id,
        type: "vertex",
        x,
        y,
      };

      vertices[id] = {
        id,
        adjacentTiles: [],      // filled below
        adjacentVertices: [],   // filled below
      };
    }
  }

  // ----------------------------------------------------
  // 3. Compute adjacency for vertices
  // ----------------------------------------------------
  function getNode(x: number, y: number): Node | null {
    if (x < 0 || y < 0 || y >= nodeRows || x >= nodeCols) return null;
    return nodeMatrix[y][x];
  }

  for (const vid in vertices) {
    const v = vertices[vid];
    const node = getNode(parseInt(v.id.split("_")[1]), parseInt(v.id.split("_")[2]))!;
    const i = node.x;
    const j = node.y;

    const a = 1 - 2 * (((i + j + 2) % 3 + 3) % 3);

    // -----------------------
    // Adjacent tiles
    // -----------------------
    const tileCoords = [
      [i - a, j],
      [i, j - a],
      [i + a, j + a],
    ];

    for (const [tx, ty] of tileCoords) {
      const tNode = getNode(tx, ty);
      if (tNode && tNode.type === "tile") {
        v.adjacentTiles.push(tNode.id);
      }
    }

    // -----------------------
    // Adjacent vertices
    // -----------------------
    const vertCoords = [
      [i + a, j],
      [i, j + a],
      [i - a, j - a],
    ];

    for (const [vx, vy] of vertCoords) {
      const n = getNode(vx, vy);
      if (n && n.type === "vertex") {
        v.adjacentVertices.push(n.id);
      }
    }
  }

  // ----------------------------------------------------
  // 4. Compute tile → adjacent vertices
  // ----------------------------------------------------
  for (const tileId in tiles) {
    tiles[tileId].adjacentVertices = Object.values(vertices)
      .filter(v => v.adjacentTiles.includes(tileId))
      .map(v => v.id);
  }

  return { nodeMatrix, tiles, vertices, edges };
}
