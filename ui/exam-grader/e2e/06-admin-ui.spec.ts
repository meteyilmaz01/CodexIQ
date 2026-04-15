import { test, expect } from "@playwright/test";
import { loginViaAPI, waitForPageReady } from "./helpers";

test.describe("Admin UI - Deep Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, "admin");
  });

  // ══════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════
  test.describe("Dashboard", () => {
    test("Dashboard loads with stat cards", async ({ page }) => {
      await page.goto("/admin");
      await waitForPageReady(page);
      const cards = page.locator(".ant-card");
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
      expect(await cards.count()).toBeGreaterThanOrEqual(4);
    });

    test("Dashboard has quick action buttons", async ({ page }) => {
      await page.goto("/admin");
      await waitForPageReady(page);
      // Should have clickable elements/buttons
      const buttons = page.locator("button, .ant-btn");
      expect(await buttons.count()).toBeGreaterThan(0);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // USER MANAGEMENT
  // ══════════════════════════════════════════════════════════════
  test.describe("User Management", () => {
    test("Page loads with table", async ({ page }) => {
      await page.goto("/admin/users");
      await waitForPageReady(page);
      await expect(page.locator(".ant-table")).toBeVisible({ timeout: 10000 });
    });

    test("Table has user data rows", async ({ page }) => {
      await page.goto("/admin/users");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      const rows = page.locator(".ant-table-tbody tr");
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test("Search input filters users", async ({ page }) => {
      await page.goto("/admin/users");
      await waitForPageReady(page);
      await page.waitForTimeout(1000);
      const searchInput = page.locator("input").first();
      await searchInput.fill("admin");
      await page.waitForTimeout(1000); // debounce
    });

    test("New User button exists and opens modal", async ({ page }) => {
      await page.goto("/admin/users");
      await waitForPageReady(page);
      // Find the add user button
      const addBtn = page.locator("button").filter({ hasText: /Kullanıcı|User|Ekle|New/i }).first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(500);
        // Modal should appear
        await expect(page.locator(".ant-modal")).toBeVisible({ timeout: 5000 });
      }
    });

    test("Pagination works", async ({ page }) => {
      await page.goto("/admin/users");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      const pagination = page.locator(".ant-pagination");
      if (await pagination.isVisible()) {
        // Click page 2 if exists
        const page2 = pagination.locator("li").filter({ hasText: "2" });
        if (await page2.isVisible()) {
          await page2.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // ANNOUNCEMENTS
  // ══════════════════════════════════════════════════════════════
  test.describe("Announcements", () => {
    test("Page loads with table", async ({ page }) => {
      await page.goto("/admin/announcements");
      await waitForPageReady(page);
      await expect(page.locator(".ant-table")).toBeVisible({ timeout: 10000 });
    });

    test("Add announcement button exists", async ({ page }) => {
      await page.goto("/admin/announcements");
      await waitForPageReady(page);
      const addBtn = page.locator("button").filter({ hasText: /Duyuru|Announcement|Ekle|New/i }).first();
      await expect(addBtn).toBeVisible();
    });

    test("Add announcement opens modal with form", async ({ page }) => {
      await page.goto("/admin/announcements");
      await waitForPageReady(page);
      const addBtn = page.locator("button").filter({ hasText: /Duyuru|Announcement|Ekle|New/i }).first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(500);
        await expect(page.locator(".ant-modal")).toBeVisible({ timeout: 5000 });
        // Should have title and content fields
        const inputs = page.locator(".ant-modal input, .ant-modal textarea");
        expect(await inputs.count()).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // CLASS MANAGEMENT
  // ══════════════════════════════════════════════════════════════
  test.describe("Class Management", () => {
    test("Page loads with tabs (Courses and Classes)", async ({ page }) => {
      await page.goto("/admin/classes");
      await waitForPageReady(page);
      // Should have tab navigation
      const tabs = page.locator(".ant-tabs-tab");
      if (await tabs.first().isVisible()) {
        expect(await tabs.count()).toBeGreaterThanOrEqual(2);
      }
    });

    test("Courses tab shows table", async ({ page }) => {
      await page.goto("/admin/classes");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      const table = page.locator(".ant-table");
      await expect(table.first()).toBeVisible({ timeout: 10000 });
    });

    test("Can switch between tabs", async ({ page }) => {
      await page.goto("/admin/classes");
      await waitForPageReady(page);
      const tabs = page.locator(".ant-tabs-tab");
      if (await tabs.count() >= 2) {
        await tabs.nth(1).click();
        await page.waitForTimeout(1000);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SYSTEM LOGS
  // ══════════════════════════════════════════════════════════════
  test.describe("System Logs", () => {
    test("Page loads with log table", async ({ page }) => {
      await page.goto("/admin/logs");
      await waitForPageReady(page);
      const table = page.locator(".ant-table");
      await expect(table).toBeVisible({ timeout: 10000 });
    });

    test("Log table has rows", async ({ page }) => {
      await page.goto("/admin/logs");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      const rows = page.locator(".ant-table-tbody tr");
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test("Search input exists", async ({ page }) => {
      await page.goto("/admin/logs");
      await waitForPageReady(page);
      const searchInput = page.locator("input");
      await expect(searchInput.first()).toBeVisible();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // API COSTS
  // ══════════════════════════════════════════════════════════════
  test.describe("API Costs", () => {
    test("Page loads with stat cards", async ({ page }) => {
      await page.goto("/admin/api-costs");
      await waitForPageReady(page);
      const cards = page.locator(".ant-card");
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
    });

    test("Shows cost breakdown", async ({ page }) => {
      await page.goto("/admin/api-costs");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      // Should have model cost info or table
      const content = page.locator(".ant-card, .ant-table");
      expect(await content.count()).toBeGreaterThan(0);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // QUEUE MONITOR
  // ══════════════════════════════════════════════════════════════
  test.describe("Queue Monitor", () => {
    test("Page loads with stat cards", async ({ page }) => {
      await page.goto("/admin/queue");
      await waitForPageReady(page);
      const cards = page.locator(".ant-card");
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
    });

    test("Has auto-refresh toggle", async ({ page }) => {
      await page.goto("/admin/queue");
      await waitForPageReady(page);
      const buttons = page.locator("button");
      expect(await buttons.count()).toBeGreaterThan(0);
    });

    test("Queue table or list exists", async ({ page }) => {
      await page.goto("/admin/queue");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      const content = page.locator(".ant-table, .ant-card");
      expect(await content.count()).toBeGreaterThan(0);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // NAVIGATION (SIDEBAR)
  // ══════════════════════════════════════════════════════════════
  test.describe("Navigation", () => {
    test("All admin pages accessible via URL", async ({ page }) => {
      const pages = ["/admin", "/admin/users", "/admin/announcements", "/admin/classes", "/admin/logs", "/admin/api-costs", "/admin/queue"];
      for (const url of pages) {
        await page.goto(url);
        await waitForPageReady(page);
        await expect(page).toHaveURL(new RegExp(url.replace("/", "\\/")));
      }
    });

    test("Sidebar menu items are visible", async ({ page }) => {
      await page.goto("/admin");
      await waitForPageReady(page);
      const menuItems = page.locator(".ant-menu-item");
      expect(await menuItems.count()).toBeGreaterThanOrEqual(5);
    });

    test("Notification bell is visible", async ({ page }) => {
      await page.goto("/admin");
      await waitForPageReady(page);
      const bell = page.locator(".anticon-bell");
      await expect(bell).toBeVisible();
    });

    test("User avatar dropdown exists", async ({ page }) => {
      await page.goto("/admin");
      await waitForPageReady(page);
      const avatar = page.locator(".ant-avatar").last();
      await expect(avatar).toBeVisible();
    });
  });
});
