import type { PokerStyle } from "@/types";

type DiagnosisCardProps = {
  readonly pokerStyle: PokerStyle;
  readonly businessType: string;
  readonly businessTypeDescription: string;
  readonly strengths?: readonly string[];
  readonly growthPotentials?: readonly string[];
};

const styleConfig: Record<PokerStyle, {
  pokerLabel: string;
  accentClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
}> = {
  "loose-aggressive": {
    pokerLabel: "ルース・アグレッシブ",
    accentClass: "text-poker-red",
    bgClass: "bg-poker-red/5",
    borderClass: "border-poker-red/30",
    badgeClass: "bg-poker-red/10 text-poker-red",
  },
  "tight-aggressive": {
    pokerLabel: "タイト・アグレッシブ",
    accentClass: "text-primary",
    bgClass: "bg-primary/5",
    borderClass: "border-primary/30",
    badgeClass: "bg-primary/10 text-primary",
  },
  "loose-passive": {
    pokerLabel: "ルース・パッシブ",
    accentClass: "text-poker-green",
    bgClass: "bg-poker-green/5",
    borderClass: "border-poker-green/30",
    badgeClass: "bg-poker-green/10 text-poker-green",
  },
  "tight-passive": {
    pokerLabel: "タイト・パッシブ",
    accentClass: "text-secondary",
    bgClass: "bg-secondary/5",
    borderClass: "border-secondary/30",
    badgeClass: "bg-secondary/10 text-secondary",
  },
};

export default function DiagnosisCard({
  pokerStyle,
  businessType,
  businessTypeDescription,
  strengths = [],
  growthPotentials = [],
}: DiagnosisCardProps) {
  const config = styleConfig[pokerStyle];

  return (
    <div className={`rounded-2xl border ${config.borderClass} ${config.bgClass} p-6 shadow-lg sm:p-8`}>
      {/* ポーカースタイルバッジ */}
      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.badgeClass}`}>
        {config.pokerLabel}
      </span>

      {/* ビジネスタイプ名 */}
      <h2 className={`mt-3 text-2xl font-bold sm:text-3xl ${config.accentClass}`}>
        {businessType}
      </h2>

      {/* 説明文 */}
      <p className="mt-3 leading-relaxed text-foreground/80">
        {businessTypeDescription}
      </p>

      {/* 強み・弱み */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* 強み */}
        <div className="rounded-xl bg-white/60 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            強み
          </h3>
          <ul className="space-y-1.5 text-sm text-foreground/70">
            {strengths.map((s) => (
              <li key={s} className="flex items-start gap-1.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* さらなる可能性 */}
        <div className="rounded-xl bg-white/60 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            さらなる可能性
          </h3>
          <ul className="space-y-1.5 text-sm text-foreground/70">
            {growthPotentials.map((g) => (
              <li key={g} className="flex items-start gap-1.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
