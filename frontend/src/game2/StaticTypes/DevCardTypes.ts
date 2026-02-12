export const DEV_CARD_TYPES = [
  "knight",
  "victoryPoint",
  "roadBuilding",
  "yearOfPlenty",
  "monopoly",
] as const;

export type DevCardType = typeof DEV_CARD_TYPES[number];