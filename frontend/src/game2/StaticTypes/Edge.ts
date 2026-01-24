//import type { TileType } from "./TileType";
import type { ResourceType } from "./ResourceTypes";

export interface Edge {
  id: string;            
  Vertex_IDs: [string, string];
  adjacentTiles: string[];
  port: ResourceType | "3to1" | null;
}