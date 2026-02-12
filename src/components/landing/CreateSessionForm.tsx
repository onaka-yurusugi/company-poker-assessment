"use client";

import { useState } from "react";
import type { ApiResponse, CreateSessionResponse } from "@/types";

type CreatedSession = {
  readonly id: string;
  readonly code: string;
};

export default function CreateSessionForm() {
  const [createdSession, setCreatedSession] = useState<CreatedSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      const json = (await res.json()) as ApiResponse<CreateSessionResponse>;

      if (!json.success) {
        setError(json.error);
        return;
      }

      setCreatedSession({ id: json.data.id, code: json.data.code });
    } catch {
      setError("セッションの作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdSession) return;
    try {
      await navigator.clipboard.writeText(createdSession.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API非対応環境
    }
  };

  if (createdSession) {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-sm text-gray-300">セッションコードを参加者に共有してください</p>

        <button
          type="button"
          onClick={handleCopy}
          className="group relative cursor-pointer rounded-xl border-2 border-dashed border-poker-gold/60 bg-black/20 px-8 py-4 transition-colors hover:border-poker-gold"
        >
          <p className="font-mono text-4xl font-bold tracking-[0.3em] text-poker-gold">
            {createdSession.code}
          </p>
          <p className="mt-1 text-xs text-gray-400 group-hover:text-gray-300">
            {copied ? "コピーしました！" : "タップしてコピー"}
          </p>
        </button>

        <a
          href={`/dealer/${createdSession.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-poker-gold px-6 py-3 font-semibold text-black transition-colors hover:bg-yellow-500"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ディーラーとして開始
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <p className="rounded-md bg-danger/20 px-4 py-2 text-sm text-danger">{error}</p>
      )}
      <button
        type="button"
        onClick={handleCreate}
        disabled={isLoading}
        className="rounded-lg bg-poker-gold px-8 py-4 text-lg font-bold text-black transition-all hover:bg-yellow-500 hover:shadow-lg hover:shadow-poker-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "作成中..." : "新規セッションを作成"}
      </button>
      <p className="text-sm text-gray-400">
        ディーラー（進行役）として新しいセッションを開始します
      </p>
    </div>
  );
}
