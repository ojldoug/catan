Create virtual environment 'catan_backend_env' and install backend/requirements.txt to the venv


How to Run:

run backend:
(base) PS C:\...\catan\backend> .\catan_backend_env\Scripts\activate
(catan_backend_env) (base) PS C:\...\catan\backend> uvicorn app.main:app --reload 

run frontend:
(base) PS C:\...\catan\frontend> npm run dev



File details: 

frontend/src/
	main.tsx: boots React and mounts app into the HTML page
	page.tsx: actual game screen (Game logic + UI). where all game scripts are actually run (central game script)
	index.css: global styling for the entire app

frontend/src/components2
	UI components. how game logic is translated to user - how user visually receives game outputs and provides 	inputs 

frontend/src/game2
	controls game logic

frontend/src/game2/board
	controls board generation logic. generateTileMap.ts where tile map is defined

frontend/src/game2/staticTypes 
	defines types that are constant throughout game e.g board geometry: nodes/vertices/tiles etc

frontend/src/game2/state/GameState.ts
	stores the dynamic game data e.g playerState, gamePhase, buildings on vertices etc

frontend/src/game2/state/initialiseGameState.ts
	sets initial states in GameState for start of game

frontend/src/game2/state/GameAction.ts
	defines executable actions e.g build settlement, move robber etc

frontend/src/game2/state/GameReducer.ts
	used to update GameState to progress game calls phase reducers (frontend/src/game2/state/phase/) to update 	GameState during specific game phases




How board geometry works: 

tiles are defined generateTileMap.ts in grid matrix where 0 = sea and 1 = land. grid is given sufficient offset with two vertices in-between tiles in X coord. then this offset grid has X-axis rotated by 30 degrees to create familiar catan hex display. 


Row 0:         . . T . . T . . T . . T
Row 1:        . T . . T . . T . . T .
Row 2:       T . . T . . T . . T . .
Row 3:      . . T . . T . . T . . T
Row 4:     . T . . T . . T . . T .
Row 5:    T . . T . . T . . T . .
Row 6:   . . T . . T . . T . . T
Row 7:  . T . . T . . T . . T .
Row 8: T . . T . . T . . T . .




















