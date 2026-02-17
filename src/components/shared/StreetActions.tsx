import type { Hand, Player } from "@/types";
import { STREETS } from "@/types";
import PlayingCard from "@/components/shared/PlayingCard";
import { ACTION_DISPLAY_MAP, ACTION_STYLE_MAP, COMMUNITY_CARD_CUMULATIVE } from "@/constants/poker";
import { STREET_LABELS } from "@/constants/ui";

type StreetActionsProps = {
  readonly hand: Hand;
  readonly players: readonly Player[];
  readonly highlightPlayerId?: string;
};

const PLAYER_HIGHLIGHT = "bg-amber-50 rounded px-1.5 py-0.5";

export default function StreetActions({
  hand,
  players,
  highlightPlayerId,
}: StreetActionsProps) {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const activeStreets = STREETS.filter((s) =>
    hand.actions.some((a) => a.street === s),
  );

  if (activeStreets.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {activeStreets.map((street) => {
        const streetActions = hand.actions
          .filter((a) => a.street === street)
          .sort((a, b) => a.order - b.order);
        const cardCount = COMMUNITY_CARD_CUMULATIVE[street];
        const communityCards = hand.communityCards.slice(0, cardCount);

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
                const isTarget = highlightPlayerId === action.playerId;
                const style = ACTION_STYLE_MAP[action.type];
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
                    <span className={isTarget ? "font-semibold" : "font-medium"}>
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
  );
}
