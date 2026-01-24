import type { GeneratedMaps } from "../board/setup/generateNodeMap";
import type { BoardGeometry, GameState } from "./GameState";
import { createPlayerState } from "./createPlayerState";


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

    buildTradeMode: "none",

    robberState: null,
    robberTileId: chooseInitialRobberTile(board),
  };
}


