"use client";

import { useState, useMemo } from "react";
import type { Card, ApiResponse, SetHoleCardsResponse } from "@/types";
import CardSelector from "./CardSelector";
import CardDisplay from "./CardDisplay";

type HoleCardInputProps = {
  readonly sessionId: string;
  readonly handId: string;
  readonly playerId: string;
  readonly existingCards?: readonly Card[];
  readonly onSubmit: () => void;
};

export default function HoleCardInput({
  sessionId,
  handId,
  playerId,
  existingCards = [],
  onSubmit,
}: HoleCardInputProps) {
  const [card1, setCard1] = useState<Card | null>(null);
  const [card2, setCard2] = useState<Card | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabledCards = useMemo<readonly Card[]>(() => {
    const cards: Card[] = [...existingCards];
    if (card1) cards.push(card1);
    if (card2) cards.push(card2);
    return cards;
  }, [existingCards, card1, card2]);

  const handleSelect = (card: Card) => {
    if (!card1) {
      setCard1(card);
    } else if (!card2) {
      setCard2(card);
    }
  };

  const handleReset = () => {
    setCard1(null);
    setCard2(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!card1 || !card2) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/hands/${handId}/hole-cards`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId,
            holeCards: [card1, card2],
          }),
        }
      );
      const json = (await res.json()) as ApiResponse<SetHoleCardsResponse>;

      if (!json.success) {
        setError(json.error);
        return;
      }

      onSubmit();
    } catch {
      setError("カードの送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const bothSelected = card1 !== null && card2 !== null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">ホールカード入力</h3>
        {(card1 || card2) && (
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            リセット
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <CardDisplay cards={[card1, card2]} size="lg" />
        <div className="text-sm text-gray-500">
          {!card1 && "1枚目を選択"}
          {card1 && !card2 && "2枚目を選択"}
          {bothSelected && "送信してください"}
        </div>
      </div>

      {!bothSelected && (
        <CardSelector onSelect={handleSelect} disabledCards={disabledCards} />
      )}

      {error && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!bothSelected || isSubmitting}
        className="rounded-lg bg-poker-green px-4 py-3 font-bold text-white transition-all hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "送信中..." : "ホールカードを送信"}
      </button>
    </div>
  );
}
