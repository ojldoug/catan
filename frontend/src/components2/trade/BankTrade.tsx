import React, { useState, useEffect } from "react";
import type { PlayerResources, PlayerState } from "../../game2/state/GameState";
import type { ResourceType } from "../../game2/StaticTypes/ResourceTypes";

interface BankTradeProps {
  playerId: string;
  playerState: PlayerState;
  onConfirm: (give: ResourceType, receive: ResourceType) => void;
  onCancel?: () => void;
}

const RESOURCE_ORDER: ResourceType[] = ["wood", "brick", "sheep", "wheat", "ore"];

export function BankTrade({ playerId, playerState, onConfirm, onCancel }: BankTradeProps) {
  const [give, setGive] = useState<ResourceType | null>(null);
  const [receive, setReceive] = useState<ResourceType | null>(null);

  // Helper to get trade ratio
  const getTradeRatio = (resource: ResourceType) => {
    if (playerState.ports[resource]) return 2;
    if (playerState.ports.any) return 3;
    return 4;
  };

  // Can confirm only if selection valid and player has enough to trade
  const canConfirm = give && receive && playerState.resources[give] >= getTradeRatio(give);

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
        width: 300,
        color: "black",
      }}
    >
      <h3>Bank / Port Trade</h3>

      <div style={{ marginBottom: 10 }}>
        <strong>Your Resources:</strong>
        {RESOURCE_ORDER.map((res) => (
          <div key={res} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{res.charAt(0).toUpperCase() + res.slice(1)}:</span>
            <span>{playerState.resources[res]}</span>
            <span style={{ fontSize: 12, color: "#555" }}>
              ({getTradeRatio(res)}:1)
            </span>
            <button
              onClick={() => setGive(res)}
              disabled={playerState.resources[res] < getTradeRatio(res)}
              style={{
                marginLeft: 4,
                color: "black",
                background: give === res ? "#88f" : "#eee",
                cursor: playerState.resources[res] >= getTradeRatio(res) ? "pointer" : "not-allowed",
              }}
            >
              Give
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <strong>Select Resource to Receive:</strong>
        {RESOURCE_ORDER.map((res) => (
          <button
            key={res}
            onClick={() => setReceive(res)}
            style={{
              margin: 2,
              color: "black",
              background: receive === res ? "#8f8" : "#eee",
            }}
          >
            {res.charAt(0).toUpperCase() + res.slice(1)}
          </button>
        ))}
      </div>

      <button
        onClick={() => give && receive && onConfirm(give, receive)}
        disabled={!canConfirm}
        style={{
          padding: "6px 12px",
          cursor: canConfirm ? "pointer" : "not-allowed",
          marginRight: 8,
        }}
      >
        Confirm Trade
      </button>
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            color: "black",
            padding: "6px 12px",
            background: "#ccc",
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
