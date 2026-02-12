"use client";

import type { Hand } from "@/types";
import CardDisplay from "./CardDisplay";

type PlayerHandListProps = {
  readonly hands: readonly Hand[];
  readonly playerId: string;
};

export default function PlayerHandList({ hands, playerId }: PlayerHandListProps) {
  if (hands.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        まだハンドが記録されていません
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hands.map((hand) => {
        const playerHand = hand.playerHands.find((ph) => ph.playerId === playerId);
        const holeCards = playerHand?.holeCards ?? null;

        return (
          <div
            key={hand.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-poker-green/10 text-sm font-bold text-poker-green">
                #{hand.handNumber}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  ハンド {hand.handNumber}
                </p>
                <p className="text-xs text-gray-400">
                  {hand.isComplete ? "完了" : `${hand.currentStreet}進行中`}
                </p>
              </div>
            </div>
            <div>
              {holeCards ? (
                <CardDisplay cards={holeCards} size="sm" />
              ) : (
                <span className="text-xs text-gray-400">未入力</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
