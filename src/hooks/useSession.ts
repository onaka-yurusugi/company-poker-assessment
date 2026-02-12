"use client";

import { useCallback } from "react";
import type { Session } from "@/types";
import { useLocalStorage } from "./useLocalStorage";
import { usePolling } from "./usePolling";

type UseSessionResult = {
  readonly session: Session | null;
  readonly playerId: string | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly setPlayerId: (id: string) => void;
  readonly refresh: () => void;
};

export function useSession(sessionId: string): UseSessionResult {
  const [playerId, setPlayerId] = useLocalStorage<string | null>(
    `poker-player-${sessionId}`,
    null
  );

  const {
    data: session,
    isLoading,
    error,
    refresh,
  } = usePolling<Session>(
    `/api/sessions/${sessionId}`,
    3000,
    { enabled: !!sessionId }
  );

  const handleSetPlayerId = useCallback(
    (id: string) => {
      setPlayerId(id);
    },
    [setPlayerId]
  );

  return {
    session,
    playerId,
    isLoading,
    error,
    setPlayerId: handleSetPlayerId,
    refresh,
  };
}
