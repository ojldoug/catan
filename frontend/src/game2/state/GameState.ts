// ---------------------------------------------
// GAME STATE TYPES FOR CATAN IMPLEMENTATION
// ---------------------------------------------

import type { Tile } from "../StaticTypes/Tile";
import type { Vertex } from "../StaticTypes/Vertex";
import type { Edge } from "../StaticTypes/Edge";
import type { Node } from "../StaticTypes/Node";
import type { ResourceType } from "../StaticTypes/ResourceTypes";
import type { DevCardType } from "../StaticTypes/DevCardTypes";
//import type { Player } from "../player/types/Player";
//import type { ResourceType } from "../general/types/ResourceType";

// ---------------------------------------------
// STATIC BOARD GEOMETRY (never changes)
// ---------------------------------------------
export interface BoardGeometry {
  tiles: Record<string, Tile>;
  vertices: Record<string, Vertex>;
  edges: Record<string, Edge>;
  nodes: Record<string, Node>;
}

// ---------------------------------------------
// DYNAMIC BOARD STATE (changes during play)
// ---------------------------------------------

export type BuildingType = "none" | "settlement" | "city";

export interface VertexState {
  building: BuildingType;
  ownerId: string | null; // Player.id
}

export interface EdgeState {
  ownerId: string | null; // Player.id
}

export interface TileState {
  robber: boolean;
}

// ---------------------------------------------
// PLAYER STATE DURING GAME
// ---------------------------------------------

export type PlayerResources = Record<ResourceType, number>;

export interface PlayerState {
  playerId: string;         // matches Player.id
  color: string;
  resources: PlayerResources;
  roads: string[];        // edge IDs
  settlements: string[];  // vertex IDs
  cities: string[];       // vertex IDs
  victoryPoints: number;

  ports: {
    wood: boolean;
    brick: boolean;
    sheep: boolean;
    wheat: boolean;
    ore: boolean;
    any: boolean;            // 3:1 generic port
  };

  devCards: Record<DevCardType, number>;

}

// ---------------------------------------------
// GAME PHASES
// ---------------------------------------------

export type GamePhase =
  | "setup"
  | "dice_roll"
  | "robber"
  | "building_trading"
  | "dev_card_action"
  | "game_over";


// ---------------------------------------------
// BANK STATE
// ---------------------------------------------

export type BankResources = Record<ResourceType, number>;

export const INITIAL_BANK_RESOURCES: BankResources = {
  wood: 19,
  brick: 19,
  sheep: 19,
  wheat: 19,
  ore: 19,
};

// ---------------------------------------------
// ROBBER STATE DURING "robber" PHASE
// ---------------------------------------------

export interface RobberState {
  step: "discard" | "move" | "steal";
  pendingDiscards: string[]; // playerIds who must still discard
  discardAmounts: Record<string, number>;
  activeDiscarder: string | null;
  stealCandidates: string[] | null; // players adjacent to robber tile
  originalRoller: string; // playerId who rolled the 7
}

// ---------------------------------------------
// DEV ACTION STATE
// ---------------------------------------------

export type DevCardActionState =
  | { type: "road_building"; roadsRemaining: number }
  | { type: "monopoly_select" }
  | { type: "year_of_plenty_select" };
  
// ---------------------------------------------
// FULL GAME STATE
// ---------------------------------------------

export interface GameState {
  // static board
  board: BoardGeometry;

  // dynamic board
  vertexState: Record<string, VertexState>;
  edgeState: Record<string, EdgeState>;
  tileState: Record<string, TileState>;

  // players
  playerState: Record<string, PlayerState>;

  // turn management
  currentPlayer: string; // Player.id
  currentPlayerIndex: number; // not Player.id
  turnOrder: string[];   // list of Player.id

  // phases
  phase: GamePhase

  // setup
  setupTurn: 0 | 1;
  setupStep: "settlement" | "road";

  // dice/cards
  lastRoll: number | null;
  diceRolled: boolean;
  bank: BankResources;

  // build
  buildTradeMode: "none" | "road" | "settlement" | "city" | "bank";

  // robber
  robberState: RobberState | null;
  robberTileId: string;

  // dev cards
  devDeck: DevCardType[];
  devCardActionState: DevCardActionState | null;
  devCardPlayedThisTurn: boolean;

  // vp
  winner: string | null;
}
