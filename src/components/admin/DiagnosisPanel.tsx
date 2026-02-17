"use client";

import type { DiagnosisResult } from "@/types";
import { ADMIN_LABELS } from "@/constants/ui";
import { formatDateTime } from "@/utils/format";
import DiagnosisCard from "@/components/result/DiagnosisCard";
import RadarChartDisplay from "@/components/result/RadarChartDisplay";
import StatsSummary from "@/components/result/StatsSummary";
import AdviceSection from "@/components/result/AdviceSection";

type DiagnosisPanelProps = {
  readonly results: Readonly<Record<string, DiagnosisResult>>;
};

export default function DiagnosisPanel({ results }: DiagnosisPanelProps) {
  const entries = Object.values(results);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-muted">{ADMIN_LABELS.noDiagnosis}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {entries.map((result) => (
        <div
          key={result.playerId}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm print:break-inside-avoid"
        >
          {/* プレイヤー名ヘッダー */}
          <h3 className="text-lg font-bold text-foreground">
            {result.playerName}
          </h3>

          {/* 診断カード */}
          <DiagnosisCard
            pokerStyle={result.pokerStyle}
            businessType={result.businessType}
            businessTypeDescription={result.businessTypeDescription}
            strengths={result.strengths}
            growthPotentials={result.growthPotentials}
          />

          {/* レーダーチャート */}
          <RadarChartDisplay axes={result.axes} />

          {/* 統計 */}
          <StatsSummary stats={result.stats} />

          {/* AIアドバイス */}
          <AdviceSection advice={result.advice} />

          {/* 診断日時 */}
          <p className="text-right text-xs text-muted">
            診断日時: {formatDateTime(result.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
