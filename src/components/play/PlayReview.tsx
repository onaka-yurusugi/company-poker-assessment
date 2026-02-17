import type { Hand, Player, Action, Street } from "@/types";
import { STREETS } from "@/types";
import PlayingCard from "@/components/shared/PlayingCard";
import { ACTION_DISPLAY_MAP } from "@/constants/poker";
import { STREET_LABELS } from "@/constants/ui";

type PlayReviewProps = {
  readonly hands: readonly Hand[];
  readonly players: readonly Player[];
  readonly onContinue: () => void;
};

// ストリートごとのコミュニティカード枚数（累計）
const COMMUNITY_CARD_CUMULATIVE: Readonly<Record<Street, number>> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
};

// アクションに応じたスタイルクラス
const ACTION_STYLE: Readonly<Record<Action["type"], string>> = {
  fold: "text-gray-400",
  check: "text-gray-300",
  call: "text-poker-green",
  raise: "text-poker-gold font-semibold",
};

// プレイヤーのアクションパターンに対する振り返りコメントを生成
function getHandInsight(
  playerActions: readonly Action[],
  playerName: string,
): string | null {
  const preflopActions = playerActions.filter((a) => a.street === "preflop");
  const postflopActions = playerActions.filter((a) => a.street !== "preflop");
  const hasFolded = playerActions.some((a) => a.type === "fold");
  const raiseCount = playerActions.filter((a) => a.type === "raise").length;
  const callCount = playerActions.filter((a) => a.type === "call").length;

  // プリフロップでフォールド
  const foldedPreflop = preflopActions.some((a) => a.type === "fold");
  if (foldedPreflop) {
    return `${playerName}さんはプリフロップで降りました。慎重な判断ですが、参加しないとチャンスも逃します`;
  }

  // レイズ多め（2回以上）
  if (raiseCount >= 2) {
    return `${playerName}さんは積極的にレイズしました。主導権を握るプレイスタイルです`;
  }

  // フロップ以降でフォールド
  if (hasFolded && postflopActions.some((a) => a.type === "fold")) {
    const foldStreet = playerActions.find((a) => a.type === "fold")?.street;
    if (foldStreet && foldStreet !== "preflop") {
      return `${playerName}さんは${STREET_LABELS[foldStreet]}で降りました。損切りの判断が見られます`;
    }
  }

  // コールばかり（受動的）
  if (callCount >= 2 && raiseCount === 0) {
    return `${playerName}さんはコール中心のプレイでした。受動的なスタイルは相手に主導権を渡しやすくなります`;
  }

  // リバーまで残った
  const reachedRiver = !hasFolded;
  if (reachedRiver && playerActions.length > 0) {
    return `${playerName}さんは最後まで勝負しました。粘り強いプレイです`;
  }

  return null;
}

// ストリートに対応するコミュニティカードのスライスを返す
function getCommunityCardsForStreet(
  hand: Hand,
  street: Street,
): readonly typeof hand.communityCards[number][] {
  const count = COMMUNITY_CARD_CUMULATIVE[street];
  return hand.communityCards.slice(0, count);
}

export default function PlayReview({
  hands,
  players,
  onContinue,
}: PlayReviewProps) {
  const completedHands = hands.filter((h) => h.isComplete);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">プレイの振り返り</h2>
        <p className="mt-1 text-sm text-gray-400">
          {completedHands.length}ハンドのプレイラインを確認しましょう
        </p>
      </div>

      {/* ハンドごとの振り返り */}
      <div className="flex flex-col gap-5">
        {completedHands.map((hand) => (
          <HandReviewCard
            key={hand.id}
            hand={hand}
            playerMap={playerMap}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full rounded-lg bg-secondary px-6 py-4 text-lg font-bold text-white transition-all hover:bg-purple-500"
      >
        診断を実行する
      </button>
    </div>
  );
}

// --- ハンドごとのレビューカード ---

type HandReviewCardProps = {
  readonly hand: Hand;
  readonly playerMap: ReadonlyMap<string, Player>;
};

function HandReviewCard({ hand, playerMap }: HandReviewCardProps) {
  // このハンドに含まれるストリートを抽出（アクションがあるストリートのみ）
  const activeStreets = STREETS.filter((s) =>
    hand.actions.some((a) => a.street === s),
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      {/* ハンドヘッダー */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-poker-gold">
          Hand {hand.handNumber}
        </h3>
        {hand.communityCards.length > 0 && (
          <div className="flex gap-1">
            {hand.communityCards.map((card, i) => (
              <PlayingCard
                key={`${card.suit}-${card.rank}-${i}`}
                card={card}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>

      {/* プレイヤーのホールカード */}
      {hand.playerHands.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {hand.playerHands.map((ph) => {
            const player = playerMap.get(ph.playerId);
            if (!player || !ph.holeCards) return null;
            return (
              <div
                key={ph.playerId}
                className="flex items-center gap-2 rounded-lg bg-poker-gold/15 px-3 py-2 ring-1 ring-poker-gold/30"
              >
                <span className="text-xs font-medium text-poker-gold">
                  {player.name}
                </span>
                <div className="flex gap-0.5">
                  <PlayingCard card={ph.holeCards[0]} size="sm" />
                  <PlayingCard card={ph.holeCards[1]} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ストリートごとのアクション */}
      <div className="flex flex-col gap-3">
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
                        key={`cc-${street}-${card.suit}-${card.rank}-${i}`}
                        card={card}
                        size="sm"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5 pl-3">
                {streetActions.map((action) => (
                  <ActionLine
                    key={`${action.playerId}-${action.order}`}
                    action={action}
                    playerName={
                      playerMap.get(action.playerId)?.name ?? "不明"
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* プレイヤーごとの振り返りコメント */}
      <PlayerInsights hand={hand} playerMap={playerMap} />
    </div>
  );
}

// --- アクション1行表示 ---

type ActionLineProps = {
  readonly action: Action;
  readonly playerName: string;
};

function ActionLine({ action, playerName }: ActionLineProps) {
  const style = ACTION_STYLE[action.type];
  const amountText =
    action.type === "raise" && action.amount !== null
      ? ` (${action.amount})`
      : "";

  return (
    <p className={`text-sm ${style}`}>
      <span className="text-gray-300">{playerName}</span>{" "}
      {ACTION_DISPLAY_MAP[action.type]}
      {amountText}
    </p>
  );
}

// --- プレイヤーごとの振り返りコメント ---

type PlayerInsightsProps = {
  readonly hand: Hand;
  readonly playerMap: ReadonlyMap<string, Player>;
};

function PlayerInsights({ hand, playerMap }: PlayerInsightsProps) {
  // ハンドに参加したプレイヤーIDの一意リスト（アクション順）
  const playerIds = [
    ...new Set(hand.actions.map((a) => a.playerId)),
  ];

  const insights = playerIds
    .map((playerId) => {
      const player = playerMap.get(playerId);
      if (!player) return null;
      const playerActions = hand.actions.filter(
        (a) => a.playerId === playerId,
      );
      const insight = getHandInsight(playerActions, player.name);
      return insight ? { playerId, insight } : null;
    })
    .filter(
      (item): item is { playerId: string; insight: string } => item !== null,
    );

  if (insights.length === 0) return null;

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <div className="flex flex-col gap-1.5">
        {insights.map(({ playerId, insight }) => (
          <p key={playerId} className="text-xs leading-relaxed text-gray-400">
            💡 {insight}
          </p>
        ))}
      </div>
    </div>
  );
}
