import type { DiagnosisResult } from "./diagnosis";
import type { Hand } from "./hand";
import type { Player } from "./player";

export const SESSION_STATUSES = ["waiting", "playing", "diagnosing", "completed"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export type Session = {
  readonly id: string;
  readonly code: string;
  readonly players: readonly Player[];
  readonly hands: readonly Hand[];
  readonly status: SessionStatus;
  readonly diagnosisResults: Readonly<Record<string, DiagnosisResult>>;
  readonly createdAt: string;
};
