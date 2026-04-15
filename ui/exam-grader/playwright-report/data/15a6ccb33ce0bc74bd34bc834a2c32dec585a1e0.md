# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-advanced.spec.ts >> Real Password Change >> Change password with correct old password, then login with new, then revert
- Location: e2e\09-advanced.spec.ts:134:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  48  |     await page.waitForTimeout(500);
  49  |     // Button should now show "EN"
  50  |     await expect(page.locator("button").filter({ hasText: /^EN$/ })).toBeVisible();
  51  |   });
  52  | 
  53  |   test("Switch to Turkish changes button text to TR", async ({ page }) => {
  54  |     await page.goto("/student");
  55  |     await waitForPageReady(page);
  56  |     // First switch to EN
  57  |     const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
  58  |     await langBtn.click();
  59  |     await page.waitForTimeout(500);
  60  |     await page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ }).click();
  61  |     await page.waitForTimeout(500);
  62  |     // Now switch back to TR
  63  |     await page.locator("button").filter({ hasText: /^EN$/ }).click();
  64  |     await page.waitForTimeout(500);
  65  |     await page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ }).click();
  66  |     await page.waitForTimeout(500);
  67  |     await expect(page.locator("button").filter({ hasText: /^TR$/ })).toBeVisible();
  68  |   });
  69  | 
  70  |   test("Language change persists across page navigation", async ({ page }) => {
  71  |     await page.goto("/student");
  72  |     await waitForPageReady(page);
  73  |     // Switch to EN
  74  |     const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
  75  |     await langBtn.click();
  76  |     await page.waitForTimeout(500);
  77  |     await page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ }).click();
  78  |     await page.waitForTimeout(500);
  79  |     // Navigate to another page
  80  |     await page.goto("/student/profile");
  81  |     await waitForPageReady(page);
  82  |     // Should still be EN
  83  |     await expect(page.locator("button").filter({ hasText: /^EN$/ })).toBeVisible();
  84  |     // Switch back to TR for cleanup
  85  |     await page.locator("button").filter({ hasText: /^EN$/ }).click();
  86  |     await page.waitForTimeout(500);
  87  |     await page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ }).click();
  88  |   });
  89  | 
  90  |   test("Language switch changes UI text content", async ({ page }) => {
  91  |     await page.goto("/student");
  92  |     await waitForPageReady(page);
  93  |     // Get some visible text in current language
  94  |     const menuItems = page.locator(".ant-menu-item");
  95  |     await expect(menuItems.first()).toBeVisible();
  96  |     const textBefore = await menuItems.first().textContent();
  97  | 
  98  |     // Switch language
  99  |     const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
  100 |     const currentLang = await langBtn.textContent();
  101 |     await langBtn.click();
  102 |     await page.waitForTimeout(500);
  103 |     if (currentLang?.trim() === "TR") {
  104 |       await page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ }).click();
  105 |     } else {
  106 |       await page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ }).click();
  107 |     }
  108 |     await page.waitForTimeout(1000);
  109 | 
  110 |     const textAfter = await menuItems.first().textContent();
  111 |     // Text should have changed
  112 |     expect(textBefore).not.toBe(textAfter);
  113 | 
  114 |     // Switch back
  115 |     const newLangBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
  116 |     await newLangBtn.click();
  117 |     await page.waitForTimeout(500);
  118 |     if (currentLang?.trim() === "TR") {
  119 |       await page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ }).click();
  120 |     } else {
  121 |       await page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ }).click();
  122 |     }
  123 |   });
  124 | });
  125 | 
  126 | // ══════════════════════════════════════════════════════════════════════
  127 | // #5 — REAL PASSWORD CHANGE
  128 | // ══════════════════════════════════════════════════════════════════════
  129 | test.describe("Real Password Change", () => {
  130 |   const studentEmail = TEST_USERS.student.email;
  131 |   const oldPassword = TEST_USERS.student.password; // "123456"
  132 |   const newPassword = "NewPass789!";
  133 | 
  134 |   test("Change password with correct old password, then login with new, then revert", async ({ request }) => {
  135 |     // Step 1: Login with original password
  136 |     const loginRes = await request.post(`${API_BASE}/auth/login`, {
  137 |       data: { email: studentEmail, password: oldPassword },
  138 |     });
  139 |     expect(loginRes.ok()).toBeTruthy();
  140 |     const loginBody = await loginRes.json();
  141 |     const token = loginBody.data.token;
  142 | 
  143 |     // Step 2: Change password
  144 |     const changeRes = await request.put(`${API_BASE}/auth/change-password`, {
  145 |       headers: { Authorization: `Bearer ${token}` },
  146 |       data: { oldPassword, newPassword },
  147 |     });
> 148 |     expect(changeRes.ok()).toBeTruthy();
      |                            ^ Error: expect(received).toBeTruthy()
  149 | 
  150 |     // Step 3: Old password should NOT work anymore
  151 |     const oldLoginRes = await request.post(`${API_BASE}/auth/login`, {
  152 |       data: { email: studentEmail, password: oldPassword },
  153 |     });
  154 |     expect(oldLoginRes.ok()).toBeFalsy();
  155 | 
  156 |     // Step 4: New password SHOULD work
  157 |     const newLoginRes = await request.post(`${API_BASE}/auth/login`, {
  158 |       data: { email: studentEmail, password: newPassword },
  159 |     });
  160 |     expect(newLoginRes.ok()).toBeTruthy();
  161 |     const newToken = (await newLoginRes.json()).data.token;
  162 | 
  163 |     // Step 5: Revert password back to original
  164 |     const revertRes = await request.put(`${API_BASE}/auth/change-password`, {
  165 |       headers: { Authorization: `Bearer ${newToken}` },
  166 |       data: { oldPassword: newPassword, newPassword: oldPassword },
  167 |     });
  168 |     expect(revertRes.ok()).toBeTruthy();
  169 | 
  170 |     // Step 6: Verify original password works again
  171 |     const finalRes = await request.post(`${API_BASE}/auth/login`, {
  172 |       data: { email: studentEmail, password: oldPassword },
  173 |     });
  174 |     expect(finalRes.ok()).toBeTruthy();
  175 |   });
  176 | 
  177 |   test("Change password with wrong old password fails", async ({ request }) => {
  178 |     const loginRes = await request.post(`${API_BASE}/auth/login`, {
  179 |       data: { email: studentEmail, password: oldPassword },
  180 |     });
  181 |     const token = (await loginRes.json()).data.token;
  182 | 
  183 |     const changeRes = await request.put(`${API_BASE}/auth/change-password`, {
  184 |       headers: { Authorization: `Bearer ${token}` },
  185 |       data: { oldPassword: "wrongOldPassword", newPassword: "anything" },
  186 |     });
  187 |     expect(changeRes.ok()).toBeFalsy();
  188 |   });
  189 | 
  190 |   test("Change password without auth token fails", async ({ request }) => {
  191 |     const changeRes = await request.put(`${API_BASE}/auth/change-password`, {
  192 |       data: { oldPassword, newPassword: "something" },
  193 |     });
  194 |     expect(changeRes.status()).toBe(401);
  195 |   });
  196 | });
  197 | 
  198 | // ══════════════════════════════════════════════════════════════════════
  199 | // #6 — CREATE USER THEN LOGIN
  200 | // ══════════════════════════════════════════════════════════════════════
  201 | test.describe("Create User Then Login", () => {
  202 |   const uniqueEmail = `e2e-newuser-${Date.now()}@test.com`;
  203 |   const userPassword = "TestPass123!";
  204 |   let adminToken: string;
  205 |   let createdUserId: string;
  206 | 
  207 |   test("Admin creates a new student user", async ({ request }) => {
  208 |     // Get admin token
  209 |     const loginRes = await request.post(`${API_BASE}/auth/login`, {
  210 |       data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
  211 |     });
  212 |     expect(loginRes.ok()).toBeTruthy();
  213 |     adminToken = (await loginRes.json()).data.token;
  214 | 
  215 |     // Create user
  216 |     const createRes = await request.post(`${API_BASE}/admin/users`, {
  217 |       headers: adminHeader(adminToken),
  218 |       data: {
  219 |         email: uniqueEmail,
  220 |         firstName: "E2E",
  221 |         lastName: "NewUser",
  222 |         role: 1, // Student
  223 |         password: userPassword,
  224 |       },
  225 |     });
  226 |     expect(createRes.ok()).toBeTruthy();
  227 |     const body = await createRes.json();
  228 |     createdUserId = body.data?.id || body.id;
  229 |     expect(createdUserId).toBeTruthy();
  230 |   });
  231 | 
  232 |   test("Newly created user can login successfully", async ({ request }) => {
  233 |     const loginRes = await request.post(`${API_BASE}/auth/login`, {
  234 |       data: { email: uniqueEmail, password: userPassword },
  235 |     });
  236 |     expect(loginRes.ok()).toBeTruthy();
  237 |     const body = await loginRes.json();
  238 |     expect(body.data.token).toBeTruthy();
  239 |     expect(body.data.firstName).toBe("E2E");
  240 |   });
  241 | 
  242 |   test("Cleanup: delete created user", async ({ request }) => {
  243 |     if (!createdUserId || !adminToken) return;
  244 |     const delRes = await request.delete(`${API_BASE}/admin/users/${createdUserId}`, {
  245 |       headers: adminHeader(adminToken),
  246 |     });
  247 |     expect(delRes.ok()).toBeTruthy();
  248 |   });
```