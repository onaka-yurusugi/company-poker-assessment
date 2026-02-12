"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { Session, DiagnosisResult, ApiResponse } from "@/types";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import DiagnosisCard from "@/components/result/DiagnosisCard";
import RadarChartDisplay from "@/components/result/RadarChartDisplay";
import StatsSummary from "@/components/result/StatsSummary";
import AdviceSection from "@/components/result/AdviceSection";

export default function ResultPage() {
  const params = useParams<{ sessionId: string; playerId: string }>();
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/sessions/${params.sessionId}`);
        if (!res.ok) {
          throw new Error(`セッション取得に失敗しました (${res.status})`);
        }
        const json = (await res.json()) as ApiResponse<Session>;
        if (!json.success) {
          throw new Error(json.error);
        }
        const diagnosis = json.data.diagnosisResults[params.playerId];
        if (!diagnosis) {
          throw new Error("診断結果が見つかりません");
        }
        setResult(diagnosis);
      } catch (err) {
        setError(err instanceof Error ? err.message : "予期しないエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [params.sessionId, params.playerId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner message="診断結果を読み込み中..." />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-danger/30 bg-danger/5 p-8 text-center">
          <p className="text-lg font-semibold text-danger">エラー</p>
          <p className="mt-2 text-sm text-foreground/70">{error ?? "結果の取得に失敗しました"}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface pb-16">
      {/* ヘッダー */}
      <header className="bg-poker-black px-4 py-8 text-center text-white print:bg-white print:text-foreground">
        <p className="text-sm text-poker-gold">Company Poker Assessment</p>
        <h1 className="mt-2 text-3xl font-bold">{result.playerName} さんの診断結果</h1>
      </header>

      {/* コンテンツ */}
      <div className="mx-auto max-w-2xl space-y-8 px-4 pt-8">
        {/* タイプ診断カード */}
        <DiagnosisCard
          pokerStyle={result.pokerStyle}
          businessType={result.businessType}
          businessTypeDescription={result.businessTypeDescription}
          strengths={result.strengths}
          weaknesses={result.weaknesses}
        />

        {/* レーダーチャート */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <RadarChartDisplay axes={result.axes} />
        </div>

        {/* 統計サマリー */}
        <StatsSummary stats={result.stats} />

        {/* AIアドバイス */}
        <AdviceSection advice={result.advice} />

        {/* フッター */}
        <div className="border-t border-gray-200 pt-6 text-center print:border-none">
          <p className="text-xs text-muted">
            診断日時: {new Date(result.createdAt).toLocaleString("ja-JP")}
          </p>
        </div>
      </div>
    </main>
  );
}
