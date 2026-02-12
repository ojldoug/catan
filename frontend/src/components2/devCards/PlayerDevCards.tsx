import type { DevCardType } from "../../game2/StaticTypes/DevCardTypes";

type Props = {
  devCardsOwned: Record<DevCardType, number>;
  onPlay: (type: DevCardType) => void;
};

export function PlayerDevCards({ devCardsOwned, onPlay }: Props) {
  const entries = Object.entries(devCardsOwned) as [DevCardType, number][];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
      {entries.map(([type, count]) => {
        if (count <= 0) return null;

        // 🎖 Victory Points — visible but NOT playable
        if (type === "victoryPoint") {
          return (
            <div
              key={type}
              style={{
                padding: "6px 10px",
                background: "#141414",
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              Victory Point × {count}
            </div>
          );
        }

        // 🃏 All other dev cards are playable buttons
        return (
          <button
            key={type}
            onClick={() => onPlay(type)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {type} × {count}
          </button>
        );
      })}
    </div>
  );
}
