"use client";

import { useState, useMemo } from "react";
import type { Card, Hand, ApiResponse, UpdateHandResponse, Street } from "@/types";
import CardSelector from "@/components/player/CardSelector";
import CardDisplay from "@/components/player/CardDisplay";

type CommunityCardInputProps = {
  readonly sessionId: string;
  readonly hand: Hand;
  readonly onUpdate: () => void;
};

const STREET_CARD_COUNT: Record<string, number> = {
  flop: 3,
  turn: 4,
  river: 5,
};

const NEXT_STREET: Record<string, Street> = {
  preflop: "flop",
  flop: "turn",
  turn: "river",
};

export default function CommunityCardInput({ sessionId, hand, onUpdate }: CommunityCardInputProps) {
  const [pendingCards, setPendingCards] = useState<Card[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 現在のストリートで必要な追加カード枚数
  const requiredNewCards = useMemo(() => {
    const nextStreet = NEXT_STREET[hand.currentStreet];
    if (!nextStreet) return 0; // river以降は追加不要
    const targetCount = STREET_CARD_COUNT[nextStreet] ?? 0;
    return targetCount - hand.communityCards.length;
  }, [hand.currentStreet, hand.communityCards.length]);

  // 使用済みカードを集める
  const disabledCards = useMemo(() => {
    const cards: Card[] = [...hand.communityCards, ...pendingCards];
    for (const ph of hand.playerHands) {
      if (ph.holeCards) {
        cards.push(...ph.holeCards);
      }
    }
    return cards;
  }, [hand.communityCards, hand.playerHands, pendingCards]);

  const handleSelect = (card: Card) => {
    if (pendingCards.length < requiredNewCards) {
      setPendingCards((prev) => [...prev, card]);
    }
  };

  const handleReset = () => {
    setPendingCards([]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (pendingCards.length !== requiredNewCards) return;

    setIsSubmitting(true);
    setError(null);

    const nextStreet = NEXT_STREET[hand.currentStreet];
    if (!nextStreet) return;

    try {
      const allCommunityCards = [...hand.communityCards, ...pendingCards];
      const res = await fetch(
        `/api/sessions/${sessionId}/hands/${hand.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            communityCards: allCommunityCards,
            currentStreet: nextStreet,
          }),
        }
      );
      const json = (await res.json()) as ApiResponse<UpdateHandResponse>;

      if (!json.success) {
        setError(json.error);
        return;
      }

      setPendingCards([]);
      onUpdate();
    } catch {
      setError("カードの更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRiver = hand.currentStreet === "river";

  // 表示用のコミュニティカード（既存 + 選択中）
  const displayCards = useMemo(() => {
    const cards: (Card | null)[] = [...hand.communityCards, ...pendingCards];
    // 5枚に満たない場合はnullで埋める
    while (cards.length < 5) {
      cards.push(null);
    }
    return cards;
  }, [hand.communityCards, pendingCards]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="font-bold text-gray-800">コミュニティカード</h3>

      <CardDisplay cards={displayCards} size="md" />

      {!isRiver && requiredNewCards > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {NEXT_STREET[hand.currentStreet] === "flop"
                ? "フロップ（3枚）を選択"
                : NEXT_STREET[hand.currentStreet] === "turn"
                  ? "ターン（1枚）を選択"
                  : "リバー（1枚）を選択"}
              {pendingCards.length > 0 && ` (${pendingCards.length}/${requiredNewCards})`}
            </p>
            {pendingCards.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                リセット
              </button>
            )}
          </div>

          {pendingCards.length < requiredNewCards && (
            <CardSelector onSelect={handleSelect} disabledCards={disabledCards} />
          )}

          {error && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={pendingCards.length !== requiredNewCards || isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 font-bold text-white transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "更新中..." : "次のストリートへ"}
          </button>
        </>
      )}

      {isRiver && (
        <p className="text-sm text-success font-medium">全コミュニティカードが配られました</p>
      )}
    </div>
  );
}
