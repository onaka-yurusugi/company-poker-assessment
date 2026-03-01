import { test, expect } from "./fixtures/test-fixtures";
import { setupApiMocks } from "./fixtures/api-mocker";
import { createThreePlayerSession } from "./fixtures/mock-data";

test.describe("プレイヤー並べ替え", () => {
  test("hand-startフェーズで上下矢印ボタンが表示される", async ({ page }) => {
    const { session } = createThreePlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();

    // 各プレイヤーに上下矢印ボタンがある
    await expect(page.getByRole("button", { name: "Aliceを上へ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Aliceを下へ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bobを上へ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bobを下へ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Charlieを上へ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Charlieを下へ" })).toBeVisible();
  });

  test("先頭プレイヤーの上矢印がdisabled", async ({ page }) => {
    const { session } = createThreePlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await expect(page.getByRole("button", { name: "Aliceを上へ" })).toBeDisabled();
  });

  test("末尾プレイヤーの下矢印がdisabled", async ({ page }) => {
    const { session } = createThreePlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await expect(page.getByRole("button", { name: "Charlieを下へ" })).toBeDisabled();
  });

  test("下矢印クリックでプレイヤー順序が入れ替わる", async ({ page }) => {
    const { session } = createThreePlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();
    await expect(page.getByText("1. Alice")).toBeVisible();
    await expect(page.getByText("2. Bob")).toBeVisible();
    await expect(page.getByText("3. Charlie")).toBeVisible();

    // AliceをBobの下に移動
    await page.getByRole("button", { name: "Aliceを下へ" }).click();

    // BobとAliceが入れ替わる
    await expect(page.getByText("1. Bob")).toBeVisible();
    await expect(page.getByText("2. Alice")).toBeVisible();
    await expect(page.getByText("3. Charlie")).toBeVisible();
  });

  test("上矢印クリックでプレイヤー順序が入れ替わる", async ({ page }) => {
    const { session } = createThreePlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();

    // Charlieを上に移動
    await page.getByRole("button", { name: "Charlieを上へ" }).click();

    // BobとCharlieが入れ替わる
    await expect(page.getByText("1. Alice")).toBeVisible();
    await expect(page.getByText("2. Charlie")).toBeVisible();
    await expect(page.getByText("3. Bob")).toBeVisible();
  });

  test("並べ替え後もBTN選択が追従する", async ({ page }) => {
    const { session } = createThreePlayerSession();
    await setupApiMocks(page, session);
    await page.goto(`/play/${session.id}`);

    await expect(page.getByText("ゲーム開始")).toBeVisible();

    // AliceをBTNに選択
    await page.getByText("1. Alice").click();
    await expect(page.getByText("1. Alice (BTN)")).toBeVisible();

    // Aliceを下に移動（BobとAliceが入れ替わる）
    await page.getByRole("button", { name: "Aliceを下へ" }).click();

    // AliceのBTN選択が追従して2番目に
    await expect(page.getByText("2. Alice (BTN)")).toBeVisible();
  });
});
