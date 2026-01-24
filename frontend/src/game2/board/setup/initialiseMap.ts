// src/game2/board/setup/initializeMap.ts
import { generateNodeMap, type GeneratedMaps } from "./generateNodeMap";
import { generateEdgeMap } from "./generateEdgeMap";
import { populateResources } from "./populateResources";
import { populateTokens } from "./populateTokens"; // if needed
import { populatePorts } from "./populatePorts";

export function initialiseMap(): GeneratedMaps {
  // 1. Generate basic nodes and vertices
  let maps: GeneratedMaps = generateNodeMap();

  // 2. Populate resources (deserts and land tiles)
  maps.tiles = populateResources(maps);

  // 3. Optionally populate tokens
  maps.tiles = populateTokens(maps);

  maps.edges = generateEdgeMap(maps.vertices);

  populatePorts(maps);
  
  return maps;
}

