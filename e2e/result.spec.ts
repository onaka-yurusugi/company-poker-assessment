import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createCompletedSessionWithDiagnosis } from "./fixtures/mock-data";

test.describe("結果ページ", () => {
  test("全セクションが表示される", async ({ page }) => {
    const { session, player1 } = createCompletedSessionWithDiagnosis();
    await setupApiMocks(page, session);

    await page.goto(`/result/${session.id}/${player1.id}`);

    // ヘッダー
    await expect(page.getByText("Company Poker Assessment")).toBeVisible();
    await expect(page.getByText(`${player1.name} さんの診断結果`)).toBeVisible();

    // ビジネスタイプ
    await expect(page.getByText("戦略的リーダータイプ")).toBeVisible();

    // アドバイス
    await expect(
      page.getByText("分析力を活かしつつ、より大胆な挑戦も心がけましょう。")
    ).toBeVisible();

    // 強み
    await expect(page.getByText("冷静な判断力")).toBeVisible();
    await expect(page.getByText("リスク管理能力")).toBeVisible();

    // 改善ポイント
    await expect(page.getByText("慎重すぎる場面がある")).toBeVisible();

    // 統計
    await expect(page.getByText("VPIP")).toBeVisible();

    // 診断日時
    await expect(page.getByText(/診断日時:/)).toBeVisible();
  });

  test("存在しないプレイヤーでエラー表示", async ({ page }) => {
    const { session } = createCompletedSessionWithDiagnosis();
    await setupApiMocks(page, session);

    await page.goto(`/result/${session.id}/nonexistent`);

    await expect(page.getByText("エラー")).toBeVisible();
    await expect(page.getByText("診断結果が見つかりません")).toBeVisible();
  });
});
