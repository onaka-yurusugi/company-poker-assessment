import type { Card } from "./card";

export const STREETS = ["preflop", "flop", "turn", "river"] as const;
export type Street = (typeof STREETS)[number];

export const ACTION_TYPES = ["fold", "check", "call", "raise"] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export type Action = {
  readonly playerId: string;
  readonly type: ActionType;
  readonly amount: number | null;
  readonly street: Street;
  readonly order: number;
};

export type PlayerHand = {
  readonly playerId: string;
  readonly holeCards: readonly [Card, Card] | null;
};

export type Hand = {
  readonly id: string;
  readonly handNumber: number;
  readonly communityCards: readonly Card[];
  readonly playerHands: readonly PlayerHand[];
  readonly actions: readonly Action[];
  readonly pot: number;
  readonly currentStreet: Street;
  readonly isComplete: boolean;
};
