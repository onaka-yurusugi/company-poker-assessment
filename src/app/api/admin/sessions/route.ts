import { listSessions } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";
import type { SessionSummary } from "@/types";

// GET /api/admin/sessions — 全セッション一覧
export const GET = async () => {
  try {
    const sessions = await listSessions();
    const summaries: readonly SessionSummary[] = sessions.map((s) => ({
      id: s.id,
      code: s.code,
      status: s.status,
      players: s.players,
      handCount: s.hands.length,
      createdAt: s.createdAt,
      hasDiagnosis: Object.keys(s.diagnosisResults).length > 0,
    }));
    return successResponse(summaries);
  } catch (error) {
    console.error("GET /api/admin/sessions error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};
