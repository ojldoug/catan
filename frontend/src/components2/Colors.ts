export const resourceColor = {
  sea: "#307baaff",
  desert: "#E8D5A1",
  wheat: "#ebd963ff",
  wood: "#3a6b4bff",
  sheep: "#51bb49ff",
  brick: "#D36B48",
  ore: "#80818aff",
} as const;

export type ResourceColor = typeof resourceColor;

export const environmentColor = {
  sea: "#307baaff",
  beach: "#d6bc73ff",
} as const;

export type EnvironmentColor = typeof environmentColor;