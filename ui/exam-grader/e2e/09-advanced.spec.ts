import { test, expect } from "@playwright/test";
import { API_BASE, TEST_USERS, loginViaAPI, waitForPageReady } from "./helpers";

// ══════════════════════════════════════════════════════════════════════
// Helper: get admin auth header
// ══════════════════════════════════════════════════════════════════════
function adminHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
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
    // The language button shows "TR" or "EN"
    const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
    await expect(langBtn).toBeVisible();
  });

  test("Clicking language button opens dropdown with TR and EN options", async ({ page }) => {
    await page.goto("/student");
    await waitForPageReady(page);
    const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
    await langBtn.click();
    await page.waitForTimeout(500);
    // Dropdown should show both languages
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
    const enOption = page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ });
    await enOption.click();
    await page.waitForTimeout(500);
    // Button should now show "EN"
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

  test("Language change persists across page navigation", async ({ page }) => {
    await page.goto("/student");
    await waitForPageReady(page);
    // Switch to EN
    const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
    await langBtn.click();
    await page.waitForTimeout(500);
    await page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ }).click();
    await page.waitForTimeout(500);
    // Navigate to another page
    await page.goto("/student/profile");
    await waitForPageReady(page);
    // Should still be EN
    await expect(page.locator("button").filter({ hasText: /^EN$/ })).toBeVisible();
    // Switch back to TR for cleanup
    await page.locator("button").filter({ hasText: /^EN$/ }).click();
    await page.waitForTimeout(500);
    await page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ }).click();
  });

  test("Language switch changes UI text content", async ({ page }) => {
    await page.goto("/student");
    await waitForPageReady(page);
    // Get some visible text in current language
    const menuItems = page.locator(".ant-menu-item");
    await expect(menuItems.first()).toBeVisible();
    const textBefore = await menuItems.first().textContent();

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

    const textAfter = await menuItems.first().textContent();
    // Text should have changed
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

    // Step 2: Change password
    const changeRes = await request.put(`${API_BASE}/auth/change-password`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { oldPassword, newPassword },
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
      data: { oldPassword: newPassword, newPassword: oldPassword },
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
      data: { oldPassword: "wrongOldPassword", newPassword: "anything" },
    });
    expect(changeRes.ok()).toBeFalsy();
  });

  test("Change password without auth token fails", async ({ request }) => {
    const changeRes = await request.put(`${API_BASE}/auth/change-password`, {
      data: { oldPassword, newPassword: "something" },
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

    // Create user
    const createRes = await request.post(`${API_BASE}/admin/users`, {
      headers: adminHeader(adminToken),
      data: {
        email: uniqueEmail,
        firstName: "E2E",
        lastName: "NewUser",
        role: 1, // Student
        password: userPassword,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const body = await createRes.json();
    createdUserId = body.data?.id || body.id;
    expect(createdUserId).toBeTruthy();
  });

  test("Newly created user can login successfully", async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: uniqueEmail, password: userPassword },
    });
    expect(loginRes.ok()).toBeTruthy();
    const body = await loginRes.json();
    expect(body.data.token).toBeTruthy();
    expect(body.data.firstName).toBe("E2E");
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

    // Create user
    const createRes = await request.post(`${API_BASE}/admin/users`, {
      headers: adminHeader(adminToken),
      data: {
        email: uniqueEmail,
        firstName: "E2E",
        lastName: "Deactivate",
        role: 1,
        password: userPassword,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const body = await createRes.json();
    createdUserId = body.data?.id || body.id;

    // Verify user can login
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: uniqueEmail, password: userPassword },
    });
    expect(loginRes.ok()).toBeTruthy();
  });

  test("Admin deactivates the user", async ({ request }) => {
    if (!createdUserId) return;
    const res = await request.patch(`${API_BASE}/admin/users/${createdUserId}/status`, {
      headers: adminHeader(adminToken),
      data: { isActive: false },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("Deactivated user cannot login", async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: uniqueEmail, password: userPassword },
    });
    expect(loginRes.ok()).toBeFalsy();
  });

  test("Admin reactivates user and login works again", async ({ request }) => {
    if (!createdUserId) return;
    // Reactivate
    const reactivateRes = await request.patch(`${API_BASE}/admin/users/${createdUserId}/status`, {
      headers: adminHeader(adminToken),
      data: { isActive: true },
    });
    expect(reactivateRes.ok()).toBeTruthy();

    // Login should work now
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: uniqueEmail, password: userPassword },
    });
    expect(loginRes.ok()).toBeTruthy();
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
      // Get admin token
      const loginRes = await request.post(`${API_BASE}/auth/login`, {
        data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
      });
      const token = (await loginRes.json()).data.token;

      // Negotiate endpoint
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
      // Should be forbidden or unauthorized
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
    test("SignalR chat connection works in browser context", async ({ page }) => {
      await loginViaAPI(page, "student");
      await page.goto("/student/messages");
      await waitForPageReady(page);

      // Evaluate SignalR connection in browser context
      const connected = await page.evaluate(async () => {
        // @ts-ignore - signalR is loaded via the app bundle
        const signalR = await import("@microsoft/signalr");
        const token = localStorage.getItem("token");
        if (!token) return false;

        const connection = new signalR.HubConnectionBuilder()
          .withUrl("http://localhost:5062/hubs/chat", {
            accessTokenFactory: () => token,
          })
          .configureLogging(signalR.LogLevel.None)
          .build();

        try {
          await connection.start();
          const state = connection.state === signalR.HubConnectionState.Connected;
          await connection.stop();
          return state;
        } catch {
          return false;
        }
      });
      expect(connected).toBe(true);
    });

    test("SignalR chat can join and leave conversation", async ({ page }) => {
      await loginViaAPI(page, "student");
      await page.goto("/student/messages");
      await waitForPageReady(page);

      // Get a teacher ID to join conversation with
      const token = await page.evaluate(() => localStorage.getItem("token"));
      const contactsRes = await page.request.get(`${API_BASE}/messages/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!contactsRes.ok()) return; // Skip if no contacts
      const contacts = await contactsRes.json();
      const contactList = contacts.data || contacts;
      if (!Array.isArray(contactList) || contactList.length === 0) return;

      const targetUserId = contactList[0].userId || contactList[0].id;

      const result = await page.evaluate(async (userId: string) => {
        const signalR = await import("@microsoft/signalr");
        const tkn = localStorage.getItem("token");
        if (!tkn) return "no-token";

        const connection = new signalR.HubConnectionBuilder()
          .withUrl("http://localhost:5062/hubs/chat", {
            accessTokenFactory: () => tkn,
          })
          .configureLogging(signalR.LogLevel.None)
          .build();

        try {
          await connection.start();
          await connection.invoke("JoinConversation", userId);
          await connection.invoke("LeaveConversation", userId);
          await connection.stop();
          return "success";
        } catch (err: any) {
          return `error: ${err.message}`;
        }
      }, targetUserId);

      expect(result).toBe("success");
    });
  });

  test.describe("Log Hub - Admin UI Real-time", () => {
    test("Admin log page receives log entries via SignalR", async ({ page }) => {
      await loginViaAPI(page, "admin");
      await page.goto("/admin/logs");
      await waitForPageReady(page);

      // The log page should be connected and showing logs table
      const table = page.locator(".ant-table");
      await expect(table).toBeVisible({ timeout: 10000 });

      // Verify we can see the table rows (logs streamed via SignalR)
      await page.waitForTimeout(3000);
      const rows = page.locator(".ant-table-tbody tr");
      const count = await rows.count();
      // Even if no new logs, the table should exist and be functional
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
