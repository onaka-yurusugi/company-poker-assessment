import type { Page, Locator } from "@playwright/test";

// src/constants/poker.ts の SUIT_DISPLAY_MAP に対応
const SUIT_SYMBOL: Record<string, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

// src/components/player/CardSelector.tsx の RANK_LABEL に対応
const RANK_LABEL: Record<string, string> = {
  A: "A", K: "K", Q: "Q", J: "J", "10": "T",
  "9": "9", "8": "8", "7": "7", "6": "6",
  "5": "5", "4": "4", "3": "3", "2": "2",
};

/**
 * CardSelector コンポーネントから指定のカードをクリックする。
 *
 * CardSelector の DOM 構造:
 * ```
 * <div class="flex flex-col gap-1">  ← ルート
 *   <div class="flex items-center gap-1">  ← スート行
 *     <span>♠</span>  ← スートシンボル
 *     <div class="grid ...">  ← ランクグリッド
 *       <button>A</button>
 *       <button>K</button>
 *       ...
 *     </div>
 *   </div>
 *   ...
 * </div>
 * ```
 *
 * @param container - CardSelector を含むコンテナの Locator（複数 CardSelector がある場合に限定用）
 */
export async function selectCard(
  page: Page,
  suit: string,
  rank: string,
  container?: Locator,
): Promise<void> {
  const symbol = SUIT_SYMBOL[suit];
  const label = RANK_LABEL[rank];
  if (!symbol || !label) {
    throw new Error(`Invalid card: ${suit} ${rank}`);
  }

  const root = container ?? page;

  // スートシンボルの <span> を探し、その親 (スート行) 内のボタンをクリック
  const suitSpan = root.locator("span", { hasText: new RegExp(`^\\${symbol}$`) });
  const suitRow = suitSpan.locator("..");
  await suitRow.locator(`button:has-text("${label}")`).click();
}
