import { NextRequest } from "next/server";
import { getSession, reorderPlayers } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";
import type { ReorderPlayersRequest } from "@/types";

type RouteParams = { params: Promise<{ sessionId: string }> };

// PUT /api/sessions/[sessionId]/players/reorder - プレイヤー並べ替え
export const PUT = async (request: NextRequest, { params }: RouteParams) => {
  const { sessionId } = await params;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return errorResponse(MESSAGES.sessionNotFound, 404);
    }

    const body = (await request.json()) as ReorderPlayersRequest;

    if (!body.playerIds || body.playerIds.length === 0) {
      return errorResponse(MESSAGES.playerIdsRequired);
    }

    if (body.playerIds.length !== session.players.length) {
      return errorResponse(MESSAGES.allPlayerIdsRequired);
    }

    const updated = await reorderPlayers(sessionId, body.playerIds);
    if (!updated) {
      return errorResponse(MESSAGES.unexpectedError, 500);
    }

    return successResponse(updated);
  } catch (error) {
    console.error("PUT /api/sessions/[sessionId]/players/reorder error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};
