import { NextRequest } from "next/server";
import { getSession, getHand, addAction } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";
import { isValidActionType } from "@/lib/validators";
import type { AddActionRequest } from "@/types";

type RouteParams = { params: Promise<{ sessionId: string; handId: string }> };

// POST /api/sessions/[sessionId]/hands/[handId]/actions - アクション追加
export const POST = async (request: NextRequest, { params }: RouteParams) => {
  const { sessionId, handId } = await params;
  const session = getSession(sessionId);

  if (!session) {
    return errorResponse(MESSAGES.sessionNotFound, 404);
  }

  const hand = getHand(sessionId, handId);
  if (!hand) {
    return errorResponse(MESSAGES.handNotFound, 404);
  }

  if (hand.isComplete) {
    return errorResponse("このハンドは既に完了しています");
  }

  const body = (await request.json()) as AddActionRequest;

  if (!body.playerId || !body.type) {
    return errorResponse(MESSAGES.invalidAction);
  }

  if (!isValidActionType(body.type)) {
    return errorResponse(MESSAGES.invalidAction);
  }

  // プレイヤーがこのハンドに参加しているか確認
  const isParticipant = hand.playerHands.some((ph) => ph.playerId === body.playerId);
  if (!isParticipant) {
    return errorResponse(MESSAGES.playerNotFound);
  }

  const updated = addAction(sessionId, handId, {
    playerId: body.playerId,
    type: body.type,
    amount: body.amount ?? null,
  });

  if (!updated) {
    return errorResponse(MESSAGES.unexpectedError, 500);
  }

  return successResponse(updated);
};
