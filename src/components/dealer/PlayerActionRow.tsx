"use client";

import type { Player, PlayerHand } from "@/types";

type PlayerActionRowProps = {
  readonly player: Player;
  readonly playerHand: PlayerHand | undefined;
  readonly isFolded: boolean;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
};

export default function PlayerActionRow({
  player,
  playerHand,
  isFolded,
  isSelected,
  onSelect,
}: PlayerActionRowProps) {
  const hasHoleCards = playerHand?.holeCards !== null && playerHand?.holeCards !== undefined;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isFolded}
      className={`flex w-full items-center justify-between rounded-lg border-2 px-3 py-2 text-left transition-all ${
        isFolded
          ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-50"
          : isSelected
            ? "border-poker-gold bg-poker-gold/5"
            : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-poker-green/10 text-sm font-bold text-poker-green">
          {player.seatNumber}
        </span>
        <div>
          <p className="text-sm font-medium text-gray-800">{player.name}</p>
          {isFolded && <p className="text-xs text-gray-400">フォールド済み</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            hasHoleCards
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          }`}
        >
          {hasHoleCards ? "カード入力済" : "未入力"}
        </span>
      </div>
    </button>
  );
}
