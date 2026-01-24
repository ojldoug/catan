// components2/board/PortSprite.tsx
import type { Edge } from "../../game2/StaticTypes/Edge";
import type { ResourceType } from "../../game2/StaticTypes/TileType";
import { resourceColor } from "../Colors";

interface Props {
  edge: Edge;
  v1: { x: number; y: number };
  v2: { x: number; y: number };
  size: number;
}

export function PortSprite({ edge, v1, v2, size }: Props) {
  if (!edge.port) return null;

  const midX = (v1.x + v2.x) / 2;
  const midY = (v1.y + v2.y) / 2;

  let color = "white";
  if (edge.port !== "3to1") {
    color = resourceColor[edge.port as ResourceType] ?? "white";
  }

  const diameter = size * 1.8;

  return (
    <div
      style={{
        position: "absolute",
        left: midX - diameter / 2,
        top: midY - diameter / 2,
        width: diameter,
        height: diameter,
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: "0 0 4px rgba(0,0,0,0.4)",
        pointerEvents: "none",
      }}
    />
  );
}
