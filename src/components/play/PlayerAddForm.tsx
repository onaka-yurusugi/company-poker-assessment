import { useState } from "react";
import type { Player, Session, ApiResponse, AddPlayerResponse } from "@/types";
import { MESSAGES, BUTTON_LABELS } from "@/constants/ui";

type PlayerAddFormProps = {
  readonly sessionId: string;
  readonly existingPlayers: readonly Player[];
  readonly onAdded: (session: Session) => void;
  readonly onCancel: () => void;
};

export default function PlayerAddForm({
  sessionId,
  existingPlayers,
  onAdded,
  onCancel,
}: PlayerAddFormProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextSeatNumber =
    existingPlayers.length > 0
      ? Math.max(...existingPlayers.map((p) => p.seatNumber)) + 1
      : 1;

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError(MESSAGES.nameRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, seatNumber: nextSeatNumber }),
      });
      const json = (await res.json()) as ApiResponse<AddPlayerResponse>;
      if (!json.success) {
        setError(json.error);
        return;
      }
      onAdded(json.data);
    } catch {
      setError(MESSAGES.unexpectedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-poker-gold/30 bg-black/20 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-poker-gold/20 text-sm font-bold text-poker-gold">
          {nextSeatNumber}
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isSubmitting) handleSubmit();
          }}
          placeholder="新しいプレイヤーの名前"
          autoFocus
          className="flex-1 rounded-lg border border-gray-600 bg-black/30 px-4 py-3 text-white placeholder-gray-500 focus:border-poker-gold focus:outline-none focus:ring-1 focus:ring-poker-gold"
        />
      </div>

      {error && (
        <p className="rounded-md bg-danger/20 px-3 py-1.5 text-xs text-danger">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || name.trim().length === 0}
          className="flex-1 rounded-lg bg-poker-gold px-4 py-2 text-sm font-bold text-black transition-all hover:bg-yellow-500 disabled:opacity-50"
        >
          {isSubmitting ? "追加中..." : BUTTON_LABELS.addPlayer}
        </button>
      </div>
    </div>
  );
}
