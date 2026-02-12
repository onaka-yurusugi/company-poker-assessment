"use client";

import { useMemo, useCallback } from "react";
import type { Session, DiagnosisResult } from "@/types";

type UseDiagnosisResult = {
  readonly isCompleted: boolean;
  readonly results: readonly DiagnosisResult[];
  readonly getPlayerResult: (playerId: string) => DiagnosisResult | null;
};

export function useDiagnosis(session: Session | null): UseDiagnosisResult {
  const isCompleted = session?.status === "completed";

  const results = useMemo<readonly DiagnosisResult[]>(() => {
    if (!isCompleted || !session) return [];
    return Object.values(session.diagnosisResults);
  }, [isCompleted, session]);

  const getPlayerResult = useCallback(
    (playerId: string): DiagnosisResult | null => {
      if (!isCompleted || !session) return null;
      return session.diagnosisResults[playerId] ?? null;
    },
    [isCompleted, session]
  );

  return { isCompleted, results, getPlayerResult };
}
