import type { TileType } from "../../StaticTypes/TileType";
import type { Tile } from "../../StaticTypes/Tile";
import type { GeneratedMaps } from "../setup/generateNodeMap";

/**
 * Populate resources for a map
 * Only modifies tiles that are currently "desert"
 * Sea tiles remain untouched
 */
export function populateResources(maps: GeneratedMaps): Record<string, Tile> {
  const { tiles } = maps;

  // Separate tiles: deserts to be replaced, land/sea to keep
  const desertTiles: Tile[] = [];
  const landTiles: Tile[] = [];

  Object.values(tiles).forEach((tile) => {
    if (tile.resource === "desert") desertTiles.push(tile);
    else landTiles.push(tile); // includes sea + existing land
  });

  const numTiles = desertTiles.length + landTiles.filter(t => t.resource !== "sea").length;
  const numDeserts = Math.max(1, Math.trunc(numTiles / 15));

  // If too many deserts, convert some to land
  while (desertTiles.length > numDeserts) {
    const idx = Math.floor(Math.random() * desertTiles.length);
    const tile = desertTiles.splice(idx, 1)[0];
    tile.resource = "wheat"; // temporary placeholder for land
    landTiles.push(tile);
  }

  // Only assign resources to non-sea, non-fixed tiles
  const assignableTiles = landTiles.filter((t) => t.resource !== "sea");

  const priorityOrder: TileType[] = ["wheat", "wood", "sheep", "ore", "brick"];
  const resources: TileType[] = [];

  while (resources.length < assignableTiles.length) {
    for (const res of priorityOrder) {
      if (resources.length < assignableTiles.length) resources.push(res);
    }
  }

  // Shuffle resources
  for (let i = resources.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resources[i], resources[j]] = [resources[j], resources[i]];
  }

  // Assign shuffled resources
  assignableTiles.forEach((tile, idx) => {
    tile.resource = resources[idx];
  });

  // Merge all tiles back
  const updatedTiles: Record<string, Tile> = {};
  Object.values(tiles).forEach((tile) => {
    updatedTiles[tile.id] = tile;
  });

  return updatedTiles;
}
