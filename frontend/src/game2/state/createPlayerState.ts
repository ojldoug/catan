import type { DevCardType } from "../StaticTypes/DevCardTypes";
import type { PlayerState } from "./GameState";

const PLAYER_COLORS: Record<string, string> = {
  player1: "orange",
  player2: "blue",
  player3: "green",
  player4: "pink",
};

function emptyDevCards(): Record<DevCardType, number> {
  return {
    knight: 0,
    monopoly: 0,
    roadBuilding: 0,
    yearOfPlenty: 0,
    victoryPoint: 0,
  };
}

export function createPlayerState(playerId: string): PlayerState {
  return {
    playerId,
    color: PLAYER_COLORS[playerId] ?? "gray",
    resources: { brick: 0, wood: 0, sheep: 0, wheat: 0, ore: 0 },
    roads: [],
    settlements: [],
    cities: [],
    victoryPoints: 0,

    ports: {
      wood: false,
      brick: false,
      sheep: false,
      wheat: false,
      ore: false,
      any: false,            // 3:1 generic port
    },

    devCardPurchasedThisTurn: false,
    devCards: emptyDevCards(),

  };
}
