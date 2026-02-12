import type { PlayerState } from "../GameState";
import type { ResourceType } from "../../StaticTypes/ResourceTypes";

const RESOURCE_TYPES: ResourceType[] = ["wood", "brick", "sheep", "wheat", "ore"];

export function getTradeRatio(player: PlayerState, resource: ResourceType): number {
  if (player.ports[resource]) return 2; // specific port
  if (player.ports.any) return 3;       // generic port
  return 4;                             // bank only
}

export function canTradeResource(
  player: PlayerState,
  resource: ResourceType
): boolean {
  return player.resources[resource] >= getTradeRatio(player, resource);
}

export function canMakeAnyBankTrade(player: PlayerState): boolean {
  return RESOURCE_TYPES.some(resource =>
    canTradeResource(player, resource)
  );
}
