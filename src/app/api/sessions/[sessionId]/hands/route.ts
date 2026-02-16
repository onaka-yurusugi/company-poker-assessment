import { NextRequest } from "next/server";
import { getSession, createHand } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";
import type { CreateHandRequest } from "@/types";

type RouteParams = { params: Promise<{ sessionId: string }> };

// GET /api/sessions/[sessionId]/hands - ハンド一覧取得
export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  const { sessionId } = await params;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return errorResponse(MESSAGES.sessionNotFound, 404);
    }

    return successResponse(session.hands);
  } catch (error) {
    console.error("GET /api/sessions/[sessionId]/hands error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};

// POST /api/sessions/[sessionId]/hands - 新規ハンド作成
export const POST = async (request: NextRequest, { params }: RouteParams) => {
  const { sessionId } = await params;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return errorResponse(MESSAGES.sessionNotFound, 404);
    }

    const body = (await request.json()) as CreateHandRequest;

    if (!body.playerIds || body.playerIds.length === 0) {
      return errorResponse("プレイヤーIDが必要です");
    }

    // 全playerIdがセッション内に存在するか確認
    const validPlayerIds = body.playerIds.every((pid) =>
      session.players.some((p) => p.id === pid)
    );
    if (!validPlayerIds) {
      return errorResponse(MESSAGES.playerNotFound);
    }

    const updated = await createHand(sessionId, body.playerIds);
    if (!updated) {
      return errorResponse(MESSAGES.unexpectedError, 500);
    }

    return successResponse(updated, 201);
  } catch (error) {
    console.error("POST /api/sessions/[sessionId]/hands error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};
