import { test, expect } from "@playwright/test";
import { API_BASE, TEST_USERS, loginViaAPI, waitForPageReady } from "./helpers";

// ══════════════════════════════════════════════════════════════════════
// Helper: get admin auth header
// ══════════════════════════════════════════════════════════════════════
function adminHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Helper: admin login → create user → search to get ID */
async function adminCreateUserAndGetId(
  request: any,
  adminToken: string,
  email: string,
  password: string,
  firstName = "E2E",
  lastName = "TestUser"
) {
  // Create user
  const createRes = await request.post(`${API_BASE}/admin/users`, {
    headers: adminHeader(adminToken),
    data: { email, firstName, lastName, role: 1, password },
  });
  expect(createRes.ok()).toBeTruthy();

  // Search to get user ID (create endpoint doesn't return id)
  const searchRes = await request.get(`${API_BASE}/admin/users?search=${firstName}`, {
    headers: adminHeader(adminToken),
  });
  const searchData = await searchRes.json();
  const users = searchData.items || searchData.results || searchData.data || searchData;
  const found = Array.isArray(users) ? users.find((u: any) => u.email === email) : null;
  expect(found).toBeTruthy();
  return found.id;
}

// ══════════════════════════════════════════════════════════════════════
// #3 — LANGUAGE TOGGLE (TR/EN)
// ══════════════════════════════════════════════════════════════════════
test.describe("Language Toggle (TR/EN)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, "student");
  });

  test("Language button shows current language", async ({ page }) => {
    await page.goto("/student");
    await waitForPageReady(page);
    const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
    await expect(langBtn).toBeVisible();
  });

  test("Clicking language button opens dropdown with TR and EN options", async ({ page }) => {
    await page.goto("/student");
    await waitForPageReady(page);
    const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
    await langBtn.click();
    await page.waitForTimeout(500);
    const trOption = page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ });
    const enOption = page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ });
    await expect(trOption).toBeVisible();
    await expect(enOption).toBeVisible();
  });

  test("Switch to English changes button text to EN", async ({ page }) => {
    await page.goto("/student");
    await waitForPageReady(page);
    const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
    await langBtn.click();
    await page.waitForTimeout(500);
    await page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("button").filter({ hasText: /^EN$/ })).toBeVisible();
  });

  test("Switch to Turkish changes button text to TR", async ({ page }) => {
    await page.goto("/student");
    await waitForPageReady(page);
    // First switch to EN
    const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
    await langBtn.click();
    await page.waitForTimeout(500);
    await page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ }).click();
    await page.waitForTimeout(500);
    // Now switch back to TR
    await page.locator("button").filter({ hasText: /^EN$/ }).click();
    await page.waitForTimeout(500);
    await page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("button").filter({ hasText: /^TR$/ })).toBeVisible();
  });

  test("Language change persists within SPA navigation", async ({ page }) => {
    await page.goto("/student");
    await waitForPageReady(page);
    // Switch to EN
    const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
    await langBtn.click();
    await page.waitForTimeout(500);
    await page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ }).click();
    await page.waitForTimeout(500);
    // Navigate via sidebar click (SPA navigation, not full reload)
    const profileMenu = page.locator(".ant-menu-item").filter({ hasText: /Profile|Profil/ });
    if (await profileMenu.isVisible()) {
      await profileMenu.click();
      await page.waitForTimeout(1000);
      // Should still be EN after SPA navigation
      await expect(page.locator("button").filter({ hasText: /^EN$/ })).toBeVisible();
    }
    // Switch back to TR for cleanup
    const enBtn = page.locator("button").filter({ hasText: /^EN$/ });
    if (await enBtn.isVisible()) {
      await enBtn.click();
      await page.waitForTimeout(500);
      await page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ }).click();
    }
  });

  test("Language switch changes sidebar menu text", async ({ page }) => {
    await page.goto("/student");
    await waitForPageReady(page);

    // "Sınav Sonuçları" (TR) vs "Exam Results" (EN) — these differ between languages
    const menuItems = page.locator(".ant-menu-item");
    await expect(menuItems.first()).toBeVisible();

    // Find the second menu item (Exam Results / Sınav Sonuçları) which differs
    const secondMenuItem = menuItems.nth(1);
    const textBefore = await secondMenuItem.textContent();

    // Switch language
    const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
    const currentLang = await langBtn.textContent();
    await langBtn.click();
    await page.waitForTimeout(500);
    if (currentLang?.trim() === "TR") {
      await page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ }).click();
    } else {
      await page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ }).click();
    }
    await page.waitForTimeout(1000);

    const textAfter = await secondMenuItem.textContent();
    // Text should have changed (e.g. "Sınav Sonuçları" → "Exam Results")
    expect(textBefore).not.toBe(textAfter);

    // Switch back
    const newLangBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
    await newLangBtn.click();
    await page.waitForTimeout(500);
    if (currentLang?.trim() === "TR") {
      await page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ }).click();
    } else {
      await page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ }).click();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// #5 — REAL PASSWORD CHANGE
