import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createTwoPlayerSession } from "./fixtures/mock-data";
import {
  goThroughPlayerIntro,
  inputHoleCards,
  chooseAction,
  proceedFromTurnComplete,
  inputCommunityCards,
  playPostflopTurn,
} from "./helpers/play-flow";

test.describe("統合テスト: 2人で1ハンド完走", () => {
  test("プリフロップ → フロップ → ターン → リバー → ハンド完了", async ({ page }) => {
    test.slow(); // 長いテストなのでタイムアウト延長

    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    // === hand-start ===
    // Hand 1: BTN=Alice(index 0) → Bob(index 1)が先に行動
    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "5回", exact: true }).click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // === プリフロップ ===
    // Bob (BTNの次 = 最初に行動)
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "diamond", rank: "Q" }, { suit: "club", rank: "J" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // Alice
    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "K" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // === フロップ ===
    await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
    await inputCommunityCards(
      page,
      [
        { suit: "heart", rank: "10" },
        { suit: "diamond", rank: "9" },
        { suit: "club", rank: "8" },
      ],
      "フロップ",
    );

    // Bob フロップ (BTNの次 = 最初に行動)
    await playPostflopTurn(page, "Bob", "チェック");
    // Alice フロップ
    await playPostflopTurn(page, "Alice", "チェック");

    // === ターン ===
    await expect(page.getByText("ディーラー: ターン")).toBeVisible();
    await inputCommunityCards(page, [{ suit: "spade", rank: "7" }], "ターン");

    // Bob ターン
    await playPostflopTurn(page, "Bob", "チェック");
    // Alice ターン
    await playPostflopTurn(page, "Alice", "チェック");

    // === リバー ===
    await expect(page.getByText("ディーラー: リバー")).toBeVisible();
    await inputCommunityCards(page, [{ suit: "heart", rank: "6" }], "リバー");

    // Bob リバー
    await playPostflopTurn(page, "Bob", "チェック");
    // Alice リバー
    await playPostflopTurn(page, "Alice", "チェック");

    // === ハンド完了 ===
    await expect(page.getByText("Hand 1 完了")).toBeVisible();
    await expect(page.getByText("1 / 5 ハンド終了")).toBeVisible();
    await expect(page.getByRole("button", { name: "次のハンドへ" })).toBeVisible();
  });
});
