import type { ResourceType } from "../../StaticTypes/ResourceTypes";
import type { PlayerResources, PlayerState } from "../GameState";

// 1️⃣ Build costs
export const BUILD_COSTS = {
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  road: { wood: 1, brick: 1 },
  city: { wheat: 2, ore: 3 },
  devCard: { sheep: 0, wheat: 0, ore: 0 },
} as const;

// 2️⃣ Build limits
export const MAX_BUILD = {
  settlement: 5,
  city: 4,
  road: 15,
} as const;

// 3️⃣ Build type (only one declaration)
export type BuildType = keyof typeof BUILD_COSTS;

// 4️⃣ Resource helpers
type ResourceCost = Partial<Record<ResourceType, number>>;

export function canAffordBuild(
  resources: PlayerResources,
  buildType: BuildType
): boolean {
  const cost: ResourceCost = BUILD_COSTS[buildType];
  return (Object.keys(cost) as ResourceType[]).every(
    r => resources[r] >= (cost[r] ?? 0)
  );
}

export function payForBuild(
  resources: PlayerResources,
  buildType: BuildType
): PlayerResources {
  const cost: ResourceCost = BUILD_COSTS[buildType];
  const updated = { ...resources };
  (Object.keys(cost) as ResourceType[]).forEach(r => {
    updated[r] -= cost[r] ?? 0;
  });
  return updated;
}

// 5️⃣ Build limits helpers
export function remainingBuildCount(
  player: PlayerState,
  buildType: BuildType
): number {
  switch (buildType) {
    case "settlement":
      return MAX_BUILD.settlement - player.settlements.length;
    case "city":
      return MAX_BUILD.city - player.cities.length;
    case "road":
      return MAX_BUILD.road - player.roads.length;
    case "devCard":
      return Infinity; // no limit on dev cards
    default:
      return 0;
  }
}

export function canBuildMore(player: PlayerState, buildType: BuildType): boolean {
  return remainingBuildCount(player, buildType) > 0;
}

// 6️⃣ Final combined check
export function canBuild(player: PlayerState, buildType: BuildType): boolean {
  return canAffordBuild(player.resources, buildType) && canBuildMore(player, buildType);
}
