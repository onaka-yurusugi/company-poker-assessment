import Link from "next/link";
import type { SessionSummary } from "@/types";
import { SESSION_STATUS_LABELS, SESSION_STATUS_BADGE_CLASSES, ADMIN_LABELS } from "@/constants/ui";
import { formatDate } from "@/utils/format";

type SessionCardProps = {
  readonly session: SessionSummary;
};

export default function SessionCard({ session }: SessionCardProps) {
  const dateStr = formatDate(session.createdAt);
  const playerNames = session.players.map((p) => p.name).join(", ");

  return (
    <Link
      href={`/admin/${session.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
    >
      {/* ヘッダー行: 日付 + ステータス */}
      <div className="flex items-center justify-between">
        <time className="text-sm font-medium text-gray-600">{dateStr}</time>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SESSION_STATUS_BADGE_CLASSES[session.status]}`}
        >
          {SESSION_STATUS_LABELS[session.status]}
        </span>
      </div>

      {/* 参加者 */}
      <div className="mt-3">
        <p className="text-xs font-medium text-muted">{ADMIN_LABELS.players}</p>
        <p className="mt-0.5 text-sm text-foreground">
          {playerNames || "—"}
        </p>
      </div>

      {/* メタ情報: コード + ハンド数 */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span>
          {ADMIN_LABELS.sessionCode}: <span className="font-mono font-semibold">{session.code}</span>
        </span>
        <span>
          {ADMIN_LABELS.handCount}: {session.handCount}
        </span>
        {session.hasDiagnosis && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600">
            診断済み
          </span>
        )}
      </div>
    </Link>
  );
}
