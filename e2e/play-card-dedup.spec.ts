import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createTwoPlayerSession } from "./fixtures/mock-data";
import { selectCard } from "./helpers/card-selector";
import { playPreflopTurn, goThroughPlayerIntro } from "./helpers/play-flow";

test.describe("カード重複防止", () => {
  /**
   * 共通セットアップ:
   * 2人プレイ → hand-start → BTN選択 → カードを配る
   * → Bob のプリフロップターン(♠A, ♥K, チェック)
   * → Alice のcard-input フェーズまで進める
   */
  async function setupToSecondPlayerCardInput(page: import("@playwright/test").Page) {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    // hand-start: BTN選択 → カードを配る
    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByText("1. Alice").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // Bob のプリフロップターン全体（intro → card-input → action → turn-complete）
    await playPreflopTurn(
      page, "Bob",
      { suit: "spade", rank: "A" },
      { suit: "heart", rank: "K" },
      "チェック",
    );

    // Alice の player-intro → card-input フェーズへ
    await goThroughPlayerIntro(page, "Alice");
    await expect(page.getByText("Aliceさんのカード")).toBeVisible();
  }

  test("前のプレイヤーが使用したカードはタップしても選択されない", async ({ page }) => {
    await setupToSecondPlayerCardInput(page);

    // Bob が使った ♠A をタップ → 選択されないことを検証
    await selectCard(page, "spade", "A");

    // まだ「1枚目を選択」の状態のまま = 選択されていない
    await expect(page.getByText("配られたカードを選択してください")).toBeVisible();
  });

  test("前のプレイヤーが使用したカード（2枚目）もタップしても選択されない", async ({ page }) => {
    await setupToSecondPlayerCardInput(page);

    // Bob が使った ♥K をタップ → 選択されないことを検証
    await selectCard(page, "heart", "K");

    // まだ「1枚目を選択」の状態のまま
    await expect(page.getByText("配られたカードを選択してください")).toBeVisible();
  });

  test("使用済みでないカードは正常に選択できる", async ({ page }) => {
    await setupToSecondPlayerCardInput(page);

    // 未使用の ♦Q, ♣J を選択 → 正常に選択できる
    await selectCard(page, "diamond", "Q");
    await selectCard(page, "club", "J");

    // 2枚選択完了 → 確定ボタンが表示される
    await expect(page.getByRole("button", { name: /カードを確定/ })).toBeVisible();
  });

  test("使用済みカードをタップ後に未使用カードを選べる", async ({ page }) => {
    await setupToSecondPlayerCardInput(page);

    // 使用済み ♠A をタップ（反応なし）
    await selectCard(page, "spade", "A");
    await expect(page.getByText("配られたカードを選択してください")).toBeVisible();

    // 未使用の ♦10 を選択 → 1枚目として選択される
    await selectCard(page, "diamond", "10");

    // 使用済み ♥K をタップ（反応なし）
    await selectCard(page, "heart", "K");

    // 未使用の ♣9 を選択 → 2枚目として選択される
    await selectCard(page, "club", "9");

    // 2枚選択完了
    await expect(page.getByRole("button", { name: /カードを確定/ })).toBeVisible();
  });
});
