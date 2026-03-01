import { NextRequest } from "next/server";
import { getSession, updatePlayerActive } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";
import type { UpdatePlayerRequest } from "@/types";

type RouteParams = { params: Promise<{ sessionId: string; playerId: string }> };

// PATCH /api/sessions/[sessionId]/players/[playerId] - プレイヤーのアクティブ状態更新
export const PATCH = async (request: NextRequest, { params }: RouteParams) => {
  const { sessionId, playerId } = await params;

  try {
    const session = await getSession(sessionId);
    if (!session) {
      return errorResponse(MESSAGES.sessionNotFound, 404);
    }

    const player = session.players.find((p) => p.id === playerId);
    if (!player) {
      return errorResponse(MESSAGES.playerNotFound, 404);
    }

    const body = (await request.json()) as UpdatePlayerRequest;

    // 離脱時: アクティブプレイヤーが2人未満にならないことを確認
    if (!body.isActive) {
      const activeCount = session.players.filter((p) => p.isActive).length;
      if (activeCount <= 2) {
        return errorResponse(MESSAGES.minimumPlayersRequired);
      }
    }

    const updated = await updatePlayerActive(sessionId, playerId, body.isActive);
    if (!updated) {
      return errorResponse(MESSAGES.unexpectedError, 500);
    }

    return successResponse(updated);
  } catch (error) {
    console.error("PATCH /api/sessions/[sessionId]/players/[playerId] error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};
