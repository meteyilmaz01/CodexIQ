import { test, expect } from "@playwright/test";
import { API_BASE, TEST_USERS, loginViaUI, loginViaAPI, waitForPageReady } from "./helpers";

// ══════════════════════════════════════════════════════════════
// AUTH BACKEND API - DEEP FUNCTIONAL TESTS
// ══════════════════════════════════════════════════════════════
test.describe("Auth Backend API Tests", () => {
  // ── Login ──
  test("Admin login returns token with correct role and name", async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.admin });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(body.data.token.split(".").length).toBe(3); // JWT format
    expect(body.data.role).toBe("Admin");
    expect(body.data.firstName).toBeTruthy();
    expect(body.data.lastName).toBeTruthy();
  });

  test("Teacher login returns token with correct role", async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.teacher });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.role).toBe("Teacher");
    expect(body.data.token.split(".").length).toBe(3);
  });

  test("Student login returns token with correct role", async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.student });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.role).toBe("Student");
  });

  test("Invalid email returns error", async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: { email: "nonexistent@test.com", password: "wrongpassword" },
    });
    expect(res.ok()).toBeFalsy();
  });

  test("Wrong password returns error", async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: { email: TEST_USERS.admin.email, password: "totallyWrongPassword999" },
    });
    expect(res.ok()).toBeFalsy();
  });

  test("Empty email returns error", async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: { email: "", password: "12345" },
    });
    expect(res.ok()).toBeFalsy();
  });

  test("Empty password returns error", async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: { email: TEST_USERS.admin.email, password: "" },
    });
    expect(res.ok()).toBeFalsy();
  });

  // ── Change Password ──
  test("Change password requires authentication (401)", async ({ request }) => {
    const res = await request.put(`${API_BASE}/auth/change-password`, {
      data: { oldPassword: "test", newPassword: "test123" },
    });
    expect(res.status()).toBe(401);
  });

  test("Change password with wrong old password fails", async ({ request }) => {
    // Login first
    const loginRes = await request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.admin });
    const token = (await loginRes.json()).data.token;

    const res = await request.put(`${API_BASE}/auth/change-password`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { oldPassword: "totallyWrongOldPassword", newPassword: "newpass123" },
    });
    expect(res.ok()).toBeFalsy();
  });

  // ── Token Validity ──
  test("Invalid token gets 401 on protected endpoint", async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: "Bearer invalid.token.here" },
    });
    expect(res.status()).toBe(401);
  });

  test("Expired/malformed token gets 401", async ({ request }) => {
    const res = await request.get(`${API_BASE}/student/stats`, {
      headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.fake" },
    });
    expect(res.status()).toBe(401);
  });

  test("No token gets 401 on protected endpoint", async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/dashboard`);
    expect(res.status()).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════
// AUTH UI - DEEP FUNCTIONAL TESTS
// ══════════════════════════════════════════════════════════════
test.describe("Auth UI Tests", () => {
  test("Login page renders all elements correctly", async ({ page }) => {
    await page.goto("/login");
    await waitForPageReady(page);
    // Branding
    await expect(page.locator("text=CodexIQ").first()).toBeVisible();
    // Form fields
    await expect(page.locator('input[id="login_email"]')).toBeVisible();
    await expect(page.locator('input[id="login_password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    // Remember me checkbox
    await expect(page.locator('input[id="login_remember"]')).toBeVisible();
  });

  test("Admin login via UI redirects to /admin", async ({ page }) => {
    await loginViaUI(page, "admin");
    await expect(page).toHaveURL(/\/admin/);
  });

  test("Teacher login via UI redirects to /teacher", async ({ page }) => {
    await loginViaUI(page, "teacher");
    await expect(page).toHaveURL(/\/teacher/);
  });

  test("Student login via UI redirects to /student", async ({ page }) => {
    await loginViaUI(page, "student");
    await expect(page).toHaveURL(/\/student/);
  });

  test("Invalid login stays on login page", async ({ page }) => {
    await page.goto("/login");
    await waitForPageReady(page);
    await page.fill('input[id="login_email"]', "wrong@email.com");
    await page.fill('input[id="login_password"]', "wrongpass");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/login");
  });

  test("Unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => { localStorage.removeItem("token"); localStorage.removeItem("user"); });
    await page.goto("/admin");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/login");
  });

  test("Token is stored in localStorage after login", async ({ page }) => {
    await loginViaUI(page, "admin");
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
    expect(token!.split(".").length).toBe(3); // JWT
  });

  test("User info is stored in localStorage after login", async ({ page }) => {
    await loginViaUI(page, "admin");
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem("user") || "null"));
    expect(user).toBeTruthy();
    expect(user.role).toBe("Admin");
    expect(user.firstName).toBeTruthy();
  });

  test("Form validation - empty email shows error", async ({ page }) => {
    await page.goto("/login");
    await waitForPageReady(page);
    await page.fill('input[id="login_password"]', "somepass");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    // Ant Design validation message should appear
    const errorText = page.locator(".ant-form-item-explain-error");
    await expect(errorText.first()).toBeVisible({ timeout: 3000 });
  });

  test("Form validation - empty password shows error", async ({ page }) => {
    await page.goto("/login");
    await waitForPageReady(page);
    await page.fill('input[id="login_email"]', "test@test.com");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    const errorText = page.locator(".ant-form-item-explain-error");
    await expect(errorText.first()).toBeVisible({ timeout: 3000 });
  });

  test("Form validation - invalid email format shows error", async ({ page }) => {
    await page.goto("/login");
    await waitForPageReady(page);
    await page.fill('input[id="login_email"]', "notanemail");
    await page.fill('input[id="login_password"]', "somepass");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    const errorText = page.locator(".ant-form-item-explain-error");
    await expect(errorText.first()).toBeVisible({ timeout: 3000 });
  });
});
