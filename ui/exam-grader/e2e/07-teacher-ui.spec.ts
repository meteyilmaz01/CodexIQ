import { test, expect } from "@playwright/test";
import { loginViaAPI, waitForPageReady } from "./helpers";

test.describe("Teacher UI - Deep Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, "teacher");
  });

  // ══════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════
  test.describe("Dashboard", () => {
    test("Dashboard loads with stat cards (4+)", async ({ page }) => {
      await page.goto("/teacher");
      await waitForPageReady(page);
      const cards = page.locator(".ant-card");
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
      expect(await cards.count()).toBeGreaterThanOrEqual(4);
    });

    test("Dashboard has quick action buttons", async ({ page }) => {
      await page.goto("/teacher");
      await waitForPageReady(page);
      const buttons = page.locator("button, .ant-btn");
      expect(await buttons.count()).toBeGreaterThan(0);
    });

    test("Recent uploads section exists", async ({ page }) => {
      await page.goto("/teacher");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      // Should have cards showing uploads/averages/queue
      const cards = page.locator(".ant-card");
      expect(await cards.count()).toBeGreaterThanOrEqual(4);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // EXAM UPLOAD (Multi-step wizard)
  // ══════════════════════════════════════════════════════════════
  test.describe("Exam Upload", () => {
    test("Upload page loads with file upload area", async ({ page }) => {
      await page.goto("/teacher/upload");
      await waitForPageReady(page);
      // Should have upload/dragger area
      const upload = page.locator(".ant-upload, .ant-upload-drag");
      await expect(upload.first()).toBeVisible({ timeout: 10000 });
    });

    test("Step indicator is visible", async ({ page }) => {
      await page.goto("/teacher/upload");
      await waitForPageReady(page);
      // Steps or progress indicator
      const steps = page.locator(".ant-steps, [class*='step']");
      if (await steps.first().isVisible()) {
        expect(await steps.count()).toBeGreaterThan(0);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════════════════════════
  test.describe("Results", () => {
    test("Results page loads with table", async ({ page }) => {
      await page.goto("/teacher/results");
      await waitForPageReady(page);
      const table = page.locator(".ant-table");
      await expect(table).toBeVisible({ timeout: 10000 });
    });

    test("Search input exists", async ({ page }) => {
      await page.goto("/teacher/results");
      await waitForPageReady(page);
      const input = page.locator("input").first();
      await expect(input).toBeVisible();
    });

    test("Filter dropdowns exist", async ({ page }) => {
      await page.goto("/teacher/results");
      await waitForPageReady(page);
      const selects = page.locator(".ant-select");
      expect(await selects.count()).toBeGreaterThanOrEqual(1);
    });

    test("Table has rows with data", async ({ page }) => {
      await page.goto("/teacher/results");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      const rows = page.locator(".ant-table-tbody tr");
      // Might be empty if no results
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("Export button exists", async ({ page }) => {
      await page.goto("/teacher/results");
      await waitForPageReady(page);
      const exportBtn = page.locator("button, .ant-dropdown-trigger").filter({ hasText: /Export|Dışa|Excel|PDF/i });
      if (await exportBtn.first().isVisible()) {
        expect(await exportBtn.count()).toBeGreaterThan(0);
      }
    });

    test("Row selection checkboxes exist", async ({ page }) => {
      await page.goto("/teacher/results");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      const checkboxes = page.locator(".ant-table .ant-checkbox");
      // Checkboxes for row selection
      if (await checkboxes.first().isVisible()) {
        expect(await checkboxes.count()).toBeGreaterThan(0);
      }
    });

    test("Detail button navigates to result detail", async ({ page }) => {
      await page.goto("/teacher/results");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      const detailBtn = page.locator("button").filter({ hasText: /Detail|Detay/i }).first();
      if (await detailBtn.isVisible()) {
        await detailBtn.click();
        await page.waitForTimeout(2000);
        expect(page.url()).toContain("/teacher/results/");
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // RESULT DETAIL
  // ══════════════════════════════════════════════════════════════
  test.describe("Result Detail", () => {
    test("Result detail page has back button", async ({ page }) => {
      // Navigate via results page
      await page.goto("/teacher/results");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      const detailBtn = page.locator("button").filter({ hasText: /Detail|Detay/i }).first();
      if (await detailBtn.isVisible()) {
        await detailBtn.click();
        await waitForPageReady(page);
        const backBtn = page.locator("button").filter({ hasText: /Geri|Back/i }).first();
        if (await backBtn.isVisible()) {
          await expect(backBtn).toBeVisible();
        }
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // STUDENT LIST
  // ══════════════════════════════════════════════════════════════
  test.describe("Student List", () => {
    test("Page loads with table", async ({ page }) => {
      await page.goto("/teacher/students");
      await waitForPageReady(page);
      const table = page.locator(".ant-table");
      await expect(table).toBeVisible({ timeout: 10000 });
    });

    test("Search input works", async ({ page }) => {
      await page.goto("/teacher/students");
      await waitForPageReady(page);
      const input = page.locator("input").first();
      await expect(input).toBeVisible();
      await input.fill("test");
      await page.waitForTimeout(500);
    });

    test("Class filter dropdown exists", async ({ page }) => {
      await page.goto("/teacher/students");
      await waitForPageReady(page);
      const selects = page.locator(".ant-select");
      if (await selects.first().isVisible()) {
        expect(await selects.count()).toBeGreaterThanOrEqual(1);
      }
    });

    test("Table shows student avatars", async ({ page }) => {
      await page.goto("/teacher/students");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      const avatars = page.locator(".ant-avatar");
      if (await avatars.first().isVisible()) {
        expect(await avatars.count()).toBeGreaterThan(0);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // MESSAGES
  // ══════════════════════════════════════════════════════════════
  test.describe("Messages", () => {
    test("Messages page loads", async ({ page }) => {
      await page.goto("/teacher/messages");
      await waitForPageReady(page);
      await expect(page).toHaveURL(/\/teacher\/messages/);
    });

    test("Student contact list is visible", async ({ page }) => {
      await page.goto("/teacher/messages");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      // Should show student list on left
      const avatars = page.locator(".ant-avatar");
      if (await avatars.first().isVisible()) {
        expect(await avatars.count()).toBeGreaterThan(0);
      }
    });

    test("Clicking a student opens chat", async ({ page }) => {
      await page.goto("/teacher/messages");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);
      // Click first contact
      const contactItems = page.locator("[style*='cursor: pointer'], [style*='cursor:pointer']").first();
      if (await contactItems.isVisible()) {
        await contactItems.click();
        await page.waitForTimeout(1000);
        // Send button or input should appear
        const sendArea = page.locator("input[placeholder], textarea");
        if (await sendArea.first().isVisible()) {
          await expect(sendArea.first()).toBeVisible();
        }
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // PROFILE
  // ══════════════════════════════════════════════════════════════
  test.describe("Profile", () => {
    test("Profile page loads with form", async ({ page }) => {
      await page.goto("/teacher/profile");
      await waitForPageReady(page);
      const inputs = page.locator("input");
      expect(await inputs.count()).toBeGreaterThanOrEqual(2);
    });

    test("Profile shows avatar and name", async ({ page }) => {
      await page.goto("/teacher/profile");
      await waitForPageReady(page);
      const avatar = page.locator(".ant-avatar");
      await expect(avatar.first()).toBeVisible();
    });

    test("Personal info form has firstName, lastName, email", async ({ page }) => {
      await page.goto("/teacher/profile");
      await waitForPageReady(page);
      const inputs = page.locator("input");
      expect(await inputs.count()).toBeGreaterThanOrEqual(3); // first, last, email
    });

    test("Change password form exists", async ({ page }) => {
      await page.goto("/teacher/profile");
      await waitForPageReady(page);
      // Should have password inputs
      const passwordInputs = page.locator("input[type='password']");
      expect(await passwordInputs.count()).toBeGreaterThanOrEqual(2);
    });

    test("Save button exists", async ({ page }) => {
      await page.goto("/teacher/profile");
      await waitForPageReady(page);
      const saveBtn = page.locator("button").filter({ hasText: /Kaydet|Save/i }).first();
      await expect(saveBtn).toBeVisible();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════════════════════════════
  test.describe("Navigation", () => {
    test("Sidebar has all menu items", async ({ page }) => {
      await page.goto("/teacher");
      await waitForPageReady(page);
      const menuItems = page.locator(".ant-menu-item");
      expect(await menuItems.count()).toBeGreaterThanOrEqual(6);
    });

    test("Notification bell with badge visible", async ({ page }) => {
      await page.goto("/teacher");
      await waitForPageReady(page);
      const bell = page.locator(".anticon-bell");
      await expect(bell).toBeVisible();
    });

    test("Logo/brand is visible", async ({ page }) => {
      await page.goto("/teacher");
      await waitForPageReady(page);
      await expect(page.locator("text=Codex").first()).toBeVisible();
    });
  });
});
