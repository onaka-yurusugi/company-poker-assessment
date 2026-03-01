import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createTwoPlayerSession, createThreePlayerSession } from "./fixtures/mock-data";
import {
  goThroughPlayerIntro,
  inputHoleCards,
  chooseAction,
  proceedFromTurnComplete,
} from "./helpers/play-flow";

test.describe("ボタンプレイヤー選択（初回ハンド）", () => {
  test("初回ハンドでBTN選択UIが表示される", async ({ page }) => {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await expect(page.getByText("BTN（ディーラーボタン）を選択してください")).toBeVisible();

    // BTN未選択時はカードを配るが disabled
    await expect(page.getByRole("button", { name: "カードを配る" })).toBeDisabled();
  });

  test("プレイヤーをタップするとBTNインジケータが表示される", async ({ page }) => {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();

    // Bobを選択
    await page.getByText("2. Bob").click();
    await expect(page.getByText("2. Bob (BTN)")).toBeVisible();
    // Aliceには(BTN)がつかない
    await expect(page.getByText("1. Alice (BTN)")).not.toBeVisible();
    await expect(page.getByText("1. Alice")).toBeVisible();

    // カードを配るが有効に
    await expect(page.getByRole("button", { name: "カードを配る" })).toBeEnabled();
  });

  test("BTN選択を変更できる", async ({ page }) => {
    const { session } = createThreePlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();

    // AliceをBTNに選択
    await page.getByText("1. Alice").click();
    await expect(page.getByText("1. Alice (BTN)")).toBeVisible();

    // CharlieにBTNを変更
    await page.getByText("3. Charlie").click();
    await expect(page.getByText("3. Charlie (BTN)")).toBeVisible();
    await expect(page.getByText("1. Alice (BTN)")).not.toBeVisible();
  });

  test("BTN選択後にカードを配ると選択したプレイヤーがBTNになる", async ({ page }) => {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();

    // BobをBTNに選択（index 1）
    await page.getByText("2. Bob").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // BTN=Bob → Aliceが最初に行動
    await expect(page.getByText("Aliceさん")).toBeVisible();
    await expect(page.getByText("あなたの番です")).toBeVisible();
  });

  test("2回目以降のハンドではBTN選択UIが表示されない（自動ローテーション）", async ({ page }) => {
    test.slow();
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    // === Hand 1 ===
    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "5回", exact: true }).click();
    await page.getByText("1. Alice").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // Bob → fold で即完了
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "diamond", rank: "Q" }, { suit: "club", rank: "J" });
    await chooseAction(page, "フォールド");
    await proceedFromTurnComplete(page);

    // Hand 1 完了
    await expect(page.getByText("Hand 1 完了")).toBeVisible();
    await page.getByRole("button", { name: "次のハンドへ" }).click();

    // === Hand 2 ===
    await expect(page.getByText("次のハンド")).toBeVisible();
    // BTN選択案内が表示されない
    await expect(page.getByText("BTN（ディーラーボタン）を選択してください")).not.toBeVisible();
    // BTNは自動でBob
    await expect(page.getByText("2. Bob (BTN)")).toBeVisible();
    // カードを配るは有効（BTN選択不要）
    await expect(page.getByRole("button", { name: "カードを配る" })).toBeEnabled();
  });
});
