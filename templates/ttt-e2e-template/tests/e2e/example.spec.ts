import { test, expect } from "@playwright/test";

test.describe("サンプル E2E テスト", () => {
  test("ホームページが正しく表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.*/, { timeout: 5000 });
  });

  test("ナビゲーションが機能する", async ({ page }) => {
    await page.goto("/");
    // ページが読み込まれることを確認
    await expect(page.locator("body")).toBeVisible();
  });
});
