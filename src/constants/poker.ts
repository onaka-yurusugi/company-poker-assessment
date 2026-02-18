import type { ActionType, Street, Suit } from "@/types";

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
  raise: "レイズ",
} as const;

// ストリートごとの累計コミュニティカード枚数
export const COMMUNITY_CARD_CUMULATIVE: Readonly<Record<Street, number>> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
} as const;

// アクション種別ごとのテキストカラー
export const ACTION_STYLE_MAP: Readonly<Record<ActionType, string>> = {
  fold: "text-gray-500",
  check: "text-gray-600",
  call: "text-emerald-600",
  raise: "text-amber-600 font-semibold",
} as const;
