import type { Session } from "@/types";
import { SESSION_STATUS_LABELS, SESSION_STATUS_BADGE_CLASSES, ADMIN_LABELS } from "@/constants/ui";
import { formatDate, formatTime } from "@/utils/format";
import PrintButton from "./PrintButton";

type SessionHeaderProps = {
  readonly session: Session;
};

export default function SessionHeader({ session }: SessionHeaderProps) {
  const dateStr = formatDate(session.createdAt);
  const timeStr = formatTime(session.createdAt);
  const playerNames = session.players.map((p) => p.name).join(", ");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm print:border-none print:shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {ADMIN_LABELS.sessionDetail}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {dateStr} {timeStr}
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <PrintButton />
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${SESSION_STATUS_BADGE_CLASSES[session.status]}`}
          >
            {SESSION_STATUS_LABELS[session.status]}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/80">
        <div>
          <span className="font-medium text-muted">{ADMIN_LABELS.sessionCode}: </span>
          <span className="font-mono font-semibold">{session.code}</span>
        </div>
        <div>
          <span className="font-medium text-muted">{ADMIN_LABELS.players}: </span>
          <span>{playerNames || "—"}</span>
        </div>
        <div>
          <span className="font-medium text-muted">{ADMIN_LABELS.handCount}: </span>
          <span>{session.hands.length}</span>
        </div>
      </div>
    </div>
  );
}
