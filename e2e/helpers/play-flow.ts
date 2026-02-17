import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { selectCard } from "./card-selector";

/** player-intro フェーズを通過する */
export async function goThroughPlayerIntro(page: Page, playerName: string): Promise<void> {
  await expect(page.getByText(`${playerName}さん`)).toBeVisible();
  await page.getByRole("button", { name: "OK、準備できました" }).click();
}

/** card-input フェーズでホールカード2枚を入力する */
export async function inputHoleCards(
  page: Page,
  card1: { suit: string; rank: string },
  card2: { suit: string; rank: string },
): Promise<void> {
  await selectCard(page, card1.suit, card1.rank);
  await selectCard(page, card2.suit, card2.rank);
  await page.getByRole("button", { name: /カードを確定/ }).click();
}

/** action-select フェーズでアクションを選択する（fold/check/call） */
export async function chooseAction(
  page: Page,
  action: "フォールド" | "チェック" | "コール",
): Promise<void> {
  await expect(page.getByText("アクションを選択してください")).toBeVisible();
  await page.getByRole("button", { name: action }).click();
}

/** action-select フェーズでレイズを選択する */
export async function chooseRaise(page: Page, amount: number): Promise<void> {
  await expect(page.getByText("アクションを選択してください")).toBeVisible();
  await page.getByPlaceholder("レイズ額").fill(String(amount));
  await page.getByRole("button", { name: "レイズ", exact: true }).click();
}

/** turn-complete フェーズの表示を確認して次へ進む */
export async function proceedFromTurnComplete(page: Page): Promise<void> {
  await expect(page.getByText("記録完了！")).toBeVisible();
  const nextButton = page.getByRole("button", {
    name: /次の人の準備ができました|ハンド結果へ/,
  });
  await nextButton.click();
}

/** dealer-turn フェーズでコミュニティカードを入力する */
export async function inputCommunityCards(
  page: Page,
  cards: ReadonlyArray<{ suit: string; rank: string }>,
  streetLabel: string,
): Promise<void> {
  for (const card of cards) {
    await selectCard(page, card.suit, card.rank);
  }
  await page.getByRole("button", { name: new RegExp(`${streetLabel}を確定`) }).click();
}

/** 1人のプレイヤーのプリフロップターン全体（intro → card-input → action → turn-complete） */
export async function playPreflopTurn(
  page: Page,
  playerName: string,
  card1: { suit: string; rank: string },
  card2: { suit: string; rank: string },
  action: "フォールド" | "チェック" | "コール",
): Promise<void> {
  await goThroughPlayerIntro(page, playerName);
  await inputHoleCards(page, card1, card2);
  await chooseAction(page, action);
  await proceedFromTurnComplete(page);
}

/** 1人のプレイヤーのポストフロップターン（intro → action → turn-complete） */
export async function playPostflopTurn(
  page: Page,
  playerName: string,
  action: "フォールド" | "チェック" | "コール",
): Promise<void> {
  await goThroughPlayerIntro(page, playerName);
  await chooseAction(page, action);
  await proceedFromTurnComplete(page);
}
