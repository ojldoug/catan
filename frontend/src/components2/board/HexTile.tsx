
import type { Tile } from "../../game2/StaticTypes/Tile";
import { resourceColor } from "../Colors";
import { environmentColor } from "../Colors";

interface Props {
  tile: Tile;
  size: number;
}

export function HexTile({ tile, size }: Props) {
  if (tile.resource === "sea") return null;

  const color = resourceColor[tile.resource];

  const w = Math.sqrt(3) * size;
  const h = 2 * size;

  const beachSize = size * 1.12;
  const beachW = Math.sqrt(3) * beachSize;
  const beachH = 2 * beachSize;

  const circleDiameter = 0.6 * size;

  const points = `
    50% 0%,
    100% 25%,
    100% 75%,
    50% 100%,
    0% 75%,
    0% 25%
  `;

  return (
    <div
      style={{
        position: "relative",
        width: beachW,
        height: beachH,
      }}
    >
      {/* --- PERFECTLY CENTERED BEACH HEX --- */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: beachW,
          height: beachH,
          transform: "translate(-50%, -50%)",
          background: environmentColor.beach,
          clipPath: `polygon(${points})`,
          zIndex: 0,
        }}
      />

      {/* --- PERFECTLY CENTERED TILE HEX --- */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: w,
          height: h,
          transform: "translate(-50%, -50%)",
          background: color,
          clipPath: `polygon(${points})`,
          zIndex: 1,
        }}
      >
        {tile.token != null && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: circleDiameter,
              height: circleDiameter,
              borderRadius: "50%",
              background: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              style={{
                fontWeight: "bold",
                fontSize: circleDiameter / 1.5,
                color:
                  tile.token === 6 || tile.token === 8 ? "red" : "black",
              }}
            >
              {tile.token}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

