import { NextRequest } from "next/server";
import { getSession, getHand, setHoleCards } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";
import { isValidCard, isCardAvailableInHand } from "@/lib/validators";
import type { SetHoleCardsRequest } from "@/types";

type RouteParams = { params: Promise<{ sessionId: string; handId: string }> };

// PUT /api/sessions/[sessionId]/hands/[handId]/hole-cards - ホールカード登録
export const PUT = async (request: NextRequest, { params }: RouteParams) => {
  const { sessionId, handId } = await params;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return errorResponse(MESSAGES.sessionNotFound, 404);
    }

    const hand = await getHand(sessionId, handId);
    if (!hand) {
      return errorResponse(MESSAGES.handNotFound, 404);
    }

    const body = (await request.json()) as SetHoleCardsRequest;

    if (!body.playerId || !body.holeCards || body.holeCards.length !== 2) {
      return errorResponse("プレイヤーIDと2枚のホールカードが必要です");
    }

    // プレイヤーがこのハンドに参加しているか確認
    const isParticipant = hand.playerHands.some((ph) => ph.playerId === body.playerId);
    if (!isParticipant) {
      return errorResponse(MESSAGES.playerNotFound);
    }

    // カードのバリデーション
    for (const card of body.holeCards) {
      if (!isValidCard(card)) {
        return errorResponse(MESSAGES.invalidCard);
      }
      if (!isCardAvailableInHand(card, hand)) {
        return errorResponse(MESSAGES.cardAlreadyUsed);
      }
    }

    const updated = await setHoleCards(sessionId, handId, body.playerId, body.holeCards);
    if (!updated) {
      return errorResponse(MESSAGES.unexpectedError, 500);
    }

    return successResponse(updated);
  } catch (error) {
    console.error("PUT /api/sessions/[sessionId]/hands/[handId]/hole-cards error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};
