import type { ResourceType } from "../StaticTypes/ResourceTypes";

export type GameAction =
  | { type: "VERTEX_CLICKED"; vertexId: string }
  | { type: "EDGE_CLICKED"; edgeId: string }

  // Initial placement actions
  | { type: "PLACE_SETTLEMENT"; vertexId: string }
  | { type: "PLACE_ROAD"; edgeId: string }

  // Dice actions
  | { type: "ROLL_DICE"; roll: number }

  // Building Trading actions
  | { type: "SET_BUILD_TRADE_MODE"; mode: "road" | "settlement" | "city" | "bank" | "none" }
  | { type: "BUILD_SETTLEMENT"; vertexId: string }
  | { type: "BUILD_ROAD"; edgeId: string }
  | { type: "BUILD_CITY"; vertexId: string }
  | { type: "BUY_DEV_CARD" }

  | { type: "OFFER_TRADE"; offer: Partial<Record<ResourceType, number>>; request: Partial<Record<ResourceType, number>>; toPlayerId: string; }
  | { type: "RESPOND_TRADE"; accepted: boolean; fromPlayerId: string; }
  | { type: "BANK_TRADE"; give: ResourceType; receive: ResourceType; }

  | { type: "PLAY_KNIGHT" }
  | { type: "PLAY_MONOPOLY" }
  | { type: "SELECT_MONOPOLY_RESOURCE"; resource: ResourceType }
  | { type: "PLAY_ROAD_BUILDING" }
  | { type: "PLAY_YEAR_OF_PLENTY" }
  | { type: "SELECT_YEAR_OF_PLENTY_RESOURCES"; resources: Partial<Record<ResourceType, number>> }


  | { type: "END_TURN" }

  // Robber actions
  | { type: "DISCARD_RESOURCES"; resources: Partial<Record<ResourceType, number>>; }
  | { type: "PLACE_ROBBER"; tileId: string }
  | { type: "STEAL_RESOURCE"; victimId: string };


