"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type {
  Session,
  Player,
  Hand,
  Card,
  ActionType,
  ApiResponse,
  AddActionResponse,
} from "@/types";
import CardSelector from "@/components/player/CardSelector";
import PlayingCard from "@/components/shared/PlayingCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { ACTION_DISPLAY_MAP } from "@/constants/poker";

// --- 状態マシン ---
type GamePhase =
  | { step: "loading" }
  | { step: "hand-start" }
  | { step: "player-intro"; playerIndex: number }
  | { step: "card-input"; playerIndex: number }
  | { step: "action-select"; playerIndex: number; cards: readonly [Card, Card] }
  | { step: "turn-complete"; playerIndex: number }
  | { step: "hand-complete" }
  | { step: "diagnosing" }
  | { step: "complete" };

const HAND_COUNT_OPTIONS = [5, 10, 15, 20] as const;

export default function PlayPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<GamePhase>({ step: "loading" });
  const [currentHandId, setCurrentHandId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [raiseAmount, setRaiseAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalHands, setTotalHands] = useState<number>(10);
  const [handCount, setHandCount] = useState(0);

  // セッション取得
  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    const json = (await res.json()) as ApiResponse<Session>;
    if (json.success) {
      setSession(json.data);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession().then(() => {
      setPhase({ step: "hand-start" });
    });
  }, [fetchSession]);

  const players: readonly Player[] = session?.players ?? [];
  const activePlayersForHand = players;

  // 現在のハンドで既に使われたカード
  const currentHand: Hand | undefined = useMemo(() => {
    if (!session || !currentHandId) return undefined;
    return session.hands.find((h) => h.id === currentHandId);
  }, [session, currentHandId]);

  const usedCardsInHand: readonly Card[] = useMemo(() => {
    if (!currentHand) return [];
    const cards: Card[] = [];
    for (const ph of currentHand.playerHands) {
      if (ph.holeCards) {
        cards.push(ph.holeCards[0], ph.holeCards[1]);
      }
    }
    for (const cc of currentHand.communityCards) {
      cards.push(cc);
    }
    return cards;
  }, [currentHand]);

  // 現在のストリートにraiseがあるか
  const hasBetInStreet = useMemo(() => {
    if (!currentHand) return false;
    return currentHand.actions.some(
      (a) => a.street === currentHand.currentStreet && a.type === "raise"
    );
  }, [currentHand]);

  const availableActions: readonly ActionType[] = useMemo(() => {
    if (hasBetInStreet) {
      return ["fold", "call", "raise"] as const;
    }
    return ["fold", "check", "raise"] as const;
  }, [hasBetInStreet]);

  // --- ハンド開始 ---
  const startHand = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const playerIds = players.map((p) => p.id);
      const res = await fetch(`/api/sessions/${sessionId}/hands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds }),
      });
      const json = (await res.json()) as ApiResponse<Session>;
      if (!json.success) {
        setError(json.error);
        return;
      }
      setSession(json.data);
      const newHand = json.data.hands[json.data.hands.length - 1];
      if (!newHand) return;
      setCurrentHandId(newHand.id);
      setHandCount((c) => c + 1);
      setPhase({ step: "player-intro", playerIndex: 0 });
    } catch {
      setError("ハンドの開始に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- カード送信 ---
  const submitCards = async (playerIndex: number, cards: readonly [Card, Card]) => {
    if (!currentHandId) return;
    const player = players[playerIndex];
    if (!player) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/hands/${currentHandId}/hole-cards`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: player.id, holeCards: cards }),
        }
      );
      const json = (await res.json()) as ApiResponse<Session>;
      if (!json.success) {
        setError(json.error);
        return;
      }
      setSession(json.data);
      setPhase({ step: "action-select", playerIndex, cards });
    } catch {
      setError("カードの送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- アクション送信 ---
  const submitAction = async (playerIndex: number, actionType: ActionType) => {
    if (!currentHandId) return;
    const player = players[playerIndex];
    if (!player) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/hands/${currentHandId}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: player.id,
            type: actionType,
            amount: actionType === "raise" ? Number(raiseAmount) || null : null,
          }),
        }
      );
      const json = (await res.json()) as ApiResponse<AddActionResponse>;
      if (!json.success) {
        setError(json.error);
        return;
      }
      setSession(json.data);
      setSelectedCards([]);
      setRaiseAmount("");
      setPhase({ step: "turn-complete", playerIndex });
    } catch {
      setError("アクションの記録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 次のプレイヤーへ / ハンド完了 ---
  const nextTurn = (currentPlayerIndex: number) => {
    const nextIndex = currentPlayerIndex + 1;
    if (nextIndex < activePlayersForHand.length) {
      setPhase({ step: "player-intro", playerIndex: nextIndex });
    } else {
      // ハンド完了
      if (currentHandId) {
        fetch(`/api/sessions/${sessionId}/hands/${currentHandId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isComplete: true }),
        })
          .then((res) => res.json())
          .then((json: ApiResponse<Session>) => {
            if (json.success) setSession(json.data);
          });
      }
      setPhase({ step: "hand-complete" });
    }
  };

  // --- 診断実行 ---
  const runDiagnosis = async () => {
    setPhase({ step: "diagnosing" });
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/diagnose`, {
        method: "POST",
      });
      const json = (await res.json()) as ApiResponse<Session>;
      if (!json.success) {
        setError(json.error);
        setPhase({ step: "hand-complete" });
        return;
      }
      setSession(json.data);
      setPhase({ step: "complete" });
    } catch {
      setError("診断の実行に失敗しました");
      setPhase({ step: "hand-complete" });
    }
  };

  // --- カード選択ハンドラ ---
  const handleCardSelect = (card: Card) => {
    setSelectedCards((prev) => {
      if (prev.length >= 2) return prev;
      return [...prev, card];
    });
  };

  const handleCardRemove = (index: number) => {
    setSelectedCards((prev) => prev.filter((_, i) => i !== index));
  };

  // --- レンダリング ---
  if (phase.step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-950 via-green-900 to-green-950">
        <LoadingSpinner message="読み込み中..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-green-950 via-green-900 to-green-950">
      {/* 上部バー */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-sm text-gray-400">
          Hand {handCount} / {totalHands}
        </span>
        <span className="text-sm font-medium text-poker-gold">
          {players.length}人参加中
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        {error && (
          <p className="mb-4 rounded-md bg-danger/20 px-4 py-2 text-sm text-danger">{error}</p>
        )}

        {/* ハンド開始画面 */}
        {phase.step === "hand-start" && (
          <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-2 text-5xl">
              <span>♠</span>
              <span className="text-poker-red">♥</span>
              <span className="text-poker-red">♦</span>
              <span>♣</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {handCount === 0 ? "ゲーム開始" : "次のハンド"}
            </h2>

            {handCount === 0 && (
              <div className="w-full">
                <p className="mb-2 text-sm text-gray-400">ハンド数を選択</p>
                <div className="grid grid-cols-4 gap-2">
                  {HAND_COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTotalHands(n)}
                      className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                        totalHands === n
                          ? "border-poker-gold bg-poker-gold/10 text-poker-gold"
                          : "border-gray-600 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {n}回
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1 text-sm text-gray-300">
              {players.map((p, i) => (
                <span key={p.id}>
                  {i + 1}. {p.name}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={startHand}
              disabled={isSubmitting}
              className="w-full rounded-lg bg-poker-gold px-6 py-4 text-lg font-bold text-black transition-all hover:bg-yellow-500 disabled:opacity-50"
            >
              {isSubmitting ? "準備中..." : "カードを配る"}
            </button>
          </div>
        )}

        {/* プレイヤーイントロ（プライバシー画面） */}
        {phase.step === "player-intro" && (
          <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-poker-gold/20">
              <span className="text-4xl font-bold text-poker-gold">
                {phase.playerIndex + 1}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white">
              {players[phase.playerIndex]?.name ?? ""}さん
            </h2>
            <p className="text-lg text-gray-300">あなたの番です</p>
            <p className="text-sm text-gray-400">
              他の人に画面が見えないことを確認してから
              <br />
              ボタンを押してください
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCards([]);
                setRaiseAmount("");
                setPhase({ step: "card-input", playerIndex: phase.playerIndex });
              }}
              className="w-full rounded-lg bg-poker-green px-6 py-4 text-lg font-bold text-white transition-all hover:bg-green-500"
            >
              OK、準備できました
            </button>
          </div>
        )}

        {/* カード入力 */}
        {phase.step === "card-input" && (
          <div className="flex w-full max-w-md flex-col gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-400">Hand {handCount}</p>
              <h2 className="text-xl font-bold text-white">
                {players[phase.playerIndex]?.name ?? ""}さんのカード
              </h2>
            </div>

            {/* 選択済みカード表示 */}
            <div className="flex justify-center gap-4">
              {[0, 1].map((i) => {
                const card = selectedCards[i];
                return card ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCardRemove(i)}
                    className="transition-transform hover:scale-105"
                  >
                    <PlayingCard card={card} size="lg" />
                  </button>
                ) : (
                  <div
                    key={i}
                    className="flex h-28 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-500 text-2xl text-gray-500"
                  >
                    ?
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-400">
              {selectedCards.length < 2
                ? "配られたカードを選択してください"
                : "カードをタップすると取り消せます"}
            </p>

            {/* カードセレクター */}
            {selectedCards.length < 2 && (
              <CardSelector
                onSelect={handleCardSelect}
                disabledCards={[...usedCardsInHand, ...selectedCards]}
              />
            )}

            {/* 確定ボタン */}
            {selectedCards.length === 2 && (
              <button
                type="button"
                onClick={() => {
                  const cards = selectedCards as [Card, Card];
                  submitCards(phase.playerIndex, [cards[0]!, cards[1]!]);
                }}
                disabled={isSubmitting}
                className="rounded-lg bg-poker-gold px-6 py-3 font-bold text-black transition-all hover:bg-yellow-500 disabled:opacity-50"
              >
                {isSubmitting ? "送信中..." : "カードを確定"}
              </button>
            )}
          </div>
        )}

        {/* アクション選択 */}
        {phase.step === "action-select" && (
          <div className="flex w-full max-w-md flex-col gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-400">Hand {handCount}</p>
              <h2 className="text-xl font-bold text-white">
                {players[phase.playerIndex]?.name ?? ""}さん
              </h2>
            </div>

            {/* 自分のカード表示 */}
            <div className="flex justify-center gap-4">
              <PlayingCard card={phase.cards[0]} size="lg" />
              <PlayingCard card={phase.cards[1]} size="lg" />
            </div>

            {/* アクションボタン */}
            <p className="text-center text-sm text-gray-300">アクションを選択してください</p>
            <div className="flex flex-col gap-3">
              {availableActions.map((action) => {
                if (action === "raise") {
                  return (
                    <div key={action} className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={raiseAmount}
                          onChange={(e) => setRaiseAmount(e.target.value)}
                          placeholder="レイズ額"
                          min={0}
                          className="flex-1 rounded-lg border border-gray-600 bg-black/30 px-4 py-3 text-white placeholder-gray-500 focus:border-poker-gold focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => submitAction(phase.playerIndex, "raise")}
                          disabled={isSubmitting || !raiseAmount}
                          className="rounded-lg bg-poker-gold px-6 py-3 font-bold text-black transition-all hover:bg-yellow-500 disabled:opacity-50"
                        >
                          {ACTION_DISPLAY_MAP.raise}
                        </button>
                      </div>
                    </div>
                  );
                }
                const colorClass =
                  action === "fold"
                    ? "border-gray-500 text-gray-300 hover:bg-gray-700"
                    : "border-poker-green text-poker-green hover:bg-poker-green/10";
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => submitAction(phase.playerIndex, action)}
                    disabled={isSubmitting}
                    className={`rounded-lg border-2 px-6 py-4 text-lg font-bold transition-all disabled:opacity-50 ${colorClass}`}
                  >
                    {ACTION_DISPLAY_MAP[action]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ターン完了（タブレットを渡す） */}
        {phase.step === "turn-complete" && (
          <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-poker-green/20">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-white">記録完了！</h2>
            <p className="text-lg text-gray-300">
              {phase.playerIndex + 1 < activePlayersForHand.length ? (
                <>
                  タブレットを
                  <span className="font-bold text-poker-gold">
                    {" "}{players[phase.playerIndex + 1]?.name ?? "次の人"}{" "}
                  </span>
                  さんに渡してください
                </>
              ) : (
                "全員の入力が完了しました"
              )}
            </p>
            <button
              type="button"
              onClick={() => nextTurn(phase.playerIndex)}
              className="w-full rounded-lg bg-poker-gold px-6 py-4 text-lg font-bold text-black transition-all hover:bg-yellow-500"
            >
              {phase.playerIndex + 1 < activePlayersForHand.length
                ? "次の人の準備ができました"
                : "ハンド結果へ"}
            </button>
          </div>
        )}

        {/* ハンド完了 */}
        {phase.step === "hand-complete" && (
          <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
            <h2 className="text-2xl font-bold text-white">
              Hand {handCount} 完了
            </h2>
            <p className="text-gray-300">
              {handCount} / {totalHands} ハンド終了
            </p>

            {/* 進捗バー */}
            <div className="w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-3 rounded-full bg-poker-gold transition-all"
                style={{ width: `${(handCount / totalHands) * 100}%` }}
              />
            </div>

            {handCount < totalHands ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentHandId(null);
                  setPhase({ step: "hand-start" });
                }}
                className="w-full rounded-lg bg-poker-gold px-6 py-4 text-lg font-bold text-black transition-all hover:bg-yellow-500"
              >
                次のハンドへ
              </button>
            ) : (
              <button
                type="button"
                onClick={runDiagnosis}
                className="w-full rounded-lg bg-secondary px-6 py-4 text-lg font-bold text-white transition-all hover:bg-purple-500"
              >
                全ハンド終了！診断を実行する
              </button>
            )}

            {/* 途中でも診断可能 */}
            {handCount < totalHands && handCount >= 3 && (
              <button
                type="button"
                onClick={runDiagnosis}
                className="text-sm text-gray-400 underline transition-colors hover:text-gray-200"
              >
                ここまでのデータで診断する
              </button>
            )}
          </div>
        )}

        {/* 診断中 */}
        {phase.step === "diagnosing" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <LoadingSpinner message="AIが分析中..." />
            <p className="text-sm text-gray-400">
              プレイスタイルからビジネスタイプを判定しています
            </p>
          </div>
        )}

        {/* 診断完了 */}
        {phase.step === "complete" && session && (
          <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
            <h2 className="text-2xl font-bold text-white">診断完了！</h2>
            <p className="text-gray-300">各プレイヤーの結果を確認してください</p>

            <div className="flex w-full flex-col gap-3">
              {players.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => router.push(`/result/${sessionId}/${player.id}`)}
                  className="flex items-center justify-between rounded-lg border border-white/20 bg-white/5 px-4 py-4 text-left transition-all hover:bg-white/10"
                >
                  <span className="text-lg font-medium text-white">{player.name}</span>
                  <span className="text-sm text-poker-gold">結果を見る →</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-4 text-sm text-gray-400 underline transition-colors hover:text-gray-200"
            >
              トップに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
