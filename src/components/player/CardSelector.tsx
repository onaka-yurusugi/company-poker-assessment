"use client";

import { SUITS } from "@/types";
import type { Card, Suit, Rank } from "@/types";
import { SUIT_DISPLAY_MAP } from "@/constants/poker";

type CardSelectorProps = {
  readonly onSelect: (card: Card) => void;
  readonly disabledCards?: readonly Card[];
};

// Display order: high to low (matching poker conventions)
const DISPLAY_RANKS: readonly Rank[] = [
  "A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2",
];

// Compact label: 10 → T
const RANK_LABEL: Readonly<Record<Rank, string>> = {
  A: "A", K: "K", Q: "Q", J: "J", "10": "T",
  "9": "9", "8": "8", "7": "7", "6": "6",
  "5": "5", "4": "4", "3": "3", "2": "2",
};

// Per-suit tile styling
const SUIT_TILE_STYLE: Readonly<Record<Suit, string>> = {
  spade:   "bg-slate-600 text-white",
  heart:   "bg-red-600 text-white",
  diamond: "bg-blue-600 text-white",
  club:    "bg-green-700 text-white",
};

const isCardDisabled = (suit: Suit, rank: Rank, disabledCards: readonly Card[]): boolean =>
  disabledCards.some((c) => c.suit === suit && c.rank === rank);

export default function CardSelector({ onSelect, disabledCards = [] }: CardSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      {SUITS.map((suit) => (
        <div key={suit} className="flex items-center gap-1">
          <span className="w-5 shrink-0 text-center text-sm text-gray-400">
            {SUIT_DISPLAY_MAP[suit]}
          </span>
          <div className="grid flex-1 grid-cols-[repeat(13,minmax(0,1fr))] gap-0.5">
            {DISPLAY_RANKS.map((rank) => {
              const disabled = isCardDisabled(suit, rank, disabledCards);
              return (
                <button
                  key={`${suit}-${rank}`}
                  type="button"
                  onClick={() => { if (!disabled) onSelect({ suit, rank }); }}
                  className={`flex aspect-[3/4] items-center justify-center rounded text-xs font-bold transition-all sm:text-sm ${SUIT_TILE_STYLE[suit]} ${disabled ? "" : "hover:brightness-125 active:scale-90"}`}
                >
                  {RANK_LABEL[rank]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
