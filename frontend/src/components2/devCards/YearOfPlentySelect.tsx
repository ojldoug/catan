import React, { useEffect, useState } from "react";
import type { ResourceType } from "../../game2/StaticTypes/ResourceTypes";
import type { BankResources } from "../../game2/state/GameState";

type Picks = Partial<Record<ResourceType, number>>;

interface Props {
  bankResources: BankResources;
  onConfirm: (picks: Picks) => void;
}

const RESOURCE_ORDER: ResourceType[] = ["wood", "brick", "sheep", "wheat", "ore"];

export function YearOfPlentySelect({ bankResources, onConfirm }: Props) {
  const [picks, setPicks] = useState<Picks>({
    wood: 0,
    brick: 0,
    sheep: 0,
    wheat: 0,
    ore: 0,
  });

  // reset when opened (bankResources changes as a decent proxy)
  useEffect(() => {
    setPicks({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
  }, [bankResources.wood, bankResources.brick, bankResources.sheep, bankResources.wheat, bankResources.ore]);

  const totalPicked = RESOURCE_ORDER.reduce((sum, r) => sum + (picks[r] ?? 0), 0);

  const increment = (r: ResourceType) => {
    const current = picks[r] ?? 0;

    // Cannot exceed bank availability, and total cannot exceed 2
    if (current < bankResources[r] && totalPicked < 2) {
      setPicks({ ...picks, [r]: current + 1 });
    }
  };

  const decrement = (r: ResourceType) => {
    const current = picks[r] ?? 0;
    if (current > 0) {
      setPicks({ ...picks, [r]: current - 1 });
    }
  };

  const handleConfirm = () => {
    if (totalPicked === 2) onConfirm(picks);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 14,
          width: 300,
          color: "white",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Year of Plenty</h3>
        <div style={{ marginBottom: 10, color: "#bbb" }}>
          Choose exactly 2 resource cards from the bank.
        </div>

        <div style={{ marginBottom: 10 }}>
          {RESOURCE_ORDER.map((res) => (
            <div
              key={res}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span>{res}</span>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => decrement(res)}>-</button>
                <span style={{ width: 16, textAlign: "center" }}>{picks[res] ?? 0}</span>
                <button
                  onClick={() => increment(res)}
                  disabled={(picks[res] ?? 0) >= bankResources[res] || totalPicked >= 2}
                >
                  +
                </button>
                <span style={{ color: "#888" }}>/ {bankResources[res]}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 10 }}>
          Total selected: {totalPicked} / 2
        </div>

        <button
          onClick={handleConfirm}
          disabled={totalPicked !== 2}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            cursor: totalPicked === 2 ? "pointer" : "not-allowed",
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
