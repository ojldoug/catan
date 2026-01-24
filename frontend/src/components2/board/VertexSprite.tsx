
// import type { Vertex } from "../../game2/StaticTypes/Vertex";



// interface Props {
//   vertex: Vertex;
//   size: number;
//   building: "none" | "settlement" | "city";
//   ownerColor: string | null;
// }

// export function VertexSprite({
//   size,
//   building,
//   ownerColor,
// }: Props) {
//   // absolutely nothing unless land + building
//   if (building === "none") return null;

//   const color = ownerColor || "gray";

//   return (
//     <div
//       style={{
//         width: size * 0.6,
//         height: size * 0.6,
//         backgroundColor: color,
//         borderRadius: 6,
//         border: "2px solid black",
//       }}
//     />
//   );
// }

interface Props {
  size: number;
  building: "none" | "settlement" | "city";
  ownerColor: string | null;
}

export function VertexSprite({ size, building, ownerColor }: Props) {
  if (building === "none") return null;

  const color = ownerColor ?? "gray";

  // --------------------
  // SETTLEMENT (unchanged)
  // --------------------
  if (building === "settlement") {
    return (
      <div
        style={{
          width: size * 0.25,
          height: size * 0.25,
          backgroundColor: color,
          borderRadius: 6,
          border: "2px solid black",
        }}
      />
    );
  }

  // --------------------
  // CITY (independent)
  // --------------------
  if (building === "city") {
    return (
      <div
        style={{
          width: 0.4*size,
          height: 0.4*size,
          borderRadius: "50%",
          backgroundColor: color,
          border: "2px solid black",
        }}
      />
    );
  }


  return null;
}
