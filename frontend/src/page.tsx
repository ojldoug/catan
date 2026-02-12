
import { initialiseMap } from "./game2/board/setup/initialiseMap";
import { initialiseGameState } from "./game2/state/initialiseGameState";
import type { Node } from "./game2/StaticTypes/Node";
import { Board } from "./components2/board/Board";
import { useReducer } from "react";
import { gameReducer } from "./game2/state/GameReducer";
import { DiscardResources } from "./components2/robber/DiscardResources";
import { BankTrade } from "./components2/trade/BankTrade";
import { totalVP, visibleVP } from "./game2/state/utils/calculateVP";
import { canBuild } from "./game2/state/utils/buildRequirements"
import { canMakeAnyBankTrade } from "./game2/state/utils/tradeUtils";
import { PlayerDevCards } from "./components2/devCards/PlayerDevCards";
import { MonopolySelect } from "./components2/devCards/MonopolySelect";
import { YearOfPlentySelect } from "./components2/devCards/YearOfPlentySelect";


export default function HomePage() {
  // 1. Create static board
  const maps = initialiseMap();

  // 2. Create full game state
  const initialGameState = initialiseGameState(maps, ["player1", "player2"]);

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

    dispatch({
      type: "ROLL_DICE",
      roll,
    });
  };

  const currentPlayerId = gameState.currentPlayer;
  const currentPlayer = gameState.playerState[currentPlayerId];
  const resources = currentPlayer.resources;
  const bankResources = gameState.bank;

  return (
    <main>
      <div style={{ marginBottom: 10 }}>
        Current player: <b>{currentPlayerId}</b>
      </div>

      <div style={{ marginBottom: 10 }}>
        VP: <b>{totalVP(currentPlayer, gameState)}</b>, visible: <b>{visibleVP(currentPlayer, gameState)}</b>
      </div>

      {/* RESOURCE DISPLAY */}
      <div style={{ marginBottom: 20 }}>
        <b>Resources:</b>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <div>🌲: {resources.wood}</div>
          <div>🧱: {resources.brick}</div>
          <div>🐑: {resources.sheep}</div>
          <div>🌾: {resources.wheat}</div>
          <div>⛰: {resources.ore}</div>
        </div>
      </div>

      {/* BANK RESOURCE DISPLAY */} 
      <div style={{ marginBottom: 20 }}>
        <b>Bank Resources:</b>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <div>🌲: {bankResources.wood}</div>
          <div>🧱: {bankResources.brick}</div>
          <div>🐑: {bankResources.sheep}</div>
          <div>🌾: {bankResources.wheat}</div>
          <div>⛰: {bankResources.ore}</div>
        </div>
      </div>

      {/* DEV CARD BUTTONS */} 
      <div style={{ marginTop: 12 }}>
        <b>Dev Cards:</b>
        <PlayerDevCards
          devCardsOwned={currentPlayer.devCards}
          onPlay={(type) => {
            switch (type) {
              case "knight":
                dispatch({ type: "PLAY_KNIGHT" });
                break;
              case "monopoly":
                dispatch({ type: "PLAY_MONOPOLY" });
                break;
              case "roadBuilding":
                dispatch({ type: "PLAY_ROAD_BUILDING" });
                break;
              case "yearOfPlenty":
                dispatch({ type: "PLAY_YEAR_OF_PLENTY" });
                break;
            }
          }}
        />
      </div>

      <div>
        Last roll: {gameState.lastRoll ?? "-"}
      </div>

      <div>PHASE: {gameState.phase}</div>

      {gameState.devCardActionState?.type === "monopoly_select" && (
        <MonopolySelect
          title="Monopoly: choose a resource"
          onSelect={(resource) => dispatch({ type: "SELECT_MONOPOLY_RESOURCE", resource })}
          onClose={() => {
            // Optional: you can disallow cancel by omitting onClose
            // If you *do* allow cancel, you need a CANCEL action and potentially refund the card.
          }}
        />
      )}

      {gameState.devCardActionState?.type === "year_of_plenty_select" && (
        <YearOfPlentySelect
          bankResources={gameState.bank}
          onConfirm={(resources) =>
            dispatch({ type: "SELECT_YEAR_OF_PLENTY_RESOURCES", resources })
          }
        />
      )}

      
      {/* ROBBER DEBUG */}
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
            disabled={!canBuild(gameState.playerState[gameState.currentPlayer], "settlement")}
            onClick={() => dispatch({ type: "SET_BUILD_TRADE_MODE", mode: "settlement" })}
          >
            Build Settlement
          </button>

          <button
            disabled={!canBuild(gameState.playerState[gameState.currentPlayer], "road")}
            onClick={() => dispatch({ type: "SET_BUILD_TRADE_MODE", mode: "road" })}
          >
            Build Road
          </button>

          <button
            disabled={!canBuild(gameState.playerState[gameState.currentPlayer], "city")}
            onClick={() => dispatch({ type: "SET_BUILD_TRADE_MODE", mode: "city" })}
          >
            Build City
          </button>

          <button
            disabled={
              !canBuild(gameState.playerState[gameState.currentPlayer], "devCard") 
            }
            onClick={() => dispatch({ type: "BUY_DEV_CARD" })}
          >
            Buy Dev Card (VP)
          </button>

          <button
            disabled={!canMakeAnyBankTrade(gameState.playerState[gameState.currentPlayer])}
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


      {gameState.phase === "game_over" && gameState.winner && (
        <div style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "gold",
          padding: "12px 24px",
          borderRadius: 8,
          fontSize: 24,
          fontWeight: "bold"
        }}>
          🎉 Player {gameState.winner} Wins!
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


