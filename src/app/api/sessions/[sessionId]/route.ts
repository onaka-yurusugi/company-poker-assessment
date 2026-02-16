import { NextRequest } from "next/server";
import { getSession } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";

type RouteParams = { params: Promise<{ sessionId: string }> };

// GET /api/sessions/[sessionId] - セッション取得
export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  const { sessionId } = await params;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return errorResponse(MESSAGES.sessionNotFound, 404);
    }

    return successResponse(session);
  } catch (error) {
    console.error("GET /api/sessions/[sessionId] error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};
