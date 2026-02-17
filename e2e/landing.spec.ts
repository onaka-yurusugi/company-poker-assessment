import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createMockSession } from "./fixtures/mock-data";

test.describe("ランディングページ", () => {
  test("初期表示: 見出し・入力欄2つ・開始ボタンが無効", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Company Poker Assessment" })).toBeVisible();
    await expect(page.getByText("ポーカーを通じた意思決定タイプ診断")).toBeVisible();
    await expect(page.getByText("参加者を入力してください")).toBeVisible();

    // 入力欄が2つ
    const inputs = page.getByPlaceholder(/プレイヤー\d+の名前/);
    await expect(inputs).toHaveCount(2);

    // 開始ボタンが無効
    const startButton = page.getByRole("button", { name: /人でゲームを開始/ });
    await expect(startButton).toBeDisabled();
  });

  test("プレイヤー名入力で開始ボタンが有効になる", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("プレイヤー1の名前").fill("Alice");
    await page.getByPlaceholder("プレイヤー2の名前").fill("Bob");

    const startButton = page.getByRole("button", { name: "2人でゲームを開始" });
    await expect(startButton).toBeEnabled();
  });

  test("プレイヤーの追加と削除", async ({ page }) => {
    await page.goto("/");

    // 追加
    await page.getByRole("button", { name: "+ プレイヤーを追加" }).click();
    await expect(page.getByPlaceholder(/プレイヤー\d+の名前/)).toHaveCount(3);

    // 削除ボタンは3人以上で表示
    const removeButtons = page.getByRole("button", { name: "✕" });
    await expect(removeButtons.first()).toBeVisible();

    // 削除して2人に戻す
    await removeButtons.first().click();
    await expect(page.getByPlaceholder(/プレイヤー\d+の名前/)).toHaveCount(2);

    // 2人の時は削除ボタンなし
    await expect(page.getByRole("button", { name: "✕" })).toHaveCount(0);
  });

  test("セッション作成と /play ページへの遷移", async ({ page }) => {
    const mockSession = createMockSession({ id: "new-session" });
    await setupApiMocks(page, mockSession);

    await page.goto("/");

    await page.getByPlaceholder("プレイヤー1の名前").fill("Alice");
    await page.getByPlaceholder("プレイヤー2の名前").fill("Bob");
    await page.getByRole("button", { name: "2人でゲームを開始" }).click();

    // /play/{sessionId} に遷移
    await page.waitForURL(`**/play/${mockSession.id}`);
  });

  test("遊び方セクションの表示", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("遊び方")).toBeVisible();
    await expect(page.getByText("名前を入力")).toBeVisible();
    await expect(page.getByText("カードを入力")).toBeVisible();
    await expect(page.getByText("タブレットを回す")).toBeVisible();
    await expect(page.getByText("診断結果")).toBeVisible();
  });
});
