
import { initialiseMap } from "./game2/board/setup/initialiseMap";
import { initialiseGameState } from "./game2/state/initialiseGameState";
import type { Node } from "./game2/StaticTypes/Node";
import { Board } from "./components2/board/Board";
import { useReducer } from "react";
import { gameReducer } from "./game2/state/GameReducer";
import { useEffect } from "react";
import type { GameState } from "./game2/state/GameState";
import { DiscardResources } from "./components2/robber/DiscardResources";
import { BankTrade } from "./components2/trade/BankTrade";
// import { useState } from "react";

// Helper functions to check if player can afford to build
function canAffordSettlement(state: GameState): boolean {
  const r = state.playerState[state.currentPlayer].resources;
  return (
    r.wood >= 1 &&
    r.brick >= 1 &&
    r.sheep >= 1 &&
    r.wheat >= 1
  );
}

function canAffordRoad(state: GameState): boolean {
  const r = state.playerState[state.currentPlayer].resources;
  return r.wood >= 1 && r.brick >= 1;
}

function canAffordCity(state: GameState): boolean {
  const r = state.playerState[state.currentPlayer].resources;
  return r.wheat >= 2 && r.ore >= 3;
}


export default function HomePage() {
  // 1. Create static board
  const maps = initialiseMap();

  // 2. Create full game state
  const initialGameState = initialiseGameState(maps, ["player1", "player2", "player3"]);

  const [gameState, dispatch] = useReducer(
    gameReducer,
    initialGameState
  );

  // 3. Extract board geometry for rendering
  const nodeArray: Node[] = Object.values(gameState.board.nodes);

  const handleVertexClick = (vertexId: string) => {
    dispatch({
      type: "VERTEX_CLICKED",
      vertexId,
    });
  };

  const handleEdgeClick = (edgeId: string) => {
    dispatch({
      type: "EDGE_CLICKED",
      edgeId,
    });
  };

  const rollDice = () => {
    const roll =
      Math.floor(Math.random() * 6) + 1 +
      Math.floor(Math.random() * 6) + 1;

    console.log("🎲 DICE ROLLED:", roll);

    dispatch({
      type: "ROLL_DICE",
      roll,
    });
  };


  useEffect(() => {
    console.log("vertexState changed:", gameState.vertexState);
  }, [gameState.vertexState]);

  useEffect(() => {
    console.log("edgeState changed:", gameState.edgeState);
  }, [gameState.edgeState]);

  const currentPlayerId = gameState.currentPlayer;
  const currentPlayer = gameState.playerState[currentPlayerId];
  const resources = currentPlayer.resources;

  return (
    <main>
      <div style={{ marginBottom: 10 }}>
        Current player: <b>{currentPlayerId}</b>
      </div>

      {/* 👇 RESOURCE DISPLAY */}
      <div style={{ marginBottom: 20 }}>
        <b>Resources:</b>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <div>🌲 Wood: {resources.wood}</div>
          <div>🧱 Brick: {resources.brick}</div>
          <div>🐑 Sheep: {resources.sheep}</div>
          <div>🌾 Wheat: {resources.wheat}</div>
          <div>⛰ Ore: {resources.ore}</div>
        </div>
      </div>

      

      <div>
        Last roll: {gameState.lastRoll ?? "-"}
      </div>
      <div>PHASE: {gameState.phase}</div>

      
      
      {gameState.phase === "robber" && gameState.robberState && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "white",
            border: "2px solid black",
            padding: 12,
            borderRadius: 6,
            zIndex: 100,
            color: "black",
            fontSize: 12,
            maxWidth: 320,
            lineHeight: 1.4,
          }}
        >
          <strong>ROBBER DEBUG</strong>

          <div>step: {gameState.robberState.step}</div>
          <div>currentPlayer: {gameState.currentPlayer}</div>
          <div>activeDiscarder: {String(gameState.robberState.activeDiscarder)}</div>
          <div>originalRoller: {gameState.robberState.originalRoller}</div>

          <div style={{ marginTop: 6 }}>
            <strong>pendingDiscards:</strong>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(gameState.robberState.pendingDiscards, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: 6 }}>
            <strong>discardAmounts:</strong>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(gameState.robberState.discardAmounts, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: 6 }}>
            <strong>stealCandidates:</strong>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(gameState.robberState.stealCandidates, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: 6 }}>
            <strong>player totals:</strong>
            {Object.entries(gameState.playerState).map(([id, p]) => {
              const total = Object.values(p.resources).reduce((a, b) => a + b, 0);
              return (
                <div key={id}>
                  {id}: {total}
                </div>
              );
            })}
          </div>
        </div>
      )}



      {/* DICE ROLL BUTTON */}
      {gameState.phase === "dice_roll" && !gameState.diceRolled && (
        <button
          onClick={rollDice}
          disabled={gameState.diceRolled}
        >
          Roll Dice
        </button>
      )}


      {/* BUILDING TRADING ACTIONS */}
      {gameState.phase === "building_trading" && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => dispatch({ type: "END_TURN" })}>
            End Turn
          </button>

          <button
            disabled={!canAffordSettlement(gameState)}
            onClick={() => dispatch({ type: "SET_BUILD_TRADE_MODE", mode: "settlement" })}
          >
            Build Settlement
          </button>

          <button
            disabled={!canAffordRoad(gameState)}
            onClick={() => dispatch({ type: "SET_BUILD_TRADE_MODE", mode: "road" })}
          >
            Build Road
          </button>

          <button
            disabled={!canAffordCity(gameState)}
            onClick={() => dispatch({ type: "SET_BUILD_TRADE_MODE", mode: "city" })}
          >
            Build City
          </button>

          <button
            onClick={() => dispatch({ type: "SET_BUILD_TRADE_MODE", mode: "bank" })}
          >
            Bank Trade
          </button>

        </div>
      )}

      {/* ROBBER PHASE UI */}
      {gameState.phase === "robber" &&
        gameState.robberState?.step === "discard" &&
        gameState.robberState.activeDiscarder && (
          <DiscardResources
            playerId={gameState.robberState.activeDiscarder}
            playerResources={
              gameState.playerState[gameState.robberState.activeDiscarder].resources
            }
            maxDiscard={
              gameState.robberState.discardAmounts[
                gameState.robberState.activeDiscarder
              ]
            }
            onConfirm={(discarded) =>
              dispatch({
                type: "DISCARD_RESOURCES",
                resources: discarded,
              })
            }
          />
      )}


      {/* BANK / PORT TRADE UI */}
      {gameState.buildTradeMode === "bank" && (
        <BankTrade
          playerId={gameState.currentPlayer}
          playerState={gameState.playerState[gameState.currentPlayer]}
          onConfirm={(give, receive) =>
            dispatch({
              type: "BANK_TRADE",
              give,
              receive,
            })
          }
          onCancel={() => dispatch({ type: "SET_BUILD_TRADE_MODE", mode: "none" })}
        />
      )}




      {gameState.phase === "robber" && gameState.robberState?.step === "move" && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 100 }}>
          Click a tile to move the robber
        </div>
      )}



      <div style={{ width: 1000, height: 800 }}>
        <Board
          nodes={nodeArray}
          tiles={gameState.board.tiles}
          vertices={gameState.board.vertices}
          edges={gameState.board.edges}
          edgeState={gameState.edgeState}
          vertexState={gameState.vertexState}
          size={80}
          playerState={gameState.playerState}
          robberTileId={gameState.robberTileId}
          phase={gameState.phase}
          robberState={gameState.robberState}
          currentPlayer={gameState.currentPlayer}
          dispatch={dispatch}

          onVertexClick={handleVertexClick}
          onEdgeClick={handleEdgeClick}
          onTileClick={(tileId) => {
            if (
              gameState.phase === "robber" &&
              gameState.robberState?.step === "move"
            ) {
              dispatch({ type: "PLACE_ROBBER", tileId });
            }
          }}
        />
      </div>
    </main>
  );
}