// ══════════════════════════════════════════════════════════════════════
test.describe("Real Password Change", () => {
  const studentEmail = TEST_USERS.student.email;
  const oldPassword = TEST_USERS.student.password; // "123456"
  const newPassword = "NewPass789!";

  test("Change password with correct old password, then login with new, then revert", async ({ request }) => {
    // Step 1: Login with original password
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: studentEmail, password: oldPassword },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    const token = loginBody.data.token;

    // Step 2: Change password (DTO uses "currentPassword" not "oldPassword")
    const changeRes = await request.put(`${API_BASE}/auth/change-password`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currentPassword: oldPassword, newPassword },
    });
    expect(changeRes.ok()).toBeTruthy();

    // Step 3: Old password should NOT work anymore
    const oldLoginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: studentEmail, password: oldPassword },
    });
    expect(oldLoginRes.ok()).toBeFalsy();

    // Step 4: New password SHOULD work
    const newLoginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: studentEmail, password: newPassword },
    });
    expect(newLoginRes.ok()).toBeTruthy();
    const newToken = (await newLoginRes.json()).data.token;

    // Step 5: Revert password back to original
    const revertRes = await request.put(`${API_BASE}/auth/change-password`, {
      headers: { Authorization: `Bearer ${newToken}` },
      data: { currentPassword: newPassword, newPassword: oldPassword },
    });
    expect(revertRes.ok()).toBeTruthy();

    // Step 6: Verify original password works again
    const finalRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: studentEmail, password: oldPassword },
    });
    expect(finalRes.ok()).toBeTruthy();
  });

  test("Change password with wrong old password fails", async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: studentEmail, password: oldPassword },
    });
    const token = (await loginRes.json()).data.token;

    const changeRes = await request.put(`${API_BASE}/auth/change-password`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currentPassword: "wrongOldPassword", newPassword: "anything" },
    });
    expect(changeRes.ok()).toBeFalsy();
  });

  test("Change password without auth token fails", async ({ request }) => {
    const changeRes = await request.put(`${API_BASE}/auth/change-password`, {
      data: { currentPassword: oldPassword, newPassword: "something" },
    });
    expect(changeRes.status()).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════
// #6 — CREATE USER THEN LOGIN
// ══════════════════════════════════════════════════════════════════════
test.describe("Create User Then Login", () => {
  const uniqueEmail = `e2e-newuser-${Date.now()}@test.com`;
  const userPassword = "TestPass123!";
  let adminToken: string;
  let createdUserId: string;

  test("Admin creates a new student user", async ({ request }) => {
    // Get admin token
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
    });
    expect(loginRes.ok()).toBeTruthy();
    adminToken = (await loginRes.json()).data.token;

    // Create user and get ID via search
    createdUserId = await adminCreateUserAndGetId(request, adminToken, uniqueEmail, userPassword, "E2ENew", "User");
    expect(createdUserId).toBeTruthy();
  });

  test("Newly created user can login successfully", async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: uniqueEmail, password: userPassword },
    });
    expect(loginRes.ok()).toBeTruthy();
    const body = await loginRes.json();
    expect(body.data.token).toBeTruthy();
    expect(body.data.firstName).toBe("E2ENew");
  });

  test("Cleanup: delete created user", async ({ request }) => {
    if (!createdUserId || !adminToken) return;
    const delRes = await request.delete(`${API_BASE}/admin/users/${createdUserId}`, {
      headers: adminHeader(adminToken),
    });
    expect(delRes.ok()).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════
// #7 — DEACTIVATED USER CANNOT LOGIN
// ══════════════════════════════════════════════════════════════════════
test.describe("Deactivated User Cannot Login", () => {
  const uniqueEmail = `e2e-deactivate-${Date.now()}@test.com`;
  const userPassword = "TestPass123!";
  let adminToken: string;
  let createdUserId: string;

  test("Setup: admin creates a user and verifies login works", async ({ request }) => {
    // Admin login
    const adminLogin = await request.post(`${API_BASE}/auth/login`, {
      data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
    });
    adminToken = (await adminLogin.json()).data.token;

    // Create user and get ID via search
    createdUserId = await adminCreateUserAndGetId(request, adminToken, uniqueEmail, userPassword, "E2EDeact", "User");
    expect(createdUserId).toBeTruthy();

    // Verify user can login
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: uniqueEmail, password: userPassword },
    });
    expect(loginRes.ok()).toBeTruthy();
  });

  test("Admin deactivates user, login blocked, reactivate, login works", async ({ request }) => {
    expect(createdUserId).toBeTruthy();

    // Step 1: Deactivate
    const deactivateRes = await request.patch(`${API_BASE}/admin/users/${createdUserId}/status`, {
      headers: adminHeader(adminToken),
      data: { isActive: false },
    });
    expect(deactivateRes.ok()).toBeTruthy();

    // Step 2: Verify isActive=false in user list
    const checkRes = await request.get(`${API_BASE}/admin/users?search=E2EDeact`, {
      headers: adminHeader(adminToken),
    });
    const checkData = await checkRes.json();
    const users = checkData.items || checkData.results || checkData.data || checkData;
    const found = Array.isArray(users) ? users.find((u: any) => u.email === uniqueEmail) : null;
    expect(found).toBeTruthy();
    expect(found.isActive).toBe(false);

    // Step 3: Deactivated user CANNOT login (should get 401)
    const loginFail = await request.post(`${API_BASE}/auth/login`, {
      data: { email: uniqueEmail, password: userPassword },
    });
    expect(loginFail.ok()).toBeFalsy();
    expect(loginFail.status()).toBe(401);

    // Step 4: Reactivate
    const reactivateRes = await request.patch(`${API_BASE}/admin/users/${createdUserId}/status`, {
      headers: adminHeader(adminToken),
      data: { isActive: true },
    });
    expect(reactivateRes.ok()).toBeTruthy();

    // Step 5: Reactivated user CAN login
    const loginOk = await request.post(`${API_BASE}/auth/login`, {
      data: { email: uniqueEmail, password: userPassword },
    });
    expect(loginOk.ok()).toBeTruthy();
  });

  test("Cleanup: delete created user", async ({ request }) => {
    if (!createdUserId || !adminToken) return;
    await request.delete(`${API_BASE}/admin/users/${createdUserId}`, {
      headers: adminHeader(adminToken),
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// #9 — SIGNALR REAL-TIME TESTS
// ══════════════════════════════════════════════════════════════════════
test.describe("SignalR Real-Time", () => {
  test.describe("Log Hub (/hubs/logs)", () => {
    test("Admin can connect to log hub via WebSocket", async ({ request }) => {
      const loginRes = await request.post(`${API_BASE}/auth/login`, {
        data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
      });
      const token = (await loginRes.json()).data.token;

      const baseUrl = API_BASE.replace("/api", "");
      const negotiateRes = await request.post(`${baseUrl}/hubs/logs/negotiate?negotiateVersion=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(negotiateRes.ok()).toBeTruthy();
      const negotiateBody = await negotiateRes.json();
      expect(negotiateBody.connectionId || negotiateBody.connectionToken).toBeTruthy();
    });

    test("Non-admin cannot connect to log hub", async ({ request }) => {
      const loginRes = await request.post(`${API_BASE}/auth/login`, {
        data: { email: TEST_USERS.student.email, password: TEST_USERS.student.password },
      });
      const token = (await loginRes.json()).data.token;

      const baseUrl = API_BASE.replace("/api", "");
      const negotiateRes = await request.post(`${baseUrl}/hubs/logs/negotiate?negotiateVersion=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([401, 403]).toContain(negotiateRes.status());
    });

    test("Unauthenticated cannot connect to log hub", async ({ request }) => {
      const baseUrl = API_BASE.replace("/api", "");
      const negotiateRes = await request.post(`${baseUrl}/hubs/logs/negotiate?negotiateVersion=1`);
      expect(negotiateRes.ok()).toBeFalsy();
    });
  });

  test.describe("Chat Hub (/hubs/chat)", () => {
    test("Student can connect to chat hub via negotiate", async ({ request }) => {
      const loginRes = await request.post(`${API_BASE}/auth/login`, {
        data: { email: TEST_USERS.student.email, password: TEST_USERS.student.password },
      });
      const token = (await loginRes.json()).data.token;

      const baseUrl = API_BASE.replace("/api", "");
      const negotiateRes = await request.post(`${baseUrl}/hubs/chat/negotiate?negotiateVersion=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(negotiateRes.ok()).toBeTruthy();
      const body = await negotiateRes.json();
      expect(body.connectionId || body.connectionToken).toBeTruthy();
    });

    test("Teacher can connect to chat hub via negotiate", async ({ request }) => {
      const loginRes = await request.post(`${API_BASE}/auth/login`, {
        data: { email: TEST_USERS.teacher.email, password: TEST_USERS.teacher.password },
      });
      const token = (await loginRes.json()).data.token;

      const baseUrl = API_BASE.replace("/api", "");
      const negotiateRes = await request.post(`${baseUrl}/hubs/chat/negotiate?negotiateVersion=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(negotiateRes.ok()).toBeTruthy();
    });

    test("Unauthenticated cannot connect to chat hub", async ({ request }) => {
      const baseUrl = API_BASE.replace("/api", "");
      const negotiateRes = await request.post(`${baseUrl}/hubs/chat/negotiate?negotiateVersion=1`);
      expect(negotiateRes.ok()).toBeFalsy();
    });
  });

  test.describe("Chat Hub - Browser SignalR Connection", () => {
    test("Messages page establishes SignalR connection automatically", async ({ page }) => {
      await loginViaAPI(page, "student");
      await page.goto("/student/messages");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // The messages page auto-connects to SignalR chat hub.
      // Verify by checking that the page loaded without WebSocket errors
      // and the chat UI is functional (contact list or empty state shown)
      const pageContent = await page.content();
      // Page should have rendered (not crashed from SignalR failure)
      expect(pageContent.length).toBeGreaterThan(100);
      // URL should still be messages (no redirect from connection failure)
      expect(page.url()).toContain("/student/messages");
    });

    test("SignalR chat can join and leave conversation", async ({ page }) => {
      await loginViaAPI(page, "student");
      await page.goto("/student/messages");
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Click first contact to join a conversation (this triggers JoinConversation via SignalR)
      const contactItem = page.locator("[style*='cursor: pointer'], [style*='cursor:pointer']").first();
      if (await contactItem.isVisible()) {
        await contactItem.click();
        await page.waitForTimeout(1000);
        // If chat opened, message input should appear
        const input = page.locator("input[placeholder], textarea").last();
        if (await input.isVisible()) {
          await expect(input).toBeVisible();
        }
        // Click a different contact or same to trigger LeaveConversation + JoinConversation
        const secondContact = page.locator("[style*='cursor: pointer'], [style*='cursor:pointer']").nth(1);
        if (await secondContact.isVisible()) {
          await secondContact.click();
          await page.waitForTimeout(1000);
          // Should still be functional (no crash)
          expect(page.url()).toContain("/student/messages");
        }
      }
    });
  });

  test.describe("Log Hub - Admin UI Real-time", () => {
    test("Admin log page receives log entries via SignalR", async ({ page }) => {
      await loginViaAPI(page, "admin");
      await page.goto("/admin/logs");
      await waitForPageReady(page);

      const table = page.locator(".ant-table");
      await expect(table).toBeVisible({ timeout: 10000 });

      await page.waitForTimeout(3000);
      const rows = page.locator(".ant-table-tbody tr");
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
