import type { Hand, Player, Action } from "@/types";
import PlayingCard from "@/components/shared/PlayingCard";
import StreetActions from "@/components/shared/StreetActions";
import { STREET_LABELS } from "@/constants/ui";

type PlayerPlayReviewProps = {
  readonly playerId: string;
  readonly hands: readonly Hand[];
  readonly players: readonly Player[];
};

function getPlayerInsight(
  playerActions: readonly Action[],
): string | null {
  const preflopActions = playerActions.filter((a) => a.street === "preflop");
  const hasFolded = playerActions.some((a) => a.type === "fold");
  const raiseCount = playerActions.filter((a) => a.type === "raise").length;
  const callCount = playerActions.filter((a) => a.type === "call").length;

  if (preflopActions.some((a) => a.type === "fold")) {
    return "プリフロップで降りています。慎重な判断ですが、参加しないとチャンスも掴めません";
  }

  if (raiseCount >= 2) {
    return "積極的にレイズしています。主導権を握るプレイスタイルが見られます";
  }

  if (hasFolded) {
    const foldStreet = playerActions.find((a) => a.type === "fold")?.street;
    if (foldStreet && foldStreet !== "preflop") {
      return `${STREET_LABELS[foldStreet]}で降りています。状況を見て損切りする判断力があります`;
    }
  }

  if (callCount >= 2 && raiseCount === 0) {
    return "コール中心のプレイでした。受動的なスタイルは相手に主導権を渡しやすくなります";
  }

  if (!hasFolded && playerActions.length > 0) {
    return "最後まで勝負しています。粘り強いプレイが見られます";
  }

  return null;
}

export default function PlayerPlayReview({
  playerId,
  hands,
  players,
}: PlayerPlayReviewProps) {
  const completedHands = hands.filter((h) => h.isComplete);

  if (completedHands.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <h2 className="mb-1 text-lg font-bold text-gray-900">
        プレイの振り返り
      </h2>
      <p className="mb-5 text-sm text-gray-500">
        各ハンドでのアクションを振り返ります
      </p>

      <div className="flex flex-col gap-5">
        {completedHands.map((hand) => (
          <HandCard
            key={hand.id}
            hand={hand}
            playerId={playerId}
            players={players}
          />
        ))}
      </div>
    </div>
  );
}

// --- ハンドカード ---

type HandCardProps = {
  readonly hand: Hand;
  readonly playerId: string;
  readonly players: readonly Player[];
};

function HandCard({ hand, playerId, players }: HandCardProps) {
  const playerActions = hand.actions.filter((a) => a.playerId === playerId);
  const insight = getPlayerInsight(playerActions);

  // このプレイヤーのホールカード
  const playerHand = hand.playerHands.find((ph) => ph.playerId === playerId);

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      {/* ヘッダー */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">
          Hand {hand.handNumber}
        </h3>
        <div className="flex items-center gap-3">
          {/* ホールカード */}
          {playerHand?.holeCards && (
            <div className="flex gap-0.5">
              {playerHand.holeCards.map((card, i) => (
                <PlayingCard
                  key={`hole-${card.suit}-${card.rank}-${i}`}
                  card={card}
                  size="sm"
                />
              ))}
            </div>
          )}
          {/* コミュニティカード */}
          {hand.communityCards.length > 0 && (
            <div className="flex gap-0.5">
              {hand.communityCards.map((card, i) => (
                <PlayingCard
                  key={`cc-${card.suit}-${card.rank}-${i}`}
                  card={card}
                  size="sm"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ストリートごとのアクション */}
      <StreetActions
        hand={hand}
        players={players}
        highlightPlayerId={playerId}
      />

      {/* インサイト */}
      {insight && (
        <p className="mt-3 border-t border-gray-200 pt-2.5 text-xs leading-relaxed text-gray-500">
          💡 {insight}
        </p>
      )}
    </div>
  );
}
