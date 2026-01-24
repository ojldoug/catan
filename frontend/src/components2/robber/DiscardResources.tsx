import React, { useState, useEffect } from "react";
import type { PlayerResources} from "../../game2/state/GameState";
import type { ResourceType } from "../../game2/StaticTypes/ResourceTypes";

interface DiscardResourcesProps {
  playerId: string;
  playerResources: PlayerResources;           // resources the player currently has
  maxDiscard: number;                         // number of cards to discard
  onConfirm: (discarded: PlayerResources) => void; // callback when player confirms discard
}

const RESOURCE_ORDER: ResourceType[] = ["wood", "brick", "sheep", "wheat", "ore"];

export function DiscardResources({
  playerId,
  playerResources,
  maxDiscard,
  onConfirm,
}: DiscardResourcesProps) {
  // Local state to track what the player wants to discard
  const [discardCount, setDiscardCount] = useState<PlayerResources>({
    wood: 0,
    brick: 0,
    sheep: 0,
    wheat: 0,
    ore: 0,
  });

  useEffect(() => {
    setDiscardCount({
      wood: 0,
      brick: 0,
      sheep: 0,
      wheat: 0,
      ore: 0,
    });
  }, [playerId]);

  // Total cards currently selected for discard
  const totalDiscarded = RESOURCE_ORDER.reduce(
    (sum, r) => sum + discardCount[r],
    0
  );

  const increment = (resource: ResourceType) => {
    if (
      discardCount[resource] < playerResources[resource] &&
      totalDiscarded < maxDiscard
    ) {
      setDiscardCount({
        ...discardCount,
        [resource]: discardCount[resource] + 1,
      });
    }
  };

  const decrement = (resource: ResourceType) => {
    if (discardCount[resource] > 0) {
      setDiscardCount({
        ...discardCount,
        [resource]: discardCount[resource] - 1,
      });
    }
  };

  const handleConfirm = () => {
    if (totalDiscarded === maxDiscard) {
      onConfirm(discardCount);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 50,
        left: 50,
        background: "white",
        padding: 20,
        border: "2px solid black",
        borderRadius: 8,
        zIndex: 50,
        width: 250,
        color: "black",
      }}
    >
      <h3>Discard Resources</h3>
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
            <span>{res.charAt(0).toUpperCase() + res.slice(1)}:</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={() => decrement(res)}>-</button>
              <span>{discardCount[res]}</span>
              <button onClick={() => increment(res)}>+</button>
              <span style={{ marginLeft: 4, color: "#555" }}>
                / {playerResources[res]}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 10 }}>
        Total discarded: {totalDiscarded} / {maxDiscard}
      </div>
      <button
        onClick={handleConfirm}
        disabled={totalDiscarded !== maxDiscard}
        style={{
          padding: "6px 12px",
          cursor: totalDiscarded === maxDiscard ? "pointer" : "not-allowed",
        }}
      >
        Confirm
      </button>
    </div>
  );
}
