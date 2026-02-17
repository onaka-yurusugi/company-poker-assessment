import { NextRequest } from "next/server";
import { getSession, setSessionStatus, setDiagnosisResults } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";
import { calculatePokerStats } from "@/lib/poker-stats";
import { determinePokerStyle, getBusinessType } from "@/lib/diagnosis-mapper";
import { DIAGNOSIS_SYSTEM_PROMPT, buildDiagnosisUserPrompt } from "@/lib/prompt";
import { generateDiagnosis } from "@/lib/openai";
import type { DiagnosisResult } from "@/types";

type RouteParams = { params: Promise<{ sessionId: string }> };

// POST /api/sessions/[sessionId]/diagnose - AI診断実行
export const POST = async (_request: NextRequest, { params }: RouteParams) => {
  const { sessionId } = await params;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return errorResponse(MESSAGES.sessionNotFound, 404);
    }

    if (session.players.length === 0) {
      return errorResponse("プレイヤーが登録されていません");
    }

    if (session.hands.length === 0) {
      return errorResponse("ハンドデータがありません");
    }

    // 診断中ステータスに更新（gamePhaseも同期）
    await setSessionStatus(sessionId, "diagnosing", { step: "diagnosing" });

    const results: Record<string, DiagnosisResult> = {};

    for (const player of session.players) {
      const stats = calculatePokerStats(player.id, session.hands);
      const pokerStyle = determinePokerStyle(stats);
      const businessType = getBusinessType(pokerStyle);

      const userPrompt = buildDiagnosisUserPrompt(
        player.name,
        stats,
        pokerStyle,
        businessType.name
      );

      const aiResponse = await generateDiagnosis(DIAGNOSIS_SYSTEM_PROMPT, userPrompt);

      results[player.id] = {
        playerId: player.id,
        playerName: player.name,
        pokerStyle,
        businessType: businessType.name,
        businessTypeDescription: businessType.description,
        axes: aiResponse.axes,
        stats,
        advice: aiResponse.advice,
        strengths: aiResponse.strengths,
        weaknesses: aiResponse.weaknesses,
        createdAt: new Date().toISOString(),
      };
    }

    const updated = await setDiagnosisResults(sessionId, results);
    if (!updated) {
      return errorResponse(MESSAGES.unexpectedError, 500);
    }

    return successResponse(updated);
  } catch (error) {
    console.error("POST /api/sessions/[sessionId]/diagnose error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};
