import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/utils/format";
import DiagnosisCard from "@/components/result/DiagnosisCard";
import RadarChartDisplay from "@/components/result/RadarChartDisplay";
import StatsSummary from "@/components/result/StatsSummary";
import AdviceSection from "@/components/result/AdviceSection";
import PlayerPlayReview from "@/components/result/PlayerPlayReview";
import { SAMPLE_RESULTS, findSampleById } from "@/simulations/results";

type RouteParams = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export const generateStaticParams = (): Array<{ id: string }> =>
  SAMPLE_RESULTS.map((s) => ({ id: s.scenario.id }));

export const generateMetadata = async ({ params }: RouteParams): Promise<Metadata> => {
  const { id } = await params;
  const sample = findSampleById(id);
  if (!sample) return { title: "サンプルが見つかりません" };
  return {
    title: `${sample.scenario.persona} (${sample.scenario.playerName}) | 診断サンプル`,
    description: sample.scenario.summary,
  };
};

export default async function SampleDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const sample = findSampleById(id);
  if (!sample) notFound();

  const { scenario, diagnosis, hands, players } = sample;

  return (
    <main className="min-h-screen bg-surface pb-16">
      <header className="bg-poker-black px-4 py-8 text-center text-white print:bg-white print:text-foreground">
        <Link
          href="/samples"
          className="mb-3 inline-block text-xs text-poker-gold/80 hover:text-poker-gold"
        >
          ← サンプル一覧へ戻る
        </Link>
        <p className="text-sm text-poker-gold">サンプル診断結果</p>
        <h1 className="mt-2 text-3xl font-bold">{scenario.playerName} さんの診断結果</h1>
        <p className="mt-2 text-sm text-white/80">{scenario.persona}</p>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-4 pt-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">このサンプルのプレイヤー像</p>
          <p className="mt-2 leading-relaxed">{scenario.summary}</p>
        </div>

        <DiagnosisCard
          pokerStyle={diagnosis.pokerStyle}
          businessType={diagnosis.businessType}
          businessTypeDescription={diagnosis.businessTypeDescription}
          strengths={diagnosis.strengths}
          growthPotentials={diagnosis.growthPotentials}
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <RadarChartDisplay axes={diagnosis.axes} />
        </div>

        <StatsSummary stats={diagnosis.stats} />

        <PlayerPlayReview
          playerId={diagnosis.playerId}
          hands={hands}
          players={players}
        />

        <AdviceSection advice={diagnosis.advice} />

        <div className="border-t border-gray-200 pt-6 text-center print:border-none">
          <p className="text-xs text-muted">
            診断生成日時: {formatDateTime(diagnosis.createdAt)}
          </p>
          <p className="mt-1 text-xs text-muted">
            ※このページは導入企業向けの参考サンプルです。プレイ履歴は意図的に作成された架空データです。
          </p>
        </div>
      </div>
    </main>
  );
}
