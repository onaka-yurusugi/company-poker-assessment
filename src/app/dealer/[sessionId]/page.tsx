"use client";

import { use, useState, useMemo } from "react";
import { usePolling } from "@/hooks/usePolling";
import type { Session } from "@/types";
import SessionHeader from "@/components/shared/SessionHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import HandManager from "@/components/dealer/HandManager";
import CommunityCardInput from "@/components/dealer/CommunityCardInput";
import ActionRecorder from "@/components/dealer/ActionRecorder";
import DiagnoseButton from "@/components/dealer/DiagnoseButton";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default function DealerPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const [activeHandId, setActiveHandId] = useState<string | null>(null);

  const { data: session, isLoading, error, refresh } = usePolling<Session>(
    `/api/sessions/${sessionId}`,
    5000
  );

  // アクティブなハンド
  const activeHand = useMemo(() => {
    if (!session || !activeHandId) return null;
    return session.hands.find((h) => h.id === activeHandId) ?? null;
  }, [session, activeHandId]);

  // ハンド完了処理
  const handleCompleteHand = async () => {
    if (!activeHand || !session) return;

    try {
      const res = await fetch(
        `/api/sessions/${session.id}/hands/${activeHand.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isComplete: true }),
        }
      );
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        refresh();
      }
    } catch {
      // エラーは次のポーリングで検知される
    }
  };

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

  return (
    <div className="min-h-screen bg-surface">
      <SessionHeader
        sessionCode={session.code}
        playerCount={session.players.length}
        handCount={session.hands.length}
        status={session.status}
      />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左カラム: ハンド管理 + プレイヤー一覧 */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <HandManager
                session={session}
                activeHandId={activeHandId}
                onSelectHand={setActiveHandId}
                onSessionUpdate={refresh}
              />
            </div>

            {/* プレイヤー一覧 */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-gray-800">
                プレイヤー ({session.players.length})
              </h2>
              {session.players.length === 0 ? (
                <p className="text-sm text-gray-400">プレイヤーの参加を待っています...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {session.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-poker-green/10 text-xs font-bold text-poker-green">
                          {player.seatNumber}
                        </span>
                        <span className="text-sm font-medium">{player.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 診断ボタン */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <DiagnoseButton session={session} onComplete={refresh} />
            </div>
          </div>

          {/* 右カラム: アクティブハンド詳細 */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {activeHand ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">
                    ハンド #{activeHand.handNumber}
                    {activeHand.isComplete && (
                      <span className="ml-2 text-sm font-normal text-success">完了</span>
                    )}
                  </h2>
                  {!activeHand.isComplete && (
                    <button
                      type="button"
                      onClick={handleCompleteHand}
                      className="rounded-lg border-2 border-poker-gold bg-poker-gold/10 px-4 py-2 text-sm font-bold text-poker-gold transition-all hover:bg-poker-gold/20"
                    >
                      ハンドを完了
                    </button>
                  )}
                </div>

                {/* コミュニティカード */}
                <CommunityCardInput
                  sessionId={session.id}
                  hand={activeHand}
                  onUpdate={refresh}
                />

                {/* アクション記録 */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <ActionRecorder
                    sessionId={session.id}
                    hand={activeHand}
                    players={session.players}
                    onUpdate={refresh}
                  />
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <p className="text-gray-400">
                    {session.hands.length === 0
                      ? "新しいハンドを作成してください"
                      : "左のハンド一覧からハンドを選択してください"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
