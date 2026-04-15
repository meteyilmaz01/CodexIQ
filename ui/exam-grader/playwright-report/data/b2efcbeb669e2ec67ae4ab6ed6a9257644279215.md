# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-advanced.spec.ts >> Language Toggle (TR/EN) >> Language switch changes UI text content
- Location: e2e\09-advanced.spec.ts:90:3

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "Dashboard"
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - img "code" [ref=e8]:
          - img [ref=e9]
        - generic [ref=e11]: CodexIQ
      - menu [ref=e12]:
        - menuitem "dashboard Dashboard" [ref=e13] [cursor=pointer]:
          - img "dashboard" [ref=e14]:
            - img [ref=e15]
          - generic [ref=e17]: Dashboard
        - menuitem "file-text Exam Results" [ref=e18] [cursor=pointer]:
          - img "file-text" [ref=e19]:
            - img [ref=e20]
          - generic [ref=e22]: Exam Results
        - menuitem "code Code Test" [ref=e23] [cursor=pointer]:
          - img "code" [ref=e24]:
            - img [ref=e25]
          - generic [ref=e27]: Code Test
        - menuitem "message Messages" [ref=e28] [cursor=pointer]:
          - img "message" [ref=e29]:
            - img [ref=e30]
          - generic [ref=e32]: Messages
        - menuitem "user Profile" [ref=e33] [cursor=pointer]:
          - img "user" [ref=e34]:
            - img [ref=e35]
          - generic [ref=e37]: Profile
      - generic [ref=e38]:
        - generic [ref=e40]: ÖĞ
        - generic [ref=e41]:
          - generic [ref=e42]: Öğrenci Adı
          - text: Bilgisayar Müh.
  - generic [ref=e43]:
    - banner [ref=e44]:
      - img "menu-fold" [ref=e46] [cursor=pointer]:
        - img [ref=e47]
      - generic [ref=e49]:
        - generic [ref=e50]:
          - button "sun" [ref=e51] [cursor=pointer]:
            - img "sun" [ref=e53]:
              - img [ref=e54]
          - button "global EN" [ref=e56] [cursor=pointer]:
            - img "global" [ref=e57]:
              - img [ref=e58]
            - generic [ref=e60]: EN
        - generic [ref=e61]:
          - img "bell" [ref=e62] [cursor=pointer]:
            - img [ref=e63]
          - superscript [ref=e65]:
            - generic [ref=e67]: "3"
        - generic [ref=e69] [cursor=pointer]: ÖĞ
    - main [ref=e70]:
      - generic [ref=e71]:
        - generic [ref=e72]:
          - heading "Dashboard" [level=4] [ref=e73]
          - generic [ref=e74]: Welcome, Celal Yılmaz
        - generic [ref=e75]:
          - generic [ref=e79]:
            - generic [ref=e80]:
              - generic [ref=e81]: Exam Average
              - generic [ref=e82]:
                - generic [ref=e83]: "-"
                - generic [ref=e84]: / 100
            - img "trophy" [ref=e86]:
              - img [ref=e87]
          - generic [ref=e92]:
            - generic [ref=e93]:
              - generic [ref=e94]: Last Exam
              - generic [ref=e95]:
                - generic [ref=e96]: "-"
                - generic [ref=e97]: / 100
            - img "rise" [ref=e99]:
              - img [ref=e100]
          - generic [ref=e105]:
            - generic [ref=e106]:
              - generic [ref=e107]: Total Exams
              - generic [ref=e108]:
                - generic [ref=e109]: "0"
                - generic [ref=e110]: exams
            - img "code" [ref=e112]:
              - img [ref=e113]
          - generic [ref=e118]:
            - generic [ref=e119]:
              - generic [ref=e120]: Code Tests
              - generic [ref=e121]:
                - generic [ref=e122]: "0"
                - generic [ref=e123]: tests
            - img "clock-circle" [ref=e125]:
              - img [ref=e126]
        - generic [ref=e129]:
          - generic [ref=e131]:
            - generic [ref=e134]: Recent Exam Results
            - generic [ref=e139]: No data
          - generic [ref=e141]:
            - generic [ref=e144]: Topics to Improve
            - generic [ref=e145]: No data
```

# Test source

```ts
  12  | // #3 — LANGUAGE TOGGLE (TR/EN)
  13  | // ══════════════════════════════════════════════════════════════════════
  14  | test.describe("Language Toggle (TR/EN)", () => {
  15  |   test.beforeEach(async ({ page }) => {
  16  |     await loginViaAPI(page, "student");
  17  |   });
  18  | 
  19  |   test("Language button shows current language", async ({ page }) => {
  20  |     await page.goto("/student");
  21  |     await waitForPageReady(page);
  22  |     // The language button shows "TR" or "EN"
  23  |     const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
  24  |     await expect(langBtn).toBeVisible();
  25  |   });
  26  | 
  27  |   test("Clicking language button opens dropdown with TR and EN options", async ({ page }) => {
  28  |     await page.goto("/student");
  29  |     await waitForPageReady(page);
  30  |     const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
  31  |     await langBtn.click();
  32  |     await page.waitForTimeout(500);
  33  |     // Dropdown should show both languages
  34  |     const trOption = page.locator(".ant-dropdown-menu-item").filter({ hasText: /Türkçe/ });
  35  |     const enOption = page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ });
  36  |     await expect(trOption).toBeVisible();
  37  |     await expect(enOption).toBeVisible();
  38  |   });
  39  | 
  40  |   test("Switch to English changes button text to EN", async ({ page }) => {
  41  |     await page.goto("/student");
  42  |     await waitForPageReady(page);
  43  |     const langBtn = page.locator("button").filter({ hasText: /^(TR|EN)$/ });
  44  |     await langBtn.click();
  45  |     await page.waitForTimeout(500);
  46  |     const enOption = page.locator(".ant-dropdown-menu-item").filter({ hasText: /English/ });
  47  |     await enOption.click();
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
> 112 |     expect(textBefore).not.toBe(textAfter);
      |                            ^ Error: expect(received).not.toBe(expected) // Object.is equality
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
  148 |     expect(changeRes.ok()).toBeTruthy();
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
```