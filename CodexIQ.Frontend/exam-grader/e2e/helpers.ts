import { Page, expect } from "@playwright/test";

export const API_BASE = "http://localhost:5062/api";
export const APP_URL = "http://localhost:5173";

// Test credentials - adjust these to match your seeded database users
export const TEST_USERS = {
  admin: { email: "admin@test.com", password: "12345" },
  teacher: { email: "teacher@codexiq.com", password: "12345" },
  student: { email: "celal@example.com", password: "123456" },
};

/**
 * Login via UI and return the page (already navigated to role dashboard)
 */
export async function loginViaUI(page: Page, role: "admin" | "teacher" | "student") {
  const creds = TEST_USERS[role];
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.fill('input[id="login_email"]', creds.email);
  await page.fill('input[id="login_password"]', creds.password);
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForURL(new RegExp(`/${role}`), { timeout: 15000 });
}

/**
 * Login via API and set token in localStorage (faster for non-login tests)
 */
export async function loginViaAPI(page: Page, role: "admin" | "teacher" | "student") {
  const creds = TEST_USERS[role];

  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: creds.email, password: creds.password },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const token = body.data.token;
  const user = {
    firstName: body.data.firstName,
    lastName: body.data.lastName,
    role: body.data.role,
  };

  // Set token and user in localStorage before navigating
  await page.goto("/login");
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    { token, user }
  );

  return { token, user };
}

/**
 * Get auth token via API
 */
export async function getAuthToken(page: Page, role: "admin" | "teacher" | "student"): Promise<string> {
  const creds = TEST_USERS[role];
  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: creds.email, password: creds.password },
  });
  const body = await response.json();
  return body.data.token;
}

/**
 * Wait for page to fully load (no pending network requests)
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  // Extra wait for React rendering
  await page.waitForTimeout(1000);
}
