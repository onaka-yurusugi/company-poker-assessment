"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import type { Session } from "@/types";
import { ADMIN_LABELS } from "@/constants/ui";
import { formatDateTime } from "@/utils/format";
import { usePolling } from "@/hooks/usePolling";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import PrintButton from "@/components/admin/PrintButton";
import DiagnosisCard from "@/components/result/DiagnosisCard";
import RadarChartDisplay from "@/components/result/RadarChartDisplay";
import StatsSummary from "@/components/result/StatsSummary";
import AdviceSection from "@/components/result/AdviceSection";
import PlayerPlayReview from "@/components/result/PlayerPlayReview";

export default function AdminPlayerReportPage() {
  const params = useParams<{ sessionId: string; playerId: string }>();
  const {
    data: session,
    isLoading,
    error,
  } = usePolling<Session>(`/api/sessions/${params.sessionId}`, 0);

  const result = session?.diagnosisResults[params.playerId];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner message="診断結果を読み込み中..." />
      </div>
    );
  }

  if (error || !session || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-danger/30 bg-danger/5 p-8 text-center">
          <p className="text-lg font-semibold text-danger">エラー</p>
          <p className="mt-2 text-sm text-foreground/70">
            {error ?? "診断結果が見つかりません"}
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
          {result.playerName} さんの診断結果
        </h1>
      </header>

      {/* コンテンツ */}
      <div className="mx-auto max-w-2xl space-y-8 px-4 pt-8">
        {/* ナビゲーション */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href={`/admin/${params.sessionId}`}
            className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
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
          <PrintButton />
        </div>

        {/* タイプ診断カード */}
        <DiagnosisCard
          pokerStyle={result.pokerStyle}
          businessType={result.businessType}
          businessTypeDescription={result.businessTypeDescription}
          strengths={result.strengths}
          growthPotentials={result.growthPotentials}
        />

        {/* レーダーチャート */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <RadarChartDisplay axes={result.axes} />
        </div>

        {/* 統計サマリー */}
        <StatsSummary stats={result.stats} />

        {/* プレイの振り返り */}
        <PlayerPlayReview
          playerId={params.playerId}
          hands={session.hands}
          players={session.players}
        />

        {/* AIアドバイス */}
        <AdviceSection advice={result.advice} />

        {/* フッター */}
        <div className="border-t border-gray-200 pt-6 text-center print:border-none">
          <p className="text-xs text-muted">
            診断日時: {formatDateTime(result.createdAt)}
          </p>
        </div>
      </div>
    </main>
  );
}
