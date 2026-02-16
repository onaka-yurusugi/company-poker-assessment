import { NextRequest } from "next/server";
import { createSession, getSessionByCode } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";

// GET /api/sessions?code=XXXXXX - コードでセッション検索
export const GET = async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return errorResponse("セッションコードを指定してください");
  }

  try {
    const session = await getSessionByCode(code.toUpperCase());
    if (!session) {
      return errorResponse(MESSAGES.sessionNotFound, 404);
    }

    return successResponse(session);
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};

// POST /api/sessions - セッション作成
export const POST = async () => {
  try {
    const session = await createSession();
    return successResponse(session, 201);
  } catch (error) {
    console.error("POST /api/sessions error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};
