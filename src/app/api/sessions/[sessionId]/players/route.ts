import { NextRequest } from "next/server";
import { getSession, addPlayer } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";
import type { AddPlayerRequest } from "@/types";

type RouteParams = { params: Promise<{ sessionId: string }> };

// POST /api/sessions/[sessionId]/players - プレイヤー参加
export const POST = async (request: NextRequest, { params }: RouteParams) => {
  const { sessionId } = await params;
  const session = getSession(sessionId);

  if (!session) {
    return errorResponse(MESSAGES.sessionNotFound, 404);
  }

  const body = (await request.json()) as AddPlayerRequest;

  if (!body.name || body.name.trim().length === 0) {
    return errorResponse(MESSAGES.nameRequired);
  }

  if (body.seatNumber == null) {
    return errorResponse(MESSAGES.seatRequired);
  }

  // 座席の重複チェック
  const seatTaken = session.players.some((p) => p.seatNumber === body.seatNumber);
  if (seatTaken) {
    return errorResponse(MESSAGES.seatTaken);
  }

  const updated = addPlayer(sessionId, body.name.trim(), body.seatNumber);
  if (!updated) {
    return errorResponse(MESSAGES.unexpectedError, 500);
  }

  return successResponse(updated, 201);
};
