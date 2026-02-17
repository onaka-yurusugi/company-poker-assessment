import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createCompletedHandSession } from "./fixtures/mock-data";

test.describe("診断フロー", () => {
  test("review → diagnosing → complete の遷移", async ({ page }) => {
    const { session } = createCompletedHandSession();
    const sessionWithTotal = { ...session, status: "playing" as const };
    await setupApiMocks(page, sessionWithTotal);

    // localStorage に totalHands=1 を設定し、hand-complete で「全ハンド終了」状態にする
    await page.addInitScript((id: string) => {
      window.localStorage.setItem(`poker-total-hands-${id}`, "1");
    }, session.id);

    await page.goto(`/play/${session.id}`);

    // ページは hand-complete で復元される（completedHands=1, totalHands=1 → 全完了）
    await expect(page.getByText("Hand 1 完了")).toBeVisible();

    // totalHands=1 なので「全ハンド終了！プレイを振り返る」ボタンが表示される
    await page.getByRole("button", { name: "全ハンド終了！プレイを振り返る" }).click();

    // review フェーズ
    await expect(page.getByText("プレイの振り返り")).toBeVisible();
    await expect(page.getByRole("button", { name: "診断を実行する" })).toBeVisible();

    // 診断実行
    await page.getByRole("button", { name: "診断を実行する" }).click();

    // complete フェーズ
    await expect(page.getByText("診断完了！")).toBeVisible();
    await expect(page.getByText("各プレイヤーの結果を確認してください")).toBeVisible();

    // プレイヤーリスト
    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Bob")).toBeVisible();
    await expect(page.getByText("結果を見る →").first()).toBeVisible();
  });

  test("結果ページへの遷移", async ({ page }) => {
    const { session } = createCompletedHandSession();
    const sessionWithTotal = { ...session, status: "playing" as const };
    await setupApiMocks(page, sessionWithTotal);

    await page.addInitScript((id: string) => {
      window.localStorage.setItem(`poker-total-hands-${id}`, "1");
    }, session.id);

    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("Hand 1 完了")).toBeVisible();
    await page.getByRole("button", { name: "全ハンド終了！プレイを振り返る" }).click();
    await page.getByRole("button", { name: "診断を実行する" }).click();

    await expect(page.getByText("診断完了！")).toBeVisible();

    // Alice の結果ページへ遷移
    await page.getByText("Alice").click();
    await page.waitForURL(`**/result/${session.id}/p1`);
  });
});
