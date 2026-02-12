"use client";

import { useState } from "react";
import { SUITS, RANKS } from "@/types";
import type { Card, Suit, Rank } from "@/types";
import { SUIT_DISPLAY_MAP, SUIT_COLOR_MAP } from "@/constants/poker";

type CardSelectorProps = {
  readonly onSelect: (card: Card) => void;
  readonly disabledCards?: readonly Card[];
};

const isCardDisabled = (suit: Suit, rank: Rank, disabledCards: readonly Card[]): boolean =>
  disabledCards.some((c) => c.suit === suit && c.rank === rank);

export default function CardSelector({ onSelect, disabledCards = [] }: CardSelectorProps) {
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);

  const handleSuitSelect = (suit: Suit) => {
    setSelectedSuit(suit);
  };

  const handleRankSelect = (rank: Rank) => {
    if (!selectedSuit) return;
    onSelect({ suit: selectedSuit, rank });
    setSelectedSuit(null);
  };

  const handleBack = () => {
    setSelectedSuit(null);
  };

  // Step 1: スート選択
  if (!selectedSuit) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-600">スートを選択</p>
        <div className="grid grid-cols-4 gap-2">
          {SUITS.map((suit) => {
            const symbol = SUIT_DISPLAY_MAP[suit];
            const colorClass = SUIT_COLOR_MAP[suit] === "red" ? "text-poker-red" : "text-poker-black";
            const allDisabled = RANKS.every((rank) => isCardDisabled(suit, rank, disabledCards));
            return (
              <button
                key={suit}
                type="button"
                onClick={() => handleSuitSelect(suit)}
                disabled={allDisabled}
                className={`flex h-14 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-3xl transition-all hover:border-poker-gold hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${colorClass}`}
              >
                {symbol}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2: ランク選択
  const suitSymbol = SUIT_DISPLAY_MAP[selectedSuit];
  const suitColorClass = SUIT_COLOR_MAP[selectedSuit] === "red" ? "text-poker-red" : "text-poker-black";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
        >
          &larr; 戻る
        </button>
        <span className={`text-lg font-bold ${suitColorClass}`}>{suitSymbol}</span>
        <span className="text-sm text-gray-600">のランクを選択</span>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
        {RANKS.map((rank) => {
          const disabled = isCardDisabled(selectedSuit, rank, disabledCards);
          return (
            <button
              key={rank}
              type="button"
              onClick={() => handleRankSelect(rank)}
              disabled={disabled}
              className={`flex h-12 items-center justify-center rounded-xl border-2 border-gray-200 bg-white font-bold transition-all hover:border-poker-gold hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${suitColorClass}`}
            >
              {rank}
            </button>
          );
        })}
      </div>
    </div>
  );
}
