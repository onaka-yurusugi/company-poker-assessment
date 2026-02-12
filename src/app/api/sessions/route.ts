import { NextRequest } from "next/server";
import { createSession, getSessionByCode } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";

// GET /api/sessions?code=XXXXXX - コードでセッション検索
export const GET = (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return errorResponse("セッションコードを指定してください");
  }

  const session = getSessionByCode(code.toUpperCase());
  if (!session) {
    return errorResponse(MESSAGES.sessionNotFound, 404);
  }

  return successResponse(session);
};

// POST /api/sessions - セッション作成
export const POST = () => {
  const session = createSession();
  return successResponse(session, 201);
};
