import { SUITS, RANKS, ACTION_TYPES, STREETS } from "@/types";
import type { Card, Suit, Rank, ActionType, Street, Hand } from "@/types";

export const isValidSuit = (value: string): value is Suit =>
  (SUITS as readonly string[]).includes(value);

export const isValidRank = (value: string): value is Rank =>
  (RANKS as readonly string[]).includes(value);

export const isValidCard = (card: { suit: string; rank: string }): card is Card =>
  isValidSuit(card.suit) && isValidRank(card.rank);

export const isValidActionType = (value: string): value is ActionType =>
  (ACTION_TYPES as readonly string[]).includes(value);

export const isValidStreet = (value: string): value is Street =>
  (STREETS as readonly string[]).includes(value);

// 指定カードがコミュニティカードと重複していないかチェック
export const isCardAvailableOnBoard = (card: Card, hand: Hand): boolean => {
  return !hand.communityCards.some(
    (c) => c.suit === card.suit && c.rank === card.rank
  );
};

// 指定カードがハンド内で既に使用されていないかチェック（コミュニティカード + 全ホールカード）
export const isCardAvailableInHand = (card: Card, hand: Hand): boolean => {
  if (!isCardAvailableOnBoard(card, hand)) return false;

  // ホールカードと照合
  const usedInHoleCards = hand.playerHands.some(
    (ph) =>
      ph.holeCards !== null &&
      ph.holeCards.some((c) => c.suit === card.suit && c.rank === card.rank)
  );
  return !usedInHoleCards;
};
