export const POKER_STYLES = ["loose-aggressive", "tight-aggressive", "loose-passive", "tight-passive"] as const;
export type PokerStyle = (typeof POKER_STYLES)[number];

export type DiagnosisAxis = {
  readonly key: string;
  readonly label: string;
  readonly score: number;
  readonly description: string;
};

export type PokerStats = {
  readonly vpip: number;
  readonly pfr: number;
  readonly aggressionFactor: number;
  readonly foldPercentage: number;
  readonly cbetPercentage: number;
  readonly showdownPercentage: number;
  readonly totalHands: number;
};

export type DiagnosisResult = {
  readonly playerId: string;
  readonly playerName: string;
  readonly pokerStyle: PokerStyle;
  readonly businessType: string;
  readonly businessTypeDescription: string;
  readonly axes: readonly DiagnosisAxis[];
  readonly stats: PokerStats;
  readonly advice: string;
  readonly strengths: readonly string[];
  readonly growthPotentials: readonly string[];
  readonly createdAt: string;
};
