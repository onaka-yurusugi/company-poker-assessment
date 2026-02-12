import type { PokerStats } from "@/types";

type StatsSummaryProps = {
  readonly stats: PokerStats;
};

type StatItem = {
  readonly label: string;
  readonly value: string;
  readonly description: string;
};

function formatStat(stats: PokerStats): readonly StatItem[] {
  return [
    {
      label: "VPIP",
      value: `${stats.vpip.toFixed(1)}%`,
      description: "自発的にポットに参加した割合",
    },
    {
      label: "PFR",
      value: `${stats.pfr.toFixed(1)}%`,
      description: "プリフロップでレイズした割合",
    },
    {
      label: "AF",
      value: stats.aggressionFactor.toFixed(2),
      description: "アグレッション指数（攻撃性）",
    },
    {
      label: "Fold%",
      value: `${stats.foldPercentage.toFixed(1)}%`,
      description: "フォールドした割合",
    },
    {
      label: "CBet%",
      value: `${stats.cbetPercentage.toFixed(1)}%`,
      description: "コンティニュエーションベット率",
    },
    {
      label: "SD%",
      value: `${stats.showdownPercentage.toFixed(1)}%`,
      description: "ショーダウンまで到達した割合",
    },
  ] as const;
}

export default function StatsSummary({ stats }: StatsSummaryProps) {
  const items = formatStat(stats);

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-foreground">ポーカー統計</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-medium text-muted">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{item.value}</p>
            <p className="mt-1 text-xs text-muted/80">{item.description}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-right text-xs text-muted">
        総ハンド数: {stats.totalHands}
      </p>
    </div>
  );
}
