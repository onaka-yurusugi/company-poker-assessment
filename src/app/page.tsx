"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiResponse, CreateSessionResponse, AddPlayerResponse } from "@/types";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;

export default function Home() {
  const router = useRouter();
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPlayer = () => {
    if (playerNames.length >= MAX_PLAYERS) return;
    setPlayerNames((prev) => [...prev, ""]);
  };

  const removePlayer = (index: number) => {
    if (playerNames.length <= MIN_PLAYERS) return;
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
  };

  const updateName = (index: number, name: string) => {
    setPlayerNames((prev) => prev.map((n, i) => (i === index ? name : n)));
  };

  const validNames = playerNames.filter((n) => n.trim().length > 0);
  const canStart = validNames.length >= MIN_PLAYERS;

  const handleStart = async () => {
    if (!canStart) return;
    setIsLoading(true);
    setError(null);

    try {
      // セッション作成
      const sessionRes = await fetch("/api/sessions", { method: "POST" });
      const sessionJson = (await sessionRes.json()) as ApiResponse<CreateSessionResponse>;
      if (!sessionJson.success) {
        setError(sessionJson.error);
        return;
      }
      const sessionId = sessionJson.data.id;

      // プレイヤーを順番に追加
      for (let i = 0; i < validNames.length; i++) {
        const name = validNames[i];
        if (!name) continue;
        const playerRes = await fetch(`/api/sessions/${sessionId}/players`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), seatNumber: i + 1 }),
        });
        const playerJson = (await playerRes.json()) as ApiResponse<AddPlayerResponse>;
        if (!playerJson.success) {
          setError(playerJson.error);
          return;
        }
      }

      router.push(`/play/${sessionId}`);
    } catch {
      setError("セッションの作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-green-950">
      {/* ヘッダー */}
      <header className="flex flex-col items-center gap-4 px-4 pt-16 pb-8 text-center">
        <div className="flex items-center gap-3">
          <span className="text-4xl">♠</span>
          <span className="text-4xl text-poker-red">♥</span>
          <span className="text-4xl text-poker-red">♦</span>
          <span className="text-4xl">♣</span>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Company Poker Assessment
        </h1>
        <p className="max-w-md text-gray-300">
          ポーカーを通じた意思決定タイプ診断
        </p>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-lg px-4 pb-16">
        <section className="rounded-2xl border border-poker-gold/30 bg-black/20 p-6 backdrop-blur-sm">
          <h2 className="mb-6 text-center text-lg font-bold text-white">
            参加者を入力してください
          </h2>

          <div className="flex flex-col gap-3">
            {playerNames.map((name, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-poker-gold/20 text-sm font-bold text-poker-gold">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updateName(index, e.target.value)}
                  placeholder={`プレイヤー${index + 1}の名前`}
                  className="flex-1 rounded-lg border border-gray-600 bg-black/30 px-4 py-3 text-white placeholder-gray-500 focus:border-poker-gold focus:outline-none focus:ring-1 focus:ring-poker-gold"
                />
                {playerNames.length > MIN_PLAYERS && (
                  <button
                    type="button"
                    onClick={() => removePlayer(index)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {playerNames.length < MAX_PLAYERS && (
            <button
              type="button"
              onClick={addPlayer}
              className="mt-4 w-full rounded-lg border-2 border-dashed border-gray-600 px-4 py-3 text-sm text-gray-400 transition-colors hover:border-poker-gold/50 hover:text-poker-gold"
            >
              + プレイヤーを追加
            </button>
          )}

          {error && (
            <p className="mt-4 rounded-md bg-danger/20 px-4 py-2 text-sm text-danger">{error}</p>
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart || isLoading}
            className="mt-6 w-full rounded-lg bg-poker-gold px-6 py-4 text-lg font-bold text-black transition-all hover:bg-yellow-500 hover:shadow-lg hover:shadow-poker-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "準備中..." : `${validNames.length}人でゲームを開始`}
          </button>
        </section>

        {/* 使い方 */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-black/10 p-6">
          <h3 className="mb-4 text-center text-lg font-bold text-poker-gold">遊び方</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { step: "1", title: "名前を入力", desc: "参加者全員の名前を登録" },
              { step: "2", title: "カードを入力", desc: "配られたカードをタブレットに入力" },
              { step: "3", title: "タブレットを回す", desc: "次の人に見えないように渡す" },
              { step: "4", title: "診断結果", desc: "AIがプレイスタイルを分析" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-poker-gold/20 text-sm font-bold text-poker-gold">
                  {item.step}
                </div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
