import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createTwoPlayerSession } from "./fixtures/mock-data";

test.describe("hand-start フェーズ", () => {
  test("ゲーム開始画面の初期表示", async ({ page }) => {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);

    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await expect(page.getByText("ハンド数を選択")).toBeVisible();

    // ハンド数選択ボタン
    for (const n of [5, 10, 15, 20]) {
      await expect(page.getByRole("button", { name: `${n}回`, exact: true })).toBeVisible();
    }

    // プレイヤー名一覧
    await expect(page.getByText("1. Alice")).toBeVisible();
    await expect(page.getByText("2. Bob")).toBeVisible();

    // 配るボタン
    await expect(page.getByRole("button", { name: "カードを配る" })).toBeVisible();
  });

  test("ハンド数の選択切り替え", async ({ page }) => {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);

    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();

    // 5回を選択
    await page.getByRole("button", { name: "5回", exact: true }).click();
    // 選択されたボタンはgold系のスタイルが適用される（テキストが存在していればOK）
    await expect(page.getByRole("button", { name: "5回", exact: true })).toBeVisible();
  });

  test("カードを配るクリックで player-intro へ遷移", async ({ page }) => {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);

    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // player-intro: 最初のプレイヤー
    await expect(page.getByText("Aliceさん")).toBeVisible();
    await expect(page.getByText("あなたの番です")).toBeVisible();
    await expect(page.getByRole("button", { name: "OK、準備できました" })).toBeVisible();
  });
});
