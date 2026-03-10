import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createTwoPlayerSession } from "./fixtures/mock-data";
import { selectCard } from "./helpers/card-selector";

test.describe("カード重複防止", () => {
  /**
   * 共通セットアップ:
   * 2人プレイ → hand-start → BTN選択 → カードを配る → Bob(index 1)のplayer-intro → card-input
   * Bob が ♠A, ♥K を選択して確定 → action(チェック) → turn-complete
   * → Alice(index 0)のplayer-intro → card-input まで進める
   */
  async function setupToSecondPlayerCardInput(page: import("@playwright/test").Page) {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    // hand-start: BTN選択 → カードを配る
    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByText("1. Alice").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // Bob の player-intro
    await expect(page.getByText("Bobさん")).toBeVisible();
    await page.getByRole("button", { name: "OK、準備できました" }).click();

    // Bob の card-input: ♠A, ♥K を選択
    await expect(page.getByText("Bobさんのカード")).toBeVisible();
    await selectCard(page, "spade", "A");
    await selectCard(page, "heart", "K");
    await page.getByRole("button", { name: /カードを確定/ }).click();

    // Bob の action-select: チェック
    await expect(page.getByText("アクションを選択してください")).toBeVisible();
    await page.getByRole("button", { name: "チェック" }).click();

    // turn-complete → Alice へ
    await expect(page.getByText("記録完了！")).toBeVisible();
    await page.getByRole("button", { name: "次の人の準備ができました" }).click();

    // Alice の player-intro
    await expect(page.getByText("Aliceさん")).toBeVisible();
    await page.getByRole("button", { name: "OK、準備できました" }).click();

    // Alice の card-input フェーズ
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
