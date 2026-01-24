import type { TileType } from "./TileType";

export interface Tile {
  id: string;           // same as node id
  resource: TileType;
  token: number | null;
  adjacentVertices: string[]; // vertex IDs
}
