"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ApiResponse, GetSessionResponse, AddPlayerResponse } from "@/types";

const SEAT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function JoinSessionForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [seatNumber, setSeatNumber] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || !name.trim() || seatNumber === "") return;

    setIsLoading(true);
    setError(null);

    try {
      // コードからセッションIDを取得
      const searchRes = await fetch(`/api/sessions?code=${code}`);
      const searchJson = (await searchRes.json()) as ApiResponse<GetSessionResponse>;

      if (!searchJson.success) {
        setError(searchJson.error);
        return;
      }

      const sessionId = searchJson.data.id;

      // プレイヤーを追加
      const joinRes = await fetch(`/api/sessions/${sessionId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), seatNumber }),
      });
      const joinJson = (await joinRes.json()) as ApiResponse<AddPlayerResponse>;

      if (!joinJson.success) {
        setError(joinJson.error);
        return;
      }

      // 追加されたプレイヤーのIDを取得（最後に追加されたプレイヤー）
      const players = joinJson.data.players;
      const addedPlayer = players[players.length - 1];
      if (!addedPlayer) {
        setError("プレイヤーの登録に失敗しました");
        return;
      }

      router.push(`/player/${sessionId}?playerId=${addedPlayer.id}`);
    } catch {
      setError("セッションへの参加に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-danger/20 px-4 py-2 text-sm text-danger">{error}</p>
      )}

      <div>
        <label htmlFor="session-code" className="mb-1 block text-sm font-medium text-gray-300">
          セッションコード
        </label>
        <input
          id="session-code"
          type="text"
          value={code}
          onChange={handleCodeChange}
          placeholder="6文字のコード"
          maxLength={6}
          className="w-full rounded-lg border border-gray-600 bg-black/30 px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-white placeholder-gray-500 focus:border-poker-gold focus:outline-none focus:ring-1 focus:ring-poker-gold"
        />
      </div>

      <div>
        <label htmlFor="player-name" className="mb-1 block text-sm font-medium text-gray-300">
          名前
        </label>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="表示名を入力"
          className="w-full rounded-lg border border-gray-600 bg-black/30 px-4 py-3 text-white placeholder-gray-500 focus:border-poker-gold focus:outline-none focus:ring-1 focus:ring-poker-gold"
        />
      </div>

      <div>
        <label htmlFor="seat-number" className="mb-1 block text-sm font-medium text-gray-300">
          座席番号
        </label>
        <select
          id="seat-number"
          value={seatNumber}
          onChange={(e) => setSeatNumber(e.target.value ? Number(e.target.value) : "")}
          className="w-full rounded-lg border border-gray-600 bg-black/30 px-4 py-3 text-white focus:border-poker-gold focus:outline-none focus:ring-1 focus:ring-poker-gold"
        >
          <option value="">座席を選択</option>
          {SEAT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              Seat {n}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading || code.length !== 6 || !name.trim() || seatNumber === ""}
        className="mt-2 rounded-lg bg-poker-green px-6 py-3 font-bold text-white transition-all hover:bg-green-500 hover:shadow-lg hover:shadow-poker-green/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "参加中..." : "セッションに参加"}
      </button>
    </form>
  );
}
