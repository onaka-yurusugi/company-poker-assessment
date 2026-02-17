import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createTwoPlayerSession } from "./fixtures/mock-data";
import { selectCard } from "./helpers/card-selector";

test.describe("プレイヤーターン", () => {
  // 各テスト共通: hand-start → "カードを配る" → player-intro まで進める
  async function setupToPlayerIntro(page: import("@playwright/test").Page) {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);
    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "カードを配る" }).click();
    await expect(page.getByText("Aliceさん")).toBeVisible();
  }

  test("player-intro: プライバシー画面の表示", async ({ page }) => {
    await setupToPlayerIntro(page);

    await expect(page.getByText("Aliceさん")).toBeVisible();
    await expect(page.getByText("あなたの番です")).toBeVisible();
    await expect(
      page.getByText("他の人に画面が見えないことを確認してから")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "OK、準備できました" })).toBeVisible();
  });

  test("card-input: カード2枚選択と確定", async ({ page }) => {
    await setupToPlayerIntro(page);

    await page.getByRole("button", { name: "OK、準備できました" }).click();

    // card-input フェーズ
    await expect(page.getByText("Aliceさんのカード")).toBeVisible();
    await expect(page.getByText("配られたカードを選択してください")).toBeVisible();

    // カード2枚選択
    await selectCard(page, "spade", "A");
    await selectCard(page, "heart", "K");

    // 確定ボタン表示
    await expect(page.getByRole("button", { name: /カードを確定/ })).toBeVisible();
    await page.getByRole("button", { name: /カードを確定/ }).click();

    // action-select フェーズへ
    await expect(page.getByText("アクションを選択してください")).toBeVisible();
  });

  test("action-select: フォールド選択", async ({ page }) => {
    await setupToPlayerIntro(page);

    // player-intro → card-input → action-select
    await page.getByRole("button", { name: "OK、準備できました" }).click();
    await selectCard(page, "spade", "A");
    await selectCard(page, "heart", "K");
    await page.getByRole("button", { name: /カードを確定/ }).click();

    await expect(page.getByText("アクションを選択してください")).toBeVisible();
    await page.getByRole("button", { name: "フォールド" }).click();

    // turn-complete
    await expect(page.getByText("記録完了！")).toBeVisible();
  });

  test("action-select: チェック選択", async ({ page }) => {
    await setupToPlayerIntro(page);

    await page.getByRole("button", { name: "OK、準備できました" }).click();
    await selectCard(page, "diamond", "Q");
    await selectCard(page, "club", "J");
    await page.getByRole("button", { name: /カードを確定/ }).click();

    await page.getByRole("button", { name: "チェック" }).click();
    await expect(page.getByText("記録完了！")).toBeVisible();
  });

  test("action-select: レイズ選択", async ({ page }) => {
    await setupToPlayerIntro(page);

    await page.getByRole("button", { name: "OK、準備できました" }).click();
    await selectCard(page, "spade", "A");
    await selectCard(page, "heart", "K");
    await page.getByRole("button", { name: /カードを確定/ }).click();

    await page.getByPlaceholder("レイズ額").fill("100");
    await page.getByRole("button", { name: "レイズ", exact: true }).click();
    await expect(page.getByText("記録完了！")).toBeVisible();
  });

  test("turn-complete: 次のプレイヤーへの引き継ぎ表示", async ({ page }) => {
    await setupToPlayerIntro(page);

    await page.getByRole("button", { name: "OK、準備できました" }).click();
    await selectCard(page, "spade", "A");
    await selectCard(page, "heart", "K");
    await page.getByRole("button", { name: /カードを確定/ }).click();
    await page.getByRole("button", { name: "チェック" }).click();

    await expect(page.getByText("記録完了！")).toBeVisible();
    await expect(page.getByText(/Bob/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "次の人の準備ができました" })
    ).toBeVisible();
  });
});
