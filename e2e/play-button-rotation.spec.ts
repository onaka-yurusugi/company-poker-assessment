import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createTwoPlayerSession, createThreePlayerSession } from "./fixtures/mock-data";
import {
  goThroughPlayerIntro,
  inputHoleCards,
  chooseAction,
  proceedFromTurnComplete,
  inputCommunityCards,
  playPostflopTurn,
} from "./helpers/play-flow";

test.describe("ボタンポジションのローテーション", () => {
  test.describe("2人プレイヤー", () => {
    test("Hand 1: BTN=Alice → Bobが最初に行動", async ({ page }) => {
      const { session } = createTwoPlayerSession();
      await setupApiMocks(page, session);
      await page.goto(`/play/${session.id}`);

      // hand-start: BTN選択
      await expect(page.getByText("ゲーム開始")).toBeVisible();
      await page.getByText("1. Alice").click();
      await expect(page.getByText("1. Alice (BTN)")).toBeVisible();
      await expect(page.getByText("2. Bob")).toBeVisible();

      await page.getByRole("button", { name: "カードを配る" }).click();

      // Bobが最初に行動（BTNの次）
      await expect(page.getByText("Bobさん")).toBeVisible();
      await expect(page.getByText("あなたの番です")).toBeVisible();
    });

    test("Hand 2: BTN=Bob → Aliceが最初に行動", async ({ page }) => {
      test.slow();
      const { session } = createTwoPlayerSession();
      await setupApiMocks(page, session);
      await page.goto(`/play/${session.id}`);

      // === Hand 1 完走 ===
      await expect(page.getByText("ゲーム開始")).toBeVisible();
      await page.getByRole("button", { name: "5回", exact: true }).click();
      await page.getByText("1. Alice").click();
      await page.getByRole("button", { name: "カードを配る" }).click();

      // Bob → Alice (preflop)
      await goThroughPlayerIntro(page, "Bob");
      await inputHoleCards(page, { suit: "diamond", rank: "Q" }, { suit: "club", rank: "J" });
      await chooseAction(page, "フォールド");
      await proceedFromTurnComplete(page);

      // Hand 1 完了 → 次のハンドへ
      await expect(page.getByText("Hand 1 完了")).toBeVisible();
      await page.getByRole("button", { name: "次のハンドへ" }).click();

      // === Hand 2 ===
      // BTNがBob(index 1)に移動
      await expect(page.getByText("次のハンド")).toBeVisible();
      await expect(page.getByText("1. Alice")).toBeVisible();
      await expect(page.getByText("2. Bob (BTN)")).toBeVisible();

      await page.getByRole("button", { name: "カードを配る" }).click();

      // Aliceが最初に行動（BTNの次）
      await expect(page.getByText("Aliceさん")).toBeVisible();
      await expect(page.getByText("あなたの番です")).toBeVisible();
    });
  });

  test.describe("3人プレイヤー", () => {
    test("Hand 1: BTN=Alice → Bobが最初に行動、3人全員が順番に行動", async ({ page }) => {
      test.slow();
      const { session } = createThreePlayerSession();
      await setupApiMocks(page, session);
      await page.goto(`/play/${session.id}`);

      // hand-start: BTN選択
      await expect(page.getByText("ゲーム開始")).toBeVisible();
      await page.getByText("1. Alice").click();
      await expect(page.getByText("1. Alice (BTN)")).toBeVisible();
      await expect(page.getByText("2. Bob")).toBeVisible();
      await expect(page.getByText("3. Charlie")).toBeVisible();

      await page.getByRole("button", { name: "カードを配る" }).click();

      // Bob(index 1) → Charlie(index 2) → Alice(index 0) の順
      await goThroughPlayerIntro(page, "Bob");
      await inputHoleCards(page, { suit: "diamond", rank: "Q" }, { suit: "club", rank: "J" });
      await chooseAction(page, "チェック");
      await proceedFromTurnComplete(page);

      await goThroughPlayerIntro(page, "Charlie");
      await inputHoleCards(page, { suit: "heart", rank: "10" }, { suit: "spade", rank: "9" });
      await chooseAction(page, "チェック");
      await proceedFromTurnComplete(page);

      await goThroughPlayerIntro(page, "Alice");
      await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "K" });
      await chooseAction(page, "チェック");
      await proceedFromTurnComplete(page);

      // フロップへ
      await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
      await inputCommunityCards(
        page,
        [
          { suit: "club", rank: "5" },
          { suit: "diamond", rank: "6" },
          { suit: "heart", rank: "7" },
        ],
        "フロップ",
      );

      // ポストフロップもBob → Charlie → Aliceの順
      await playPostflopTurn(page, "Bob", "チェック");
      await playPostflopTurn(page, "Charlie", "チェック");
      await playPostflopTurn(page, "Alice", "チェック");

      // ターン
      await expect(page.getByText("ディーラー: ターン")).toBeVisible();
    });

    test("Hand 1→2: BTNがAlice→Bobにローテーション", async ({ page }) => {
      test.slow();
      const { session } = createThreePlayerSession();
      await setupApiMocks(page, session);
      await page.goto(`/play/${session.id}`);

      // === Hand 1 ===
      await expect(page.getByText("ゲーム開始")).toBeVisible();
      await page.getByRole("button", { name: "5回", exact: true }).click();
      await page.getByText("1. Alice").click();
      await page.getByRole("button", { name: "カードを配る" }).click();

      // Bob → Charlie → Alice (preflop) — Bobがfoldしてすぐ終了
      await goThroughPlayerIntro(page, "Bob");
      await inputHoleCards(page, { suit: "diamond", rank: "Q" }, { suit: "club", rank: "J" });
      await chooseAction(page, "フォールド");
      await proceedFromTurnComplete(page);

      await goThroughPlayerIntro(page, "Charlie");
      await inputHoleCards(page, { suit: "heart", rank: "10" }, { suit: "spade", rank: "9" });
      await chooseAction(page, "フォールド");
      await proceedFromTurnComplete(page);

      // Hand 1 完了
      await expect(page.getByText("Hand 1 完了")).toBeVisible();
      await page.getByRole("button", { name: "次のハンドへ" }).click();

      // === Hand 2 ===
      // BTNがBob(index 1)に移動
      await expect(page.getByText("次のハンド")).toBeVisible();
      await expect(page.getByText("1. Alice")).toBeVisible();
      await expect(page.getByText("2. Bob (BTN)")).toBeVisible();
      await expect(page.getByText("3. Charlie")).toBeVisible();

      await page.getByRole("button", { name: "カードを配る" }).click();

      // Charlie(index 2)が最初に行動（BTN=Bob(index 1)の次）
      await expect(page.getByText("Charlieさん")).toBeVisible();
      await expect(page.getByText("あなたの番です")).toBeVisible();
    });
  });

  test("ポストフロップでもBTNの次から行動が始まる", async ({ page }) => {
    test.slow();
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    // === Hand 1: BTN=Alice(index 0) ===
    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "5回", exact: true }).click();
    await page.getByText("1. Alice").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // プリフロップ: Bob → Alice
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "diamond", rank: "Q" }, { suit: "club", rank: "J" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "K" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // フロップ
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

    // フロップでもBob → Alice（BTNの次から）
    await playPostflopTurn(page, "Bob", "チェック");
    await playPostflopTurn(page, "Alice", "チェック");

    // ターン
    await expect(page.getByText("ディーラー: ターン")).toBeVisible();
    await inputCommunityCards(page, [{ suit: "spade", rank: "7" }], "ターン");

    // ターンでもBob → Alice
    await playPostflopTurn(page, "Bob", "チェック");
    await playPostflopTurn(page, "Alice", "チェック");

    // リバー
    await expect(page.getByText("ディーラー: リバー")).toBeVisible();
    await inputCommunityCards(page, [{ suit: "heart", rank: "6" }], "リバー");

    // リバーでもBob → Alice
    await playPostflopTurn(page, "Bob", "チェック");
    await playPostflopTurn(page, "Alice", "チェック");

    // ハンド完了
    await expect(page.getByText("Hand 1 完了")).toBeVisible();
  });
});
