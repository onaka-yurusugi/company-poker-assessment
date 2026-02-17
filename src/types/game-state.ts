import type { Street } from "./hand";

/**
 * Firestoreに保存可能なゲームフェーズ。
 * "loading" はクライアント専用の一時状態のため含まない。
 */
export type PersistedGamePhase =
  | { readonly step: "hand-start" }
  | { readonly step: "player-intro"; readonly playerIndex: number; readonly street: Street }
  | { readonly step: "card-input"; readonly playerIndex: number }
  | { readonly step: "action-select"; readonly playerIndex: number; readonly street: Street }
  | { readonly step: "turn-complete"; readonly playerIndex: number; readonly street: Street }
  | { readonly step: "dealer-turn"; readonly street: Street }
  | { readonly step: "hand-complete" }
  | { readonly step: "review" }
  | { readonly step: "diagnosing" }
  | { readonly step: "complete" };

/** クライアント側で使う完全なフェーズ型（"loading"を含む） */
export type GamePhase =
  | { readonly step: "loading" }
  | PersistedGamePhase;

/** Firestoreに保存するゲーム状態 */
export type GameState = {
  readonly gamePhase: PersistedGamePhase;
  readonly totalHands: number;
  readonly currentHandId: string | null;
};
