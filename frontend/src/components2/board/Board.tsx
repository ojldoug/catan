import { environmentColor } from "../Colors";

import { HexTile } from "./HexTile";
import { VertexSprite } from "./VertexSprite";
import { PortSprite } from "./PortSprite";
import { RoadSprite } from "./RoadSprite";
import { RobberSprite } from "./RobberSprite";

import type { Node } from "../../game2/StaticTypes/Node";
import type { Tile } from "../../game2/StaticTypes/Tile";
import type { Vertex } from "../../game2/StaticTypes/Vertex";
import type { VertexState } from "../../game2/state/GameState";
import type { Edge } from "../../game2/StaticTypes/Edge";
import type { EdgeState } from "../../game2/state/GameState";
import type { PlayerState } from "../../game2/state/GameState";
import type { GamePhase } from "../../game2/state/GameState";
import type { RobberState } from "../../game2/state/GameState";
import type { GameAction } from "../../game2/state/GameAction";


interface Props {
  nodes: Node[];
  tiles: Record<string, Tile>;
  vertices: Record<string, Vertex>;
  vertexState: Record<string, VertexState>;
  edges: Record<string, Edge>;
  edgeState: Record<string, EdgeState>;
  size?: number;
  origin?: { x: number; y: number };
  playerState: Record<string, PlayerState>;
  robberTileId: string;

  phase: GamePhase;
  robberState: RobberState | null;
  currentPlayer: string;
  dispatch: React.Dispatch<GameAction>;

  onVertexClick?: (vertexId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onTileClick?: (tileId: string) => void;
}

export function Board({
  nodes,
  tiles,
  vertices,
  vertexState,
  edges,
  edgeState,
  origin = { x: 150, y: 350 },
  size = 80,
  playerState,
  robberTileId,

  phase,
  robberState,
  dispatch,

  onVertexClick,
  onEdgeClick,
  onTileClick,
}: Props) {
  const sqrt3 = Math.sqrt(3);

  // Node lookup
  const nodeMap: Record<string, Node> = {};
  for (const n of nodes) nodeMap[n.id] = n;

  // Coordinate functions
  const mapX = (x: number) => 0.5 * size * sqrt3 * x + origin.x;
  const mapY = (x: number, y: number) => size * (y - 0.5 * x) + origin.y;

  // Precompute vertex pixel positions
  const vertexPos: Record<string, { x: number; y: number }> = {};
  for (const v of Object.values(vertices)) {
    const node = nodeMap[v.id];
    if (!node) continue;
    vertexPos[v.id] = {
      x: mapX(node.x),
      y: mapY(node.x, node.y),
    };
  }

  // Determine if in STEAL mode
  const isStealMode =
    phase === "robber" &&
    robberState?.step === "steal" &&
    Array.isArray(robberState.stealCandidates) &&
    robberState.stealCandidates.length > 1;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: environmentColor.sea, // FULL SCREEN SEA
      }}
    >

      {/* ---------------------------------- */}
      {/*              PORTS                 */}
      {/* ---------------------------------- */}
      {Object.values(edges).map((edge) => {
        if (!edge.port) return null;

        const [v1Id, v2Id] = edge.Vertex_IDs;
        const p1 = vertexPos[v1Id];
        const p2 = vertexPos[v2Id];
        if (!p1 || !p2) return null;

        return (
          <PortSprite
            key={edge.id}
            edge={edge}
            v1={p1}
            v2={p2}
            size={size * 0.4}
          />
        );
      })}


      {/* ---------------------------------- */}
      {/*              ROADS                 */}
      {/* ---------------------------------- */}
      {Object.values(edges).map((edge) => {
        const [v1Id, v2Id] = edge.Vertex_IDs;
        const p1 = vertexPos[v1Id];
        const p2 = vertexPos[v2Id];
        if (!p1 || !p2) return null;

        const state = edgeState[edge.id];
        const owner = state?.ownerId ? playerState[state.ownerId] : null;

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        return (
          <div
            key={edge.id}
            style={{
              position: "absolute",
              left: midX,
              top: midY,
              transform: "translate(-50%, -50%)",
              zIndex: 9,

              width: size * 0.4,
              height: size * 0.4,
              borderRadius: "50%",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              cursor: "pointer",
              pointerEvents: "auto",

              // DEBUG if needed
              // backgroundColor: "rgba(0,0,255,0.15)",
            }}
            onClick={() => {
              console.log("EDGE CLICKED:", edge.id);
              onEdgeClick?.(edge.id);
            }}
          >
            <RoadSprite
              size={size * 0.2}
              ownerColor={owner?.color ?? null}
            />
          </div>
        );
      })}


      {/* ---------------------------------- */}
      {/*            HEX TILES               */}
      {/* ---------------------------------- */}
      {Object.values(tiles).map((tile) => {
        const node = nodeMap[tile.id];
        if (!node) return null;

        const x = mapX(node.x);
        const y = mapY(node.x, node.y);

        return (
          <div
            key={tile.id}
            onClick={() => onTileClick?.(tile.id)}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              cursor: "pointer",
              zIndex: 2,
              pointerEvents: "auto",
            }}
          >
            <HexTile tile={tile} size={0.95 * size} />
          </div>
        );
      })}


      {/* ---------------------------------- */}
      {/*             VERTICES               */}
      {/* ---------------------------------- */}
      {Object.values(vertices).map((vertex) => {
      const pos = vertexPos[vertex.id];
      if (!pos) return null;

        const state = vertexState[vertex.id];
        const owner = state?.ownerId ? playerState[state.ownerId] : null;
        const isStealableVertex =
          isStealMode &&
          state?.ownerId &&
          robberState!.stealCandidates!.includes(state.ownerId);
        
        return (
          <div
            key={vertex.id}
            onClick={() => {
              console.log("VERTEX CLICKED:", vertex.id);
              if (isStealableVertex) {
                dispatch({
                  type: "STEAL_RESOURCE",
                  victimId: state!.ownerId!,
                });
                return;
              }

              onVertexClick?.(vertex.id);
            }}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -50%)",

              // 🎯 CLICK RADIUS (always exists)
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: "50%",

              backgroundColor: isStealableVertex
              ? "rgba(255, 0, 0, 0.25)"
              : undefined,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              cursor: isStealableVertex ? "pointer" : "pointer",
              pointerEvents: "auto",
              zIndex: 10,

              // 🔍 debug if needed
              // backgroundColor: "rgba(255,0,0,0.15)",
            }}
          >
            {/* 👇 VISUAL ONLY */}
            <VertexSprite
              size={size}
              building={state?.building ?? "none"}
              ownerColor={owner?.color ?? null}
            />
          </div>
        );
      })}


      {/* ---------------------------------- */}
      {/*              ROBBER                */}
      {/* ---------------------------------- */}
      {robberTileId && tiles[robberTileId] && (() => {
        const tile = tiles[robberTileId];
        const node = nodeMap[tile.id];
        if (!node) return null;

        const x = mapX(node.x) - size * 0.2; // optional offset
        const y = mapY(node.x, node.y) + size * 0.2; // optional offset

        return (
          <div
            key={`robber-${tile.id}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              cursor: "pointer",
              zIndex: 20, // above tiles and vertices
              pointerEvents: "none", // robber is visual only
            }}
          >
            <RobberSprite size={size} />
          </div>
        );
      })()}


    </div>
  );
}
