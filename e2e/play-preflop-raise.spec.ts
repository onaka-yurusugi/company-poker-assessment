import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import {
  createMockSession,
  createMockPlayer,
  resetCounter,
  createTwoPlayerSession,
  createThreePlayerSession,
} from "./fixtures/mock-data";
import { selectCard } from "./helpers/card-selector";
import {
  goThroughPlayerIntro,
  inputHoleCards,
  chooseAction,
  chooseRaise,
  proceedFromTurnComplete,
} from "./helpers/play-flow";

/**
 * Issue #31 再現テスト
 * プリフロップでレイズが入った後、全員が同額をコールするまで終了してはいけない
 */

function createFourPlayerSession() {
  resetCounter();
  const player1 = createMockPlayer({ id: "p1", name: "Alice", seatNumber: 1 });
  const player2 = createMockPlayer({ id: "p2", name: "Bob", seatNumber: 2 });
  const player3 = createMockPlayer({ id: "p3", name: "Charlie", seatNumber: 3 });
  const player4 = createMockPlayer({ id: "p4", name: "Dave", seatNumber: 4 });
  return {
    session: createMockSession({
      id: "test-session-4p",
      players: [player1, player2, player3, player4],
    }),
  };
}

test.describe("Issue #31: プリフロップ レイズ時の終了タイミング", () => {
  test("2人HU BTN/SB(Alice)がレイズ → BB(Bob)がコール → フロップへ", async ({ page }) => {
    const { session } = createTwoPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "5回", exact: true }).click();
    await page.getByText("1. Alice").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // ヘッズアップは BTN(=SB) が最初に行動 = Alice
    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "A" });
    await chooseRaise(page, 100);
    await proceedFromTurnComplete(page);

    // BB Bob → コール
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "diamond", rank: "K" }, { suit: "club", rank: "K" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
  });

  test("3人 BTN/UTG(Alice)がレイズ → 全員コール → フロップへ", async ({ page }) => {
    const { session } = createThreePlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "5回", exact: true }).click();
    await page.getByText("1. Alice").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // 3人ではBTN=UTGが最初に行動 = Alice
    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "A" });
    await chooseRaise(page, 100);
    await proceedFromTurnComplete(page);

    // SB Bob → コール
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "diamond", rank: "K" }, { suit: "club", rank: "K" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // BB Charlie → コール
    await goThroughPlayerIntro(page, "Charlie");
    await inputHoleCards(page, { suit: "spade", rank: "Q" }, { suit: "heart", rank: "Q" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
  });

  test("4人 P3(UTG)がレイズ → 残り3人がコール → 全員アクション後にフロップへ", async ({ page }) => {
    const { session } = createFourPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    // ハンド開始: BTN=Alice
    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "5回", exact: true }).click();
    await page.getByText("1. Alice").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // P3 (Dave, UTG) が最初にアクション → レイズ
    await goThroughPlayerIntro(page, "Dave");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "A" });
    await chooseRaise(page, 100);
    await proceedFromTurnComplete(page);

    // 次は P0 (Alice, BTN) → コール
    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "diamond", rank: "K" }, { suit: "club", rank: "K" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // 次は P1 (Bob, SB) → コール
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "spade", rank: "Q" }, { suit: "heart", rank: "Q" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // 次は P2 (Charlie, BB) → コール
    await goThroughPlayerIntro(page, "Charlie");
    await inputHoleCards(page, { suit: "diamond", rank: "J" }, { suit: "club", rank: "J" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // 全員レイズに対してコールしたので、フロップへ
    await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
  });

  test("4人 BTN=Bob(P1), P0(Alice/UTG)がレイズ → 残り3人がコール", async ({ page }) => {
    const { session } = createFourPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "5回", exact: true }).click();
    await page.getByText("2. Bob").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // P0 (Alice, UTG) → レイズ
    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "A" });
    await chooseRaise(page, 100);
    await proceedFromTurnComplete(page);

    // P1 (Bob, BTN) → コール
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "diamond", rank: "K" }, { suit: "club", rank: "K" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // P2 (Charlie, SB) → コール
    await goThroughPlayerIntro(page, "Charlie");
    await inputHoleCards(page, { suit: "spade", rank: "Q" }, { suit: "heart", rank: "Q" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // P3 (Dave, BB) → コール
    await goThroughPlayerIntro(page, "Dave");
    await inputHoleCards(page, { suit: "diamond", rank: "J" }, { suit: "club", rank: "J" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
  });

  test("4人 P3(UTG)がレイズ → P0(BTN)がリレイズ → P3まで全員コール", async ({ page }) => {
    const { session } = createFourPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "5回", exact: true }).click();
    await page.getByText("1. Alice").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // P3 (Dave, UTG) → レイズ100
    await goThroughPlayerIntro(page, "Dave");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "A" });
    await chooseRaise(page, 100);
    await proceedFromTurnComplete(page);

    // P0 (Alice, BTN) → リレイズ300
    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "diamond", rank: "K" }, { suit: "club", rank: "K" });
    await chooseRaise(page, 300);
    await proceedFromTurnComplete(page);

    // P1 (Bob, SB) → コール
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "spade", rank: "Q" }, { suit: "heart", rank: "Q" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // P2 (Charlie, BB) → コール
    await goThroughPlayerIntro(page, "Charlie");
    await inputHoleCards(page, { suit: "diamond", rank: "J" }, { suit: "club", rank: "J" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // 元のレイザーのP3 (Dave) が再度コール必要
    await goThroughPlayerIntro(page, "Dave");
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
  });

  test("ハンド2: BTNローテーション後にUTGがレイズ → 全員コール", async ({ page }) => {
    const { session } = createFourPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    // === Hand 1: BTN=Alice ===
    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "5回", exact: true }).click();
    await page.getByText("1. Alice").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // 全員チェックして hand 1 完了
    // P3 Dave (UTG)
    await goThroughPlayerIntro(page, "Dave");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "K" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    // P0 Alice (BTN)
    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "diamond", rank: "Q" }, { suit: "club", rank: "J" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    // P1 Bob (SB)
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "heart", rank: "A" }, { suit: "spade", rank: "K" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    // P2 Charlie (BB)
    await goThroughPlayerIntro(page, "Charlie");
    await inputHoleCards(page, { suit: "club", rank: "Q" }, { suit: "diamond", rank: "J" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // フロップ → 全員フォールドで早期終了
    await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
    // 簡単に: コミュニティカード3枚入力
    await selectCard(page, "heart", "10");
    await selectCard(page, "diamond", "9");
    await selectCard(page, "club", "8");
    await page.getByRole("button", { name: /フロップを確定/ }).click();

    // フロップで全員フォールドだとhandが終わるので、全員チェックする方法をとる
    // BTN=P0, 最初に行動するのはP1(SB)
    await goThroughPlayerIntro(page, "Bob");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    await goThroughPlayerIntro(page, "Charlie");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    await goThroughPlayerIntro(page, "Dave");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    await goThroughPlayerIntro(page, "Alice");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // ターン
    await expect(page.getByText("ディーラー: ターン")).toBeVisible();
    await selectCard(page, "spade", "7");
    await page.getByRole("button", { name: /ターンを確定/ }).click();
    await goThroughPlayerIntro(page, "Bob");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    await goThroughPlayerIntro(page, "Charlie");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    await goThroughPlayerIntro(page, "Dave");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    await goThroughPlayerIntro(page, "Alice");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // リバー
    await expect(page.getByText("ディーラー: リバー")).toBeVisible();
    await selectCard(page, "heart", "6");
    await page.getByRole("button", { name: /リバーを確定/ }).click();
    await goThroughPlayerIntro(page, "Bob");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    await goThroughPlayerIntro(page, "Charlie");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    await goThroughPlayerIntro(page, "Dave");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);
    await goThroughPlayerIntro(page, "Alice");
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    await expect(page.getByText("Hand 1 完了")).toBeVisible();
    await page.getByRole("button", { name: "次のハンドへ" }).click();

    // === Hand 2: BTN ローテーション → BTN=Bob, UTG=Alice ===
    await expect(page.getByText("次のハンド")).toBeVisible();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // P0 (Alice, UTG) → レイズ
    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "A" });
    await chooseRaise(page, 100);
    await proceedFromTurnComplete(page);

    // P1 (Bob, BTN) → コール
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "diamond", rank: "K" }, { suit: "club", rank: "K" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // P2 (Charlie, SB) → コール
    await goThroughPlayerIntro(page, "Charlie");
    await inputHoleCards(page, { suit: "spade", rank: "Q" }, { suit: "heart", rank: "Q" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // P3 (Dave, BB) → コール
    await goThroughPlayerIntro(page, "Dave");
    await inputHoleCards(page, { suit: "diamond", rank: "J" }, { suit: "club", rank: "J" });
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // フロップへ
    await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
  });

  test("4人 全員リンプ → P2(BB)がレイズ → 残り3人がコール", async ({ page }) => {
    const { session } = createFourPlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await page.getByRole("button", { name: "5回", exact: true }).click();
    await page.getByText("1. Alice").click();
    await page.getByRole("button", { name: "カードを配る" }).click();

    // P3 (Dave, UTG) → コール (limp)
    await goThroughPlayerIntro(page, "Dave");
    await inputHoleCards(page, { suit: "spade", rank: "A" }, { suit: "heart", rank: "A" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // P0 (Alice, BTN) → コール
    await goThroughPlayerIntro(page, "Alice");
    await inputHoleCards(page, { suit: "diamond", rank: "K" }, { suit: "club", rank: "K" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // P1 (Bob, SB) → コール
    await goThroughPlayerIntro(page, "Bob");
    await inputHoleCards(page, { suit: "spade", rank: "Q" }, { suit: "heart", rank: "Q" });
    await chooseAction(page, "チェック");
    await proceedFromTurnComplete(page);

    // P2 (Charlie, BB) → レイズ
    await goThroughPlayerIntro(page, "Charlie");
    await inputHoleCards(page, { suit: "diamond", rank: "J" }, { suit: "club", rank: "J" });
    await chooseRaise(page, 200);
    await proceedFromTurnComplete(page);

    // P2のレイズに対して残り全員(P3, P0, P1)がコール必要
    await goThroughPlayerIntro(page, "Dave");
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    await goThroughPlayerIntro(page, "Alice");
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    await goThroughPlayerIntro(page, "Bob");
    await chooseAction(page, "コール");
    await proceedFromTurnComplete(page);

    // フロップへ
    await expect(page.getByText("ディーラー: フロップ")).toBeVisible();
  });
});
