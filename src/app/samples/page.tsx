import type { Metadata } from "next";
import Link from "next/link";
import type { PokerStyle } from "@/types";
import { SAMPLE_RESULTS } from "@/simulations/results";

const STYLE_BADGE: Readonly<
  Record<PokerStyle, { readonly label: string; readonly className: string }>
> = {
  "loose-aggressive": {
    label: "LAG",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  "tight-aggressive": {
    label: "TAG",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  "loose-passive": {
    label: "LP",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  "tight-passive": {
    label: "TP",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
};

export const metadata: Metadata = {
  title: "診断サンプル | Company Poker Assessment",
  description:
    "10種類のプレイスタイルに対する診断サンプルを実データで確認できます。",
};

export default function SamplesIndexPage() {
  if (SAMPLE_RESULTS.length === 0) {
    return (
      <main className="min-h-screen bg-surface px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-xl font-bold text-amber-900">サンプルが未生成です</h1>
          <p className="mt-3 text-sm text-amber-800">
            ターミナルで <code className="rounded bg-amber-100 px-2 py-0.5">npm run simulate:diagnose</code> を実行してサンプルデータを生成してください。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface pb-16">
      <header className="bg-poker-black px-4 py-10 text-center text-white">
        <p className="text-sm text-poker-gold">Company Poker Assessment</p>
        <h1 className="mt-2 text-3xl font-bold">診断サンプル集</h1>
        <p className="mt-3 text-sm text-white/80">
          実際のプレイデータと AI 診断結果の {SAMPLE_RESULTS.length} パターンを掲載しています
        </p>
      </header>

      <section className="mx-auto mt-8 max-w-5xl px-4">
        <p className="mb-6 text-sm text-foreground/70">
          各カードをタップすると、プレイの軌跡・統計・AIによる6軸診断とアドバイスを確認できます。
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_RESULTS.map((sample) => {
            const badge = STYLE_BADGE[sample.diagnosis.pokerStyle];
            return (
              <Link
                key={sample.scenario.id}
                href={`/samples/${sample.scenario.id}`}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-foreground/60">
                      {sample.scenario.persona}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">
                      {sample.scenario.playerName}
                    </h2>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <p className="mt-3 line-clamp-3 text-sm text-foreground/70">
                  {sample.scenario.summary}
                </p>

                <div className="mt-4 rounded-lg bg-poker-black/5 px-3 py-2">
                  <p className="text-xs text-foreground/60">診断タイプ</p>
                  <p className="mt-0.5 text-sm font-bold text-poker-black">
                    {sample.diagnosis.businessType}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-foreground/70">
                  <div className="rounded bg-gray-50 px-1 py-1">
                    <p className="text-foreground/50">VPIP</p>
                    <p className="font-bold text-foreground">
                      {sample.diagnosis.stats.vpip.toFixed(0)}%
                    </p>
                  </div>
                  <div className="rounded bg-gray-50 px-1 py-1">
                    <p className="text-foreground/50">PFR</p>
                    <p className="font-bold text-foreground">
                      {sample.diagnosis.stats.pfr.toFixed(0)}%
                    </p>
                  </div>
                  <div className="rounded bg-gray-50 px-1 py-1">
                    <p className="text-foreground/50">AF</p>
                    <p className="font-bold text-foreground">
                      {sample.diagnosis.stats.aggressionFactor.toFixed(2)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-right text-xs font-medium text-poker-gold group-hover:underline">
                  詳細を見る →
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
