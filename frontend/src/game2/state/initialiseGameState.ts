import type { GeneratedMaps } from "../board/setup/generateNodeMap";
import type { BoardGeometry, GameState } from "./GameState";
import { createPlayerState } from "./createPlayerState";
import type { DevCardType } from "../StaticTypes/DevCardTypes";
import { INITIAL_BANK_RESOURCES } from "./GameState";

function chooseInitialRobberTile(board: BoardGeometry): string {
  const desertTiles = Object.values(board.tiles).filter(
    (t) => t.resource === "desert"
  );

  if (desertTiles.length === 0) {
    throw new Error("No desert tile found for robber placement");
  }

  const idx = Math.floor(Math.random() * desertTiles.length);
  return desertTiles[idx].id;
}

function makeShuffledDevDeck(): DevCardType[] {
    const deck: DevCardType[] = [];

    deck.push(...Array(14).fill("knight"));
    deck.push(...Array(5).fill("victoryPoint"));
    deck.push(...Array(2).fill("roadBuilding"));
    deck.push(...Array(2).fill("yearOfPlenty"));
    deck.push(...Array(2).fill("monopoly"));

    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

export function initialiseGameState(
  maps: GeneratedMaps,
  playerIds: string[]
): GameState {

  const board = {
    tiles: maps.tiles,
    vertices: maps.vertices,
    edges: maps.edges,
    nodes: Object.fromEntries(
      maps.nodeMatrix.flat().map(n => [n.id, n])
    ),
  };

  const vertexState: GameState["vertexState"] = {};
  for (const vertexId in maps.vertices) {
    vertexState[vertexId] = {
      building: "none",
      ownerId: null,
    };
  }

  const edgeState: GameState["edgeState"] = {};
  for (const edgeId in maps.edges) {
    edgeState[edgeId] = {
      ownerId: null,
    };
  }

  const tileState: GameState["tileState"] = {};
  for (const tileId in maps.tiles) {
    tileState[tileId] = {
      robber: maps.tiles[tileId].resource === "desert",
    };
  }

  const playerState: GameState["playerState"] = {};
  for (const playerId of playerIds) {
    playerState[playerId] = createPlayerState(playerId);
  }

  return {
    board,

    vertexState,
    edgeState,
    tileState,

    playerState,

    currentPlayer: playerIds[0],
    currentPlayerIndex: 0,
    turnOrder: playerIds,
    
    phase: "setup",

    setupTurn: 0,
    setupStep: "settlement",

    lastRoll: null,
    diceRolled: false,
    bank: { ...INITIAL_BANK_RESOURCES },

    buildTradeMode: "none",

    robberState: null,
    robberTileId: chooseInitialRobberTile(board),

    devDeck: makeShuffledDevDeck(),
    devCardActionState: null,
    devCardPlayedThisTurn: false,

    winner: null,
  };
}


