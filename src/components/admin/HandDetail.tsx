import type { Hand, Player } from "@/types";
import PlayingCard from "@/components/shared/PlayingCard";
import StreetActions from "@/components/shared/StreetActions";
import { ADMIN_LABELS } from "@/constants/ui";

type HandDetailProps = {
  readonly hand: Hand;
  readonly players: readonly Player[];
};

export default function HandDetail({ hand, players }: HandDetailProps) {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      {/* コミュニティカード */}
      {hand.communityCards.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">
            {ADMIN_LABELS.communityCards}
          </p>
          <div className="flex gap-1">
            {hand.communityCards.map((card, i) => (
              <PlayingCard
                key={`cc-${card.suit}-${card.rank}-${i}`}
                card={card}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* ホールカード */}
      {hand.playerHands.some((ph) => ph.holeCards) && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">
            {ADMIN_LABELS.holeCards}
          </p>
          <div className="flex flex-wrap gap-3">
            {hand.playerHands
              .filter((ph) => ph.holeCards)
              .map((ph) => {
                const name = playerMap.get(ph.playerId)?.name ?? "不明";
                return (
                  <div key={ph.playerId} className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground/70">
                      {name}:
                    </span>
                    <div className="flex gap-0.5">
                      {ph.holeCards!.map((card, i) => (
                        <PlayingCard
                          key={`hole-${ph.playerId}-${card.suit}-${card.rank}-${i}`}
                          card={card}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ストリートごとのアクション */}
      <StreetActions hand={hand} players={players} />

      {/* ポット */}
      {hand.pot > 0 && (
        <p className="text-xs text-muted">
          {ADMIN_LABELS.pot}: {hand.pot}
        </p>
      )}
    </div>
  );
}
