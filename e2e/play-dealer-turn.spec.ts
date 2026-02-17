import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createTwoPlayerSession } from "./fixtures/mock-data";
import { selectCard } from "./helpers/card-selector";
import {
  goThroughPlayerIntro,
  inputHoleCards,
  chooseAction,
  proceedFromTurnComplete,
} from "./helpers/play-flow";

test.describe("dealer-turn フェーズ", () => {
  // hand-start → Alice プリフロップ → Bob プリフロップ → dealer-turn (flop) まで進める
  async function setupToDealerTurn(page: import("@playwright/test").Page) {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    // hand-start
    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // Alice: intro → cards → action → turn-complete
    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "K" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // Bob: intro → cards → action → turn-complete
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "diamond", rank: "Q" }, { suit: "club", rank: "J" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // dealer-turn (flop) に到達
    await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
  }

  test("フロップ: コミュニティカード3枚入力", async ({ page }) => {
    await setupToDealerTurn(page);

    await expect(page.getByText("コミュニティカードを3枚入力してください")).toBeVisible();

    // 3枚のカード選択
    await selectCard(page, "heart", "10");
    await selectCard(page, "diamond", "9");
    await selectCard(page, "club", "8");

    // 確定ボタン
    await expect(page.getByRole("button", { name: "フロップを確定" })).toBeVisible();
    await page.getByRole("button", { name: "フロップを確定" }).click();

    // 次のプレイヤーの player-intro に遷移
    await expect(page.getByText("Aliceさん")).toBeVisible();
    await expect(page.getByText("あなたの番です")).toBeVisible();
  });
});
