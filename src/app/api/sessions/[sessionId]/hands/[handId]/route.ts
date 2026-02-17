import { NextRequest } from "next/server";
import { getSession, getHand, updateHand } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";
import { MESSAGES } from "@/constants/ui";
import { isValidStreet, isValidCard, isCardAvailableInHand } from "@/lib/validators";
import type { UpdateHandRequest } from "@/types";

type RouteParams = { params: Promise<{ sessionId: string; handId: string }> };

// PUT /api/sessions/[sessionId]/hands/[handId] - ハンド更新
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

    const body = (await request.json()) as UpdateHandRequest;

    // コミュニティカードのバリデーション
    if (body.communityCards !== undefined) {
      for (const card of body.communityCards) {
        if (!isValidCard(card)) {
          return errorResponse(MESSAGES.invalidCard);
        }
        if (!isCardAvailableInHand(card, hand)) {
          return errorResponse(MESSAGES.cardAlreadyUsed);
        }
      }
    }

    // ストリートのバリデーション
    if (body.currentStreet !== undefined && !isValidStreet(body.currentStreet)) {
      return errorResponse(MESSAGES.invalidAction);
    }

    const updated = await updateHand(
      sessionId,
      handId,
      {
        communityCards: body.communityCards
          ? [...hand.communityCards, ...body.communityCards]
          : undefined,
        currentStreet: body.currentStreet,
        isComplete: body.isComplete,
        pot: body.pot,
      },
      body.gamePhase
    );

    if (!updated) {
      return errorResponse(MESSAGES.unexpectedError, 500);
    }

    return successResponse(updated);
  } catch (error) {
    console.error("PUT /api/sessions/[sessionId]/hands/[handId] error:", error);
    return errorResponse(MESSAGES.unexpectedError, 500);
  }
};
