import { SUIT_DISPLAY_MAP, SUIT_COLOR_MAP } from "@/constants/poker";
import type { Card } from "@/types";

type PlayingCardSize = "sm" | "md" | "lg";

type PlayingCardProps = {
  readonly card: Card;
  readonly size?: PlayingCardSize;
};

const sizeStyles: Record<PlayingCardSize, { container: string; rankCorner: string; suitCenter: string }> = {
  sm: {
    container: "w-10 h-14",
    rankCorner: "text-[0.5rem] leading-tight",
    suitCenter: "text-lg",
  },
  md: {
    container: "w-14 h-20",
    rankCorner: "text-xs leading-tight",
    suitCenter: "text-2xl",
  },
  lg: {
    container: "w-20 h-28",
    rankCorner: "text-sm leading-tight",
    suitCenter: "text-4xl",
  },
};

export default function PlayingCard({ card, size = "md" }: PlayingCardProps) {
  const suitSymbol = SUIT_DISPLAY_MAP[card.suit];
  const colorClass = SUIT_COLOR_MAP[card.suit] === "red" ? "text-poker-red" : "text-poker-black";
  const styles = sizeStyles[size];

  return (
    <div
      className={`${styles.container} relative flex flex-col items-center justify-center rounded-lg border border-gray-300 bg-white shadow-md select-none`}
    >
      {/* 左上: ランク + スート */}
      <div className={`absolute top-0.5 left-1 flex flex-col items-center ${colorClass} ${styles.rankCorner}`}>
        <span className="font-bold">{card.rank}</span>
        <span className="-mt-0.5">{suitSymbol}</span>
      </div>

      {/* 中央: 大きなスート */}
      <span className={`${colorClass} ${styles.suitCenter}`}>{suitSymbol}</span>

      {/* 右下: 反転ランク + スート */}
      <div className={`absolute right-1 bottom-0.5 flex rotate-180 flex-col items-center ${colorClass} ${styles.rankCorner}`}>
        <span className="font-bold">{card.rank}</span>
        <span className="-mt-0.5">{suitSymbol}</span>
      </div>
    </div>
  );
}
