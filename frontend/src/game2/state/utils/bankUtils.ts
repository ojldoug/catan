import type { BankResources } from "../GameState";
import type { ResourceType } from "../../StaticTypes/ResourceTypes";

export function canBankAfford(
  bank: BankResources,
  resource: ResourceType,
  amount: number
): boolean {
  return bank[resource] >= amount;
}

export function takeFromBank(
  bank: BankResources,
  resource: ResourceType,
  amount: number
): BankResources {
  return {
    ...bank,
    [resource]: bank[resource] - amount,
  };
}

export function giveToBank(
  bank: BankResources,
  resource: ResourceType,
  amount: number
): BankResources {
  return {
    ...bank,
    [resource]: bank[resource] + amount,
  };
}
