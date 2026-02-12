"use client";

import PlayingCard from "@/components/shared/PlayingCard";
import type { Card } from "@/types";

type CardDisplayProps = {
  readonly cards: readonly (Card | null)[];
  readonly size?: "sm" | "md" | "lg";
};

export default function CardDisplay({ cards, size = "md" }: CardDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      {cards.map((card, index) => (
        <div key={index}>
          {card ? (
            <PlayingCard card={card} size={size} />
          ) : (
            <div
              className={`flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 ${
                size === "sm" ? "h-14 w-10" : size === "md" ? "h-20 w-14" : "h-28 w-20"
              }`}
            >
              ?
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
