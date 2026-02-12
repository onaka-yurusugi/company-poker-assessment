import type { ActionType, Suit } from "@/types";

export const SUIT_DISPLAY_MAP: Readonly<Record<Suit, string>> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
} as const;

export const SUIT_COLOR_MAP: Readonly<Record<Suit, string>> = {
  spade: "black",
  heart: "red",
  diamond: "red",
  club: "black",
} as const;

// 表示用のランク順序（A が最強）
export const RANK_ORDER = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;

export const ACTION_DISPLAY_MAP: Readonly<Record<ActionType, string>> = {
  fold: "フォールド",
  check: "チェック",
  call: "コール",
  bet: "ベット",
  raise: "レイズ",
  "all-in": "オールイン",
} as const;
