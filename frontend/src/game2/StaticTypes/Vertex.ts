export interface Vertex {
  id: string;              // same as node id
  adjacentTiles: string[]; // tile-ids
  adjacentVertices: string[]; // tile-ids
}
