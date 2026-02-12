"use client";

import { useState } from "react";
import type { Session, ApiResponse, DiagnoseResponse } from "@/types";

type DiagnoseButtonProps = {
  readonly session: Session;
  readonly onComplete: () => void;
};

export default function DiagnoseButton({ session, onComplete }: DiagnoseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 全ハンドが完了しているか
  const allHandsComplete =
    session.hands.length > 0 && session.hands.every((h) => h.isComplete);

  const canDiagnose =
    allHandsComplete &&
    session.status !== "diagnosing" &&
    session.status !== "completed";

  const handleDiagnose = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${session.id}/diagnose`, {
        method: "POST",
      });
      const json = (await res.json()) as ApiResponse<DiagnoseResponse>;

      if (!json.success) {
        setError(json.error);
        return;
      }

      onComplete();
    } catch {
      setError("診断の実行に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (session.status === "completed") {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
        <p className="font-bold text-success">診断完了</p>
        <p className="mt-1 text-sm text-gray-600">
          各プレイヤーの結果画面で診断結果を確認できます
        </p>
      </div>
    );
  }

  if (session.status === "diagnosing" || isLoading) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
        <p className="font-bold text-primary">AIが診断中...</p>
        <p className="mt-1 text-sm text-gray-500">しばらくお待ちください</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <button
        type="button"
        onClick={handleDiagnose}
        disabled={!canDiagnose}
        className="rounded-xl bg-secondary px-6 py-4 text-lg font-bold text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-secondary/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        診断を実行する
      </button>
      {!allHandsComplete && (
        <p className="text-center text-xs text-warning">
          全てのハンドを完了してから診断を実行してください
        </p>
      )}
    </div>
  );
}
