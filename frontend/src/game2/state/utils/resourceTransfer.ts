import type { ResourceType } from "../../StaticTypes/ResourceTypes";
import type { PlayerResources, BankResources, GameState } from "../GameState";

export type ResourceSet = Partial<Record<ResourceType, number>>;

export type ResourceHolder =
  | { type: "player"; resources: PlayerResources }
  | { type: "bank"; resources: BankResources };

/**
 * Pure primitive: moves `amount` from `from.resources` to `to.resources`.
 * Returns updated holders or null if sender lacks resources.
 */
export function transferResources(
  from: ResourceHolder,
  to: ResourceHolder,
  amount: ResourceSet
): { from: ResourceHolder; to: ResourceHolder } | null {
  const fromRes = { ...from.resources };
  const toRes = { ...to.resources };

  // Check sender has enough
  for (const r of Object.keys(amount) as ResourceType[]) {
    const amt = amount[r] ?? 0;
    if (amt <= 0) continue;
    if (fromRes[r] < amt) return null;
  }

  // Perform transfer
  for (const r of Object.keys(amount) as ResourceType[]) {
    const amt = amount[r] ?? 0;
    if (amt <= 0) continue;
    fromRes[r] -= amt;
    toRes[r] += amt;
  }

  return {
    from: { ...from, resources: fromRes },
    to: { ...to, resources: toRes },
  };
}

/** References to "where resources live" inside GameState */
export type ResourceRef =
  | { type: "player"; playerId: string }
  | { type: "bank" };

function resolveRef(state: GameState, ref: ResourceRef): ResourceHolder | null {
  if (ref.type === "bank") {
    return { type: "bank", resources: state.bank };
  }
  const p = state.playerState[ref.playerId];
  if (!p) return null;
  return { type: "player", resources: p.resources };
}

/**
 * State plumbing: routes to/from player or bank, calls transferResources,
 * and returns a new GameState with the two resource bags updated.
 */
export function transferInState(
  state: GameState,
  fromRef: ResourceRef,
  toRef: ResourceRef,
  amount: ResourceSet
): GameState | null {
  // No-op fast path
  const keys = Object.keys(amount) as ResourceType[];
  if (keys.length === 0) return state;

  const fromHolder = resolveRef(state, fromRef);
  const toHolder = resolveRef(state, toRef);
  if (!fromHolder || !toHolder) return null;

  const result = transferResources(fromHolder, toHolder, amount);
  if (!result) return null;

  let next: GameState = state;

  // Apply FROM side
  if (fromRef.type === "bank") {
    next = { ...next, bank: result.from.resources as BankResources };
  } else {
    const p = next.playerState[fromRef.playerId];
    if (!p) return null;
    next = {
      ...next,
      playerState: {
        ...next.playerState,
        [fromRef.playerId]: { ...p, resources: result.from.resources as PlayerResources },
      },
    };
  }

  // Apply TO side
  if (toRef.type === "bank") {
    next = { ...next, bank: result.to.resources as BankResources };
  } else {
    const p = next.playerState[toRef.playerId];
    if (!p) return null;
    next = {
      ...next,
      playerState: {
        ...next.playerState,
        [toRef.playerId]: { ...p, resources: result.to.resources as PlayerResources },
      },
    };
  }

  return next;
}

/**
 * Atomic 2-way exchange:
 * - A gives `aGives` to B
 * - B gives `bGives` to A
 * If either leg fails, returns null (no partial application).
 */
export function exchangeInState(
  state: GameState,
  aRef: ResourceRef,
  bRef: ResourceRef,
  aGives: ResourceSet,
  bGives: ResourceSet
): GameState | null {
  const afterAtoB = transferInState(state, aRef, bRef, aGives);
  if (!afterAtoB) return null;

  const afterBtoA = transferInState(afterAtoB, bRef, aRef, bGives);
  if (!afterBtoA) return null;

  return afterBtoA;
}

