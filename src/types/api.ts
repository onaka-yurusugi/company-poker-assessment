import type { Card } from "./card";
import type { PersistedGamePhase } from "./game-state";
import type { ActionType, Street } from "./hand";
import type { DiagnosisResult } from "./diagnosis";
import type { Session } from "./session";

// 共通レスポンス型
export type ApiResponse<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

// POST /api/sessions
export type CreateSessionResponse = Session;

// GET /api/sessions/[sessionId]
export type GetSessionResponse = Session;

// POST /api/sessions/[sessionId]/players
export type AddPlayerRequest = {
  readonly name: string;
  readonly seatNumber: number;
};
export type AddPlayerResponse = Session;

// POST /api/sessions/[sessionId]/hands
export type CreateHandRequest = {
  readonly playerIds: readonly string[];
  readonly gamePhase?: PersistedGamePhase;
  readonly totalHands?: number;
};
export type CreateHandResponse = Session;

// PUT /api/sessions/[sessionId]/hands/[handId]
export type UpdateHandRequest = {
  readonly communityCards?: readonly Card[];
  readonly currentStreet?: Street;
  readonly isComplete?: boolean;
  readonly pot?: number;
  readonly gamePhase?: PersistedGamePhase;
};
export type UpdateHandResponse = Session;

// POST /api/sessions/[sessionId]/hands/[handId]/actions
export type AddActionRequest = {
  readonly playerId: string;
  readonly type: ActionType;
  readonly amount?: number | null;
  readonly gamePhase?: PersistedGamePhase;
};
export type AddActionResponse = Session;

// PUT /api/sessions/[sessionId]/hands/[handId]/hole-cards
export type SetHoleCardsRequest = {
  readonly playerId: string;
  readonly holeCards: readonly [Card, Card];
  readonly gamePhase?: PersistedGamePhase;
};
export type SetHoleCardsResponse = Session;

// POST /api/sessions/[sessionId]/diagnose
export type DiagnoseResponse = {
  readonly results: Readonly<Record<string, DiagnosisResult>>;
};
