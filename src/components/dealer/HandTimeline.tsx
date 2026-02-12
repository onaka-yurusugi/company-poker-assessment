"use client";

import type { Action, Player, Street } from "@/types";
import { ACTION_DISPLAY_MAP } from "@/constants/poker";
import { STREET_LABELS } from "@/constants/ui";

type HandTimelineProps = {
  readonly actions: readonly Action[];
  readonly players: readonly Player[];
  readonly street: Street;
};

export default function HandTimeline({ actions, players, street }: HandTimelineProps) {
  const getPlayerName = (playerId: string): string => {
    const player = players.find((p) => p.id === playerId);
    return player?.name ?? "不明";
  };

  if (actions.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 px-4 py-3 text-center">
        <p className="text-sm text-gray-400">
          {STREET_LABELS[street]}のアクションはまだありません
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {actions.map((action, index) => {
        const isFold = action.type === "fold";
        return (
          <div
            key={`${action.playerId}-${action.order}`}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
              isFold ? "bg-gray-50 text-gray-400" : "bg-white"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
              {index + 1}
            </span>
            <span className="text-sm font-medium">{getPlayerName(action.playerId)}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isFold
                  ? "bg-gray-200 text-gray-500"
                  : action.type === "raise"
                    ? "bg-poker-gold/10 text-poker-gold"
                    : "bg-primary/10 text-primary"
              }`}
            >
              {ACTION_DISPLAY_MAP[action.type]}
            </span>
            {action.amount !== null && (
              <span className="text-sm font-mono text-gray-600">{action.amount}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
