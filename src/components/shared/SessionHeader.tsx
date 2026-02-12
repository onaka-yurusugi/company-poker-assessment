import type { SessionStatus } from "@/types";

type SessionHeaderProps = {
  readonly sessionCode: string;
  readonly playerCount: number;
  readonly handCount: number;
  readonly status: SessionStatus;
};

const statusConfig: Record<SessionStatus, { label: string; colorClass: string }> = {
  waiting: { label: "待機中", colorClass: "bg-warning/20 text-warning" },
  playing: { label: "プレイ中", colorClass: "bg-success/20 text-success" },
  diagnosing: { label: "診断中", colorClass: "bg-primary/20 text-primary" },
  completed: { label: "完了", colorClass: "bg-secondary/20 text-secondary" },
};

export default function SessionHeader({ sessionCode, playerCount, handCount, status }: SessionHeaderProps) {
  const { label, colorClass } = statusConfig[status];

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted">セッションコード</p>
            <p className="font-mono text-lg font-bold tracking-widest">{sessionCode}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}>
            {label}
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{playerCount}人</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{handCount}ハンド</span>
          </div>
        </div>
      </div>
    </header>
  );
}
