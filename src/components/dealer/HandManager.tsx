"use client";

import { useState } from "react";
import type { Session, ApiResponse, CreateHandResponse } from "@/types";

type HandManagerProps = {
  readonly session: Session;
  readonly activeHandId: string | null;
  readonly onSelectHand: (handId: string) => void;
  readonly onSessionUpdate: () => void;
};

export default function HandManager({
  session,
  activeHandId,
  onSelectHand,
  onSessionUpdate,
}: HandManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateHand = async () => {
    if (session.players.length === 0) {
      setError("プレイヤーが参加していません");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const playerIds = session.players.map((p) => p.id);
      const res = await fetch(`/api/sessions/${session.id}/hands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds }),
      });
      const json = (await res.json()) as ApiResponse<CreateHandResponse>;

      if (!json.success) {
        setError(json.error);
        return;
      }

      // 新しいハンドを選択
      const newHand = json.data.hands[json.data.hands.length - 1];
      if (newHand) {
        onSelectHand(newHand.id);
      }
      onSessionUpdate();
    } catch {
      setError("ハンドの作成に失敗しました");
    } finally {
      setIsCreating(false);
    }
  };

  // 未完了のハンドがあるかチェック
  const hasIncompleteHand = session.hands.some((h) => !h.isComplete);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">ハンド管理</h2>
        <button
          type="button"
          onClick={handleCreateHand}
          disabled={isCreating || hasIncompleteHand}
          className="rounded-lg bg-poker-green px-4 py-2 text-sm font-bold text-white transition-all hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? "作成中..." : "新しいハンドを開始"}
        </button>
      </div>

      {hasIncompleteHand && session.hands.length > 0 && (
        <p className="text-xs text-warning">
          現在のハンドを完了してから次のハンドを作成してください
        </p>
      )}

      {error && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {/* ハンド一覧 */}
      <div className="flex flex-wrap gap-2">
        {session.hands.map((hand) => (
          <button
            key={hand.id}
            type="button"
            onClick={() => onSelectHand(hand.id)}
            className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
              activeHandId === hand.id
                ? "border-poker-gold bg-poker-gold/10 text-poker-gold"
                : hand.isComplete
                  ? "border-gray-200 bg-gray-50 text-gray-500"
                  : "border-poker-green/50 bg-poker-green/5 text-poker-green"
            }`}
          >
            #{hand.handNumber}
            {hand.isComplete && " ✓"}
          </button>
        ))}
        {session.hands.length === 0 && (
          <p className="text-sm text-gray-400">ハンドがまだありません</p>
        )}
      </div>
    </div>
  );
}
