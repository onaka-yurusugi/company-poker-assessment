"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import type { Session } from "@/types";
import { ADMIN_LABELS } from "@/constants/ui";
import { usePolling } from "@/hooks/usePolling";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import SessionHeader from "@/components/admin/SessionHeader";
import DiagnosisPanel from "@/components/admin/DiagnosisPanel";
import HandHistory from "@/components/admin/HandHistory";

export default function AdminSessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const {
    data: session,
    isLoading,
    error,
  } = usePolling<Session>(`/api/sessions/${params.sessionId}`, 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner message="セッション情報を読み込み中..." />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-danger/30 bg-danger/5 p-8 text-center">
          <p className="text-lg font-semibold text-danger">エラー</p>
          <p className="mt-2 text-sm text-foreground/70">
            {error ?? "セッション情報の取得に失敗しました"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface pb-16">
      {/* ヘッダー */}
      <header className="bg-poker-black px-4 py-8 text-center text-white print:bg-white print:text-foreground print:py-4">
        <p className="text-sm text-poker-gold print:text-gray-500">
          Company Poker Assessment
        </p>
        <h1 className="mt-2 text-3xl font-bold print:text-xl">
          {ADMIN_LABELS.pageTitle}
        </h1>
      </header>

      {/* コンテンツ */}
      <div className="mx-auto max-w-4xl space-y-8 px-4 pt-8">
        {/* 戻るリンク */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground print:hidden"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {ADMIN_LABELS.backToList}
        </Link>

        {/* セッションヘッダー */}
        <SessionHeader session={session} />

        {/* 診断結果 */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-foreground">
            {ADMIN_LABELS.diagnosisResults}
          </h2>
          <DiagnosisPanel results={session.diagnosisResults} sessionId={params.sessionId} />
        </section>

        {/* ハンド履歴 */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-foreground">
            {ADMIN_LABELS.handHistory}
          </h2>
          <HandHistory hands={session.hands} players={session.players} />
        </section>

        {/* 印刷用フッター */}
        <div className="hidden border-t border-gray-200 pt-4 text-center print:block">
          <p className="text-xs text-muted">
            Company Poker Assessment — 出力日時:{" "}
            {new Date().toLocaleString("ja-JP")}
          </p>
        </div>
      </div>
    </main>
  );
}
