"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type {
  Session,
  Player,
  Hand,
  Card,
  ActionType,
  Street,
  ApiResponse,
  AddActionResponse,
} from "@/types";
import CardSelector from "@/components/player/CardSelector";
import PlayingCard from "@/components/shared/PlayingCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { ACTION_DISPLAY_MAP } from "@/constants/poker";
import { STREET_LABELS } from "@/constants/ui";

// --- ストリート進行順 ---
const STREET_ORDER: readonly Street[] = ["preflop", "flop", "turn", "river"];
const NEXT_STREET: Readonly<Partial<Record<Street, Street>>> = {
  preflop: "flop",
  flop: "turn",
  turn: "river",
};
const COMMUNITY_CARD_COUNT: Readonly<Record<string, number>> = {
  flop: 3,
  turn: 1,
  river: 1,
};

// --- 状態マシン ---
type GamePhase =
  | { step: "loading" }
  | { step: "hand-start" }
  | { step: "player-intro"; playerIndex: number; street: Street }
  | { step: "card-input"; playerIndex: number }
  | { step: "action-select"; playerIndex: number; street: Street }
  | { step: "turn-complete"; playerIndex: number; street: Street }
  | { step: "dealer-turn"; street: Street }
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
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [raiseAmount, setRaiseAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalHands, setTotalHands] = useState<number>(10);
  const [handCount, setHandCount] = useState(0);
  const [foldedPlayerIds, setFoldedPlayerIds] = useState<Set<string>>(new Set());

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

  // 現在のハンド
  const currentHand: Hand | undefined = useMemo(() => {
    if (!session || !currentHandId) return undefined;
    return session.hands.find((h) => h.id === currentHandId);
  }, [session, currentHandId]);

  // ディーラー用: 全使用済みカード（他プレイヤーのホールカード含む）
  const allUsedCards: readonly Card[] = useMemo(() => {
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
  const hasBetInCurrentStreet = useCallback(
    (street: Street) => {
      if (!currentHand) return false;
      return currentHand.actions.some(
        (a) => a.street === street && a.type === "raise"
      );
    },
    [currentHand]
  );

  // フォールドしていないアクティブプレイヤーのindexリスト
  const activePlayerIndices = useMemo(() => {
    return players
      .map((_, i) => i)
      .filter((i) => {
        const player = players[i];
        return player && !foldedPlayerIds.has(player.id);
      });
  }, [players, foldedPlayerIds]);

  // 指定ストリートで次のアクティブプレイヤーindexを返す
  const getNextActiveIndex = useCallback(
    (afterIndex: number): number | null => {
      for (const idx of activePlayerIndices) {
        if (idx > afterIndex) return idx;
      }
      return null;
    },
    [activePlayerIndices]
  );

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
      setFoldedPlayerIds(new Set());
      setCommunityCards([]);
      setPhase({ step: "player-intro", playerIndex: 0, street: "preflop" });
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
      setPhase({ step: "action-select", playerIndex, street: "preflop" });
    } catch {
      setError("カードの送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- アクション送信 ---
  const submitAction = async (playerIndex: number, actionType: ActionType, street: Street) => {
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

      if (actionType === "fold") {
        setFoldedPlayerIds((prev) => new Set([...prev, player.id]));
      }

      setSelectedCards([]);
      setRaiseAmount("");
      setPhase({ step: "turn-complete", playerIndex, street });
    } catch {
      setError("アクションの記録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- コミュニティカード送信 ---
  const submitCommunityCards = async (street: Street) => {
    if (!currentHandId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // 既存 + 新規のコミュニティカードをマージ
      const existingCommunity = currentHand?.communityCards ?? [];
      const merged = [...existingCommunity, ...communityCards];

      const res = await fetch(
        `/api/sessions/${sessionId}/hands/${currentHandId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            communityCards: merged,
            currentStreet: street,
          }),
        }
      );
      const json = (await res.json()) as ApiResponse<Session>;
      if (!json.success) {
        setError(json.error);
        return;
      }
      setSession(json.data);
      setCommunityCards([]);

      // フォールドしていないプレイヤーでラウンド開始
      const firstActive = activePlayerIndices[0];
      if (firstActive !== undefined && activePlayerIndices.length >= 2) {
        setPhase({ step: "player-intro", playerIndex: firstActive, street });
      } else {
        // 1人以下しか残っていない → ハンド完了
        finishHand();
      }
    } catch {
      setError("コミュニティカードの送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ターン完了 → 次へ ---
  const proceedFromTurnComplete = (currentPlayerIndex: number, street: Street) => {
    const nextIdx = getNextActiveIndex(currentPlayerIndex);

    if (nextIdx !== null) {
      // 次のプレイヤーへ
      if (street === "preflop") {
        setPhase({ step: "player-intro", playerIndex: nextIdx, street: "preflop" });
      } else {
        setPhase({ step: "player-intro", playerIndex: nextIdx, street });
      }
    } else {
      // ラウンド終了 → 次のストリートへ
      const nextStreet = NEXT_STREET[street];
      if (nextStreet && activePlayerIndices.length >= 2) {
        setPhase({ step: "dealer-turn", street: nextStreet });
      } else {
        finishHand();
      }
    }
  };

  // --- ハンド完了 ---
  const finishHand = () => {
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

  const handleCommunityCardSelect = (card: Card) => {
    const requiredCount = phase.step === "dealer-turn" ? (COMMUNITY_CARD_COUNT[phase.street] ?? 0) : 0;
    setCommunityCards((prev) => {
      if (prev.length >= requiredCount) return prev;
      return [...prev, card];
    });
  };

  const handleCommunityCardRemove = (index: number) => {
    setCommunityCards((prev) => prev.filter((_, i) => i !== index));
  };

  // 現在のプレイヤーの名前を取得するヘルパー
  const getPlayerName = (index: number) => players[index]?.name ?? "";
  const getNextPlayerName = (currentIndex: number, street: Street) => {
    const nextIdx = getNextActiveIndex(currentIndex);
    if (nextIdx !== null) return players[nextIdx]?.name ?? "次の人";
    const nextStreet = NEXT_STREET[street];
    if (nextStreet) return "ディーラー";
    return "";
  };

  // ターン完了時の次の行き先を表すメッセージ
  const getTurnCompleteMessage = (currentIndex: number, street: Street) => {
    const nextIdx = getNextActiveIndex(currentIndex);
    if (nextIdx !== null) {
      return { isLast: false, nextName: getPlayerName(nextIdx) };
    }
    const nextStreet = NEXT_STREET[street];
    if (nextStreet && activePlayerIndices.length >= 2) {
      return { isLast: false, nextName: "ディーラー" };
    }
    return { isLast: true, nextName: "" };
  };

  // --- レンダリング ---
  if (phase.step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-950 via-green-900 to-green-950">
        <LoadingSpinner message="読み込み中..." />
      </div>
    );
  }

  const currentStreetLabel = (() => {
    if (phase.step === "player-intro" || phase.step === "action-select" || phase.step === "turn-complete") {
      return STREET_LABELS[phase.street];
    }
    if (phase.step === "dealer-turn") {
      return STREET_LABELS[phase.street];
    }
    return "";
  })();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-green-950 via-green-900 to-green-950">
      {/* 上部バー */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-sm text-gray-400">
          Hand {handCount} / {totalHands}
        </span>
        {currentStreetLabel && (
          <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-gray-300">
            {currentStreetLabel}
          </span>
        )}
        <span className="text-sm font-medium text-poker-gold">
          {players.length}人参加
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        {error && (
          <p className="mb-4 rounded-md bg-danger/20 px-4 py-2 text-sm text-danger">{error}</p>
        )}

        {/* ========== ハンド開始画面 ========== */}
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

        {/* ========== プレイヤーイントロ（プライバシー画面） ========== */}
        {phase.step === "player-intro" && (
          <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-poker-gold/20">
              <span className="text-4xl font-bold text-poker-gold">
                {phase.playerIndex + 1}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white">
              {getPlayerName(phase.playerIndex)}さん
            </h2>
            <p className="text-lg text-gray-300">
              あなたの番です
              {phase.street !== "preflop" && (
                <span className="ml-2 text-sm text-poker-gold">
                  ({STREET_LABELS[phase.street]})
                </span>
              )}
            </p>
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
                if (phase.street === "preflop") {
                  setPhase({ step: "card-input", playerIndex: phase.playerIndex });
                } else {
                  setPhase({ step: "action-select", playerIndex: phase.playerIndex, street: phase.street });
                }
              }}
              className="w-full rounded-lg bg-poker-green px-6 py-4 text-lg font-bold text-white transition-all hover:bg-green-500"
            >
              OK、準備できました
            </button>
          </div>
        )}

        {/* ========== カード入力（プリフロップのみ） ========== */}
        {phase.step === "card-input" && (
          <div className="flex w-full max-w-md flex-col gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-400">Hand {handCount} - プリフロップ</p>
              <h2 className="text-xl font-bold text-white">
                {getPlayerName(phase.playerIndex)}さんのカード
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

            {/* カードセレクター - プレイヤーには自分の選択中カードのみdisable */}
            {selectedCards.length < 2 && (
              <CardSelector
                onSelect={handleCardSelect}
                disabledCards={selectedCards}
              />
            )}

            {/* 確定ボタン */}
            {selectedCards.length === 2 && (
              <button
                type="button"
                onClick={() => {
                  const c0 = selectedCards[0];
                  const c1 = selectedCards[1];
                  if (c0 && c1) {
                    submitCards(phase.playerIndex, [c0, c1]);
                  }
                }}
                disabled={isSubmitting}
                className="rounded-lg bg-poker-gold px-6 py-3 font-bold text-black transition-all hover:bg-yellow-500 disabled:opacity-50"
              >
                {isSubmitting ? "送信中..." : "カードを確定 → アクション選択へ"}
              </button>
            )}
          </div>
        )}

        {/* ========== アクション選択 ========== */}
        {phase.step === "action-select" && (
          <div className="flex w-full max-w-md flex-col gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Hand {handCount} - {STREET_LABELS[phase.street]}
              </p>
              <h2 className="text-xl font-bold text-white">
                {getPlayerName(phase.playerIndex)}さん
              </h2>
            </div>

            {/* コミュニティカード表示（フロップ以降） */}
            {currentHand && currentHand.communityCards.length > 0 && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-gray-400">コミュニティカード</p>
                <div className="flex gap-2">
                  {currentHand.communityCards.map((card, i) => (
                    <PlayingCard key={`${card.suit}-${card.rank}-${i}`} card={card} size="md" />
                  ))}
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <p className="text-center text-sm text-gray-300">アクションを選択してください</p>
            <div className="flex flex-col gap-3">
              {(hasBetInCurrentStreet(phase.street)
                ? (["fold", "call", "raise"] as const)
                : (["fold", "check", "raise"] as const)
              ).map((action) => {
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
                          onClick={() => submitAction(phase.playerIndex, "raise", phase.street)}
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
                    onClick={() => submitAction(phase.playerIndex, action, phase.street)}
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

        {/* ========== ターン完了（タブレットを渡す） ========== */}
        {phase.step === "turn-complete" && (() => {
          const msg = getTurnCompleteMessage(phase.playerIndex, phase.street);
          return (
            <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-poker-green/20">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white">記録完了！</h2>
              <p className="text-lg text-gray-300">
                {msg.isLast ? (
                  "全員の入力が完了しました"
                ) : (
                  <>
                    タブレットを
                    <span className="font-bold text-poker-gold">
                      {" "}{msg.nextName}{" "}
                    </span>
                    に渡してください
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => proceedFromTurnComplete(phase.playerIndex, phase.street)}
                className="w-full rounded-lg bg-poker-gold px-6 py-4 text-lg font-bold text-black transition-all hover:bg-yellow-500"
              >
                {msg.isLast ? "ハンド結果へ" : "次の人の準備ができました"}
              </button>
            </div>
          );
        })()}

        {/* ========== ディーラーターン（コミュニティカード入力） ========== */}
        {phase.step === "dealer-turn" && (() => {
          const requiredCount = COMMUNITY_CARD_COUNT[phase.street] ?? 0;
          return (
            <div className="flex w-full max-w-md flex-col gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Hand {handCount}</p>
                <h2 className="text-xl font-bold text-white">
                  ディーラー: {STREET_LABELS[phase.street]}
                </h2>
                <p className="mt-1 text-sm text-gray-300">
                  コミュニティカードを{requiredCount}枚入力してください
                </p>
              </div>

              {/* 既存のコミュニティカード */}
              {currentHand && currentHand.communityCards.length > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-gray-400">場に出ているカード</p>
                  <div className="flex gap-2">
                    {currentHand.communityCards.map((card, i) => (
                      <PlayingCard key={`${card.suit}-${card.rank}-${i}`} card={card} size="md" />
                    ))}
                  </div>
                </div>
              )}

              {/* 新しく追加するカード */}
              <div className="flex justify-center gap-3">
                {Array.from({ length: requiredCount }).map((_, i) => {
                  const card = communityCards[i];
                  return card ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleCommunityCardRemove(i)}
                      className="transition-transform hover:scale-105"
                    >
                      <PlayingCard card={card} size="md" />
                    </button>
                  ) : (
                    <div
                      key={i}
                      className="flex h-20 w-14 items-center justify-center rounded-lg border-2 border-dashed border-poker-gold/50 text-xl text-poker-gold/50"
                    >
                      ?
                    </div>
                  );
                })}
              </div>

              {/* カードセレクター - ディーラーには全使用済みカードを表示 */}
              {communityCards.length < requiredCount && (
                <CardSelector
                  onSelect={handleCommunityCardSelect}
                  disabledCards={[...allUsedCards, ...communityCards]}
                />
              )}

              {communityCards.length === requiredCount && (
                <button
                  type="button"
                  onClick={() => submitCommunityCards(phase.street)}
                  disabled={isSubmitting}
                  className="rounded-lg bg-poker-gold px-6 py-3 font-bold text-black transition-all hover:bg-yellow-500 disabled:opacity-50"
                >
                  {isSubmitting ? "送信中..." : `${STREET_LABELS[phase.street]}を確定`}
                </button>
              )}
            </div>
          );
        })()}

        {/* ========== ハンド完了 ========== */}
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

        {/* ========== 診断中 ========== */}
        {phase.step === "diagnosing" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <LoadingSpinner message="AIが分析中..." />
            <p className="text-sm text-gray-400">
              プレイスタイルからビジネスタイプを判定しています
            </p>
          </div>
        )}

        {/* ========== 診断完了 ========== */}
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
