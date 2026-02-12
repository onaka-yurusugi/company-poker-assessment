"use client";

import { use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import SessionHeader from "@/components/shared/SessionHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import HoleCardInput from "@/components/player/HoleCardInput";
import PlayerHandList from "@/components/player/PlayerHandList";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default function PlayerPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const searchParams = useSearchParams();
  const playerId = searchParams.get("playerId");
  const router = useRouter();

  const { session, isLoading, error, refresh } = useSession(sessionId);

  // 現在のプレイヤー情報
  const currentPlayer = useMemo(
    () => session?.players.find((p) => p.id === playerId) ?? null,
    [session, playerId]
  );

  // まだホールカードを入力していない最新のハンド
  const pendingHand = useMemo(() => {
    if (!session || !playerId) return null;
    // ハンドを逆順にチェックして、まだホールカード未入力のものを探す
    for (let i = session.hands.length - 1; i >= 0; i--) {
      const hand = session.hands[i];
      if (!hand) continue;
      const playerHand = hand.playerHands.find((ph) => ph.playerId === playerId);
      if (playerHand && !playerHand.holeCards) {
        return hand;
      }
    }
    return null;
  }, [session, playerId]);

  // すでに使用済みのカードを集める（現在のハンドのコミュニティカード + 他プレイヤーのホールカード）
  const usedCards = useMemo(() => {
    if (!pendingHand) return [];
    const cards = [...pendingHand.communityCards];
    for (const ph of pendingHand.playerHands) {
      if (ph.playerId !== playerId && ph.holeCards) {
        cards.push(...ph.holeCards);
      }
    }
    return cards;
  }, [pendingHand, playerId]);

  // セッション完了時にリダイレクト
  if (session?.status === "completed" && playerId) {
    router.push(`/result/${sessionId}/${playerId}`);
    return null;
  }

  if (isLoading) {
    return <LoadingSpinner message="セッション情報を読み込み中..." />;
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl bg-danger/10 px-6 py-4 text-center">
          <p className="font-bold text-danger">エラー</p>
          <p className="mt-1 text-sm text-gray-600">{error ?? "セッションが見つかりません"}</p>
        </div>
      </div>
    );
  }

  if (!playerId || !currentPlayer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl bg-warning/10 px-6 py-4 text-center">
          <p className="font-bold text-warning">プレイヤー情報がありません</p>
          <p className="mt-1 text-sm text-gray-600">トップページから参加し直してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <SessionHeader
        sessionCode={session.code}
        playerCount={session.players.length}
        handCount={session.hands.length}
        status={session.status}
      />

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* プレイヤー情報 */}
        <div className="mb-6 text-center">
          <p className="text-sm text-muted">プレイヤー</p>
          <p className="text-xl font-bold">{currentPlayer.name}</p>
          <p className="text-xs text-muted">Seat {currentPlayer.seatNumber}</p>
        </div>

        {/* ステータス表示 */}
        {session.status === "waiting" && (
          <div className="mb-6 rounded-xl border border-poker-gold/30 bg-poker-gold/5 p-4 text-center">
            <p className="font-semibold text-poker-gold">ゲーム開始を待っています...</p>
            <p className="mt-1 text-sm text-gray-500">
              ディーラーがハンドを開始するまでお待ちください
            </p>
          </div>
        )}

        {session.status === "diagnosing" && (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="font-semibold text-primary">診断中...</p>
            <p className="mt-1 text-sm text-gray-500">
              AIがあなたのプレイスタイルを分析しています
            </p>
          </div>
        )}

        {/* ホールカード入力 */}
        {pendingHand && session.status === "playing" && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-poker-green text-xs font-bold text-white">
                {pendingHand.handNumber}
              </span>
              <span className="text-sm font-medium text-gray-700">
                ハンド {pendingHand.handNumber} - ホールカードを入力
              </span>
            </div>
            <HoleCardInput
              sessionId={sessionId}
              handId={pendingHand.id}
              playerId={playerId}
              existingCards={usedCards}
              onSubmit={refresh}
            />
          </div>
        )}

        {/* 入力待ち（ホールカード入力済み、次のハンド待ち） */}
        {!pendingHand && session.status === "playing" && (
          <div className="mb-6 rounded-xl border border-success/30 bg-success/5 p-4 text-center">
            <p className="font-semibold text-success">入力完了</p>
            <p className="mt-1 text-sm text-gray-500">
              次のハンドが始まるまでお待ちください
            </p>
          </div>
        )}

        {/* ハンド一覧 */}
        <div>
          <h2 className="mb-3 text-sm font-bold text-gray-700">入力済みハンド</h2>
          <PlayerHandList hands={session.hands} playerId={playerId} />
        </div>
      </main>
    </div>
  );
}
