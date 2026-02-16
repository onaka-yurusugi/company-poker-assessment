import type { Hand, Player, Action, Street } from "@/types";
import { STREETS } from "@/types";
import PlayingCard from "@/components/shared/PlayingCard";
import { ACTION_DISPLAY_MAP } from "@/constants/poker";
import { STREET_LABELS } from "@/constants/ui";

type PlayerPlayReviewProps = {
  readonly playerId: string;
  readonly hands: readonly Hand[];
  readonly players: readonly Player[];
};

const COMMUNITY_CARD_CUMULATIVE: Readonly<Record<Street, number>> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
};

const ACTION_STYLE: Readonly<Record<Action["type"], string>> = {
  fold: "text-gray-500",
  check: "text-gray-600",
  call: "text-emerald-600",
  raise: "text-amber-600 font-semibold",
};

// 対象プレイヤーのアクションかどうかで強調を変える
const PLAYER_HIGHLIGHT = "bg-amber-50 rounded px-1.5 py-0.5";

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

function getCommunityCardsForStreet(
  hand: Hand,
  street: Street,
): readonly typeof hand.communityCards[number][] {
  const count = COMMUNITY_CARD_CUMULATIVE[street];
  return hand.communityCards.slice(0, count);
}

export default function PlayerPlayReview({
  playerId,
  hands,
  players,
}: PlayerPlayReviewProps) {
  const completedHands = hands.filter((h) => h.isComplete);
  const playerMap = new Map(players.map((p) => [p.id, p]));

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
            playerMap={playerMap}
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
  readonly playerMap: ReadonlyMap<string, Player>;
};

function HandCard({ hand, playerId, playerMap }: HandCardProps) {
  const activeStreets = STREETS.filter((s) =>
    hand.actions.some((a) => a.street === s),
  );

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
      <div className="flex flex-col gap-2.5">
        {activeStreets.map((street) => {
          const streetActions = hand.actions
            .filter((a) => a.street === street)
            .sort((a, b) => a.order - b.order);
          const communityCards = getCommunityCardsForStreet(hand, street);

          return (
            <div key={street}>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">
                  {STREET_LABELS[street]}
                </span>
                {street !== "preflop" && communityCards.length > 0 && (
                  <div className="flex gap-0.5">
                    {communityCards.map((card, i) => (
                      <PlayingCard
                        key={`sc-${street}-${card.suit}-${card.rank}-${i}`}
                        card={card}
                        size="sm"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5 pl-3">
                {streetActions.map((action) => {
                  const isTarget = action.playerId === playerId;
                  const style = ACTION_STYLE[action.type];
                  const name =
                    playerMap.get(action.playerId)?.name ?? "不明";
                  const amountText =
                    action.type === "raise" && action.amount !== null
                      ? ` (${action.amount})`
                      : "";

                  return (
                    <p
                      key={`${action.playerId}-${action.order}`}
                      className={`text-sm ${style} ${isTarget ? PLAYER_HIGHLIGHT : ""}`}
                    >
                      <span className={isTarget ? "font-semibold" : ""}>
                        {name}
                      </span>{" "}
                      {ACTION_DISPLAY_MAP[action.type]}
                      {amountText}
                    </p>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* インサイト */}
      {insight && (
        <p className="mt-3 border-t border-gray-200 pt-2.5 text-xs leading-relaxed text-gray-500">
          💡 {insight}
        </p>
      )}
    </div>
  );
}
