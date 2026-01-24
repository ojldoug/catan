// components2/board/RoadSprite.tsx
interface Props {
  size: number;
  ownerColor: string | null;
}

export function RoadSprite({ size, ownerColor }: Props) {
  if (!ownerColor) return null;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: ownerColor,
        border: "2px solid black",
      }}
    />
  );
}
