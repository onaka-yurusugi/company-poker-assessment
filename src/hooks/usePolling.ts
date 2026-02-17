"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type UsePollingResult<T> = {
  readonly data: T | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refresh: () => void;
};

export function usePolling<T>(
  url: string,
  intervalMs: number,
  options?: { enabled?: boolean }
): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const enabled = options?.enabled ?? true;
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // 実行中のリクエストをキャンセル
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json = (await res.json()) as { success: boolean; data: T; error?: string };
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error ?? "Unknown error");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // 初回は即時fetch
    setIsLoading(true);
    fetchData();

    // intervalMs <= 0 の場合は初回のみ（ポーリングなし）
    if (intervalMs <= 0) {
      return () => {
        abortControllerRef.current?.abort();
      };
    }

    const intervalId = setInterval(fetchData, intervalMs);

    return () => {
      clearInterval(intervalId);
      abortControllerRef.current?.abort();
    };
  }, [enabled, intervalMs, fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
