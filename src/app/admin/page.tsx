"use client";

import type { SessionSummary } from "@/types";
import { ADMIN_LABELS } from "@/constants/ui";
import { usePolling } from "@/hooks/usePolling";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import SessionCard from "@/components/admin/SessionCard";

export default function AdminPage() {
  const {
    data: sessions,
    isLoading,
    error,
  } = usePolling<readonly SessionSummary[]>("/api/admin/sessions", 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner message="セッション一覧を読み込み中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-danger/30 bg-danger/5 p-8 text-center">
          <p className="text-lg font-semibold text-danger">エラー</p>
          <p className="mt-2 text-sm text-foreground/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface pb-16">
      {/* ヘッダー */}
      <header className="bg-poker-black px-4 py-8 text-center text-white">
        <p className="text-sm text-poker-gold">Company Poker Assessment</p>
        <h1 className="mt-2 text-3xl font-bold">{ADMIN_LABELS.pageTitle}</h1>
      </header>

      {/* コンテンツ */}
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {ADMIN_LABELS.sessionList}
        </h2>

        {!sessions || sessions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-muted">{ADMIN_LABELS.noSessions}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
