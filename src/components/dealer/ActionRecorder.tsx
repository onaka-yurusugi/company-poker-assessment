"use client";

import { useState, useMemo } from "react";
import type {
  Action,
  Hand,
  Player,
  ActionType,
  Street,
  ApiResponse,
  AddActionResponse,
} from "@/types";
import { STREETS, ACTION_TYPES } from "@/types";
import { ACTION_DISPLAY_MAP } from "@/constants/poker";
import { STREET_LABELS } from "@/constants/ui";
import PlayerActionRow from "./PlayerActionRow";
import HandTimeline from "./HandTimeline";

type ActionRecorderProps = {
  readonly sessionId: string;
  readonly hand: Hand;
  readonly players: readonly Player[];
  readonly onUpdate: () => void;
};

const ACTIONS_WITH_AMOUNT: readonly ActionType[] = ["bet", "raise", "all-in"];

export default function ActionRecorder({
  sessionId,
  hand,
  players,
  onUpdate,
}: ActionRecorderProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStreetTab, setActiveStreetTab] = useState<Street>(hand.currentStreet);

  // フォールド済みプレイヤーのIDセット
  const foldedPlayerIds = useMemo(() => {
    const folded = new Set<string>();
    for (const action of hand.actions) {
      if (action.type === "fold") {
        folded.add(action.playerId);
      }
    }
    return folded;
  }, [hand.actions]);

  const needsAmount = selectedAction !== null && ACTIONS_WITH_AMOUNT.includes(selectedAction);

  const handleSubmitAction = async () => {
    if (!selectedPlayerId || !selectedAction) return;
    if (needsAmount && !amount) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/hands/${hand.id}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: selectedPlayerId,
            type: selectedAction,
            amount: needsAmount ? Number(amount) : null,
          }),
        }
      );
      const json = (await res.json()) as ApiResponse<AddActionResponse>;

      if (!json.success) {
        setError(json.error);
        return;
      }

      // リセット
      setSelectedPlayerId(null);
      setSelectedAction(null);
      setAmount("");
      onUpdate();
    } catch {
      setError("アクションの記録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ストリートごとのアクション
  const streetActions = useMemo(() => {
    const grouped: Partial<Record<Street, readonly Action[]>> = {};
    for (const street of STREETS) {
      grouped[street] = hand.actions.filter((a) => a.street === street);
    }
    return grouped;
  }, [hand]);

  return (
    <div className="flex flex-col gap-4">
      {/* ストリートタブ */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {STREETS.map((street) => {
          const label = STREET_LABELS[street];
          const actionCount = streetActions[street]?.length ?? 0;
          const isCurrent = street === hand.currentStreet;
          return (
            <button
              key={street}
              type="button"
              onClick={() => setActiveStreetTab(street)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                activeStreetTab === street
                  ? "bg-white shadow-sm text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              } ${isCurrent ? "ring-1 ring-poker-green/30" : ""}`}
            >
              {label}
              {actionCount > 0 && (
                <span className="ml-1 text-muted">({actionCount})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* タイムライン */}
      <HandTimeline
        actions={streetActions[activeStreetTab] ?? []}
        players={players}
        street={activeStreetTab}
      />

      {/* アクション入力エリア（現在のストリートタブが現在のストリートの場合のみ） */}
      {activeStreetTab === hand.currentStreet && !hand.isComplete && (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-poker-gold/30 bg-poker-gold/5 p-4">
          <h4 className="font-bold text-gray-800">アクション記録</h4>

          {/* プレイヤー選択 */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-gray-600">プレイヤーを選択</p>
            {players.map((player) => {
              const playerHand = hand.playerHands.find((ph) => ph.playerId === player.id);
              return (
                <PlayerActionRow
                  key={player.id}
                  player={player}
                  playerHand={playerHand}
                  isFolded={foldedPlayerIds.has(player.id)}
                  isSelected={selectedPlayerId === player.id}
                  onSelect={() => setSelectedPlayerId(player.id)}
                />
              );
            })}
          </div>

          {/* アクション選択 */}
          {selectedPlayerId && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-600">アクションを選択</p>
              <div className="grid grid-cols-3 gap-2">
                {ACTION_TYPES.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      setSelectedAction(action);
                      if (!ACTIONS_WITH_AMOUNT.includes(action)) {
                        setAmount("");
                      }
                    }}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                      selectedAction === action
                        ? "border-poker-gold bg-poker-gold/10 text-poker-gold"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {ACTION_DISPLAY_MAP[action]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 金額入力 */}
          {needsAmount && (
            <div>
              <label htmlFor="action-amount" className="mb-1 block text-xs font-medium text-gray-600">
                金額
              </label>
              <input
                id="action-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="チップ額を入力"
                min={0}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-poker-gold focus:outline-none focus:ring-1 focus:ring-poker-gold"
              />
            </div>
          )}

          {error && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          {/* 送信ボタン */}
          <button
            type="button"
            onClick={handleSubmitAction}
            disabled={!selectedPlayerId || !selectedAction || isSubmitting || (needsAmount && !amount)}
            className="rounded-lg bg-poker-green px-4 py-2 font-bold text-white transition-all hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "記録中..." : "アクションを記録"}
          </button>
        </div>
      )}
    </div>
  );
}
