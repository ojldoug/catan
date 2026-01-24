interface Props {
  size: number;
}

export function RobberSprite({ size }: Props) {
  return (
    <div
      style={{
        width: size * 0.35,
        height: size * 0.35,
        borderRadius: "50%",
        backgroundColor: "#414141",
        border: "2px solid black",
        boxShadow: "0 0 6px rgba(0,0,0,0.6)",
        pointerEvents: "none", // robber doesn't block clicks (important)
      }}
    />
  );
}
