"use client";

import { useState } from "react";
import type { Hand, Player } from "@/types";
import { ADMIN_LABELS } from "@/constants/ui";
import HandDetail from "./HandDetail";

type HandHistoryProps = {
  readonly hands: readonly Hand[];
  readonly players: readonly Player[];
};

export default function HandHistory({ hands, players }: HandHistoryProps) {
  const [openHandId, setOpenHandId] = useState<string | null>(null);
  const completedHands = hands.filter((h) => h.isComplete);

  if (completedHands.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-muted">{ADMIN_LABELS.noHands}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {completedHands.map((hand) => {
        const isOpen = openHandId === hand.id;
        return (
          <div
            key={hand.id}
            className="rounded-xl border border-gray-200 bg-white shadow-sm print:break-inside-avoid"
          >
            <button
              type="button"
              onClick={() => setOpenHandId(isOpen ? null : hand.id)}
              className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-gray-50 print:hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">
                  {ADMIN_LABELS.handNumber} {hand.handNumber}
                </span>
                {hand.communityCards.length > 0 && (
                  <span className="text-xs text-muted">
                    ({hand.communityCards.length} cards)
                  </span>
                )}
              </div>
              <svg
                className={`h-4 w-4 text-gray-400 transition-transform print:hidden ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {/* 印刷時は常に展開表示 */}
            <div className={`${isOpen ? "block" : "hidden"} border-t border-gray-100 px-5 py-4 print:block`}>
              <HandDetail hand={hand} players={players} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
