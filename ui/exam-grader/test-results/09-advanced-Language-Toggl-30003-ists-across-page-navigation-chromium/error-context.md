# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-advanced.spec.ts >> Language Toggle (TR/EN) >> Language change persists across page navigation
- Location: e2e\09-advanced.spec.ts:70:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: /^EN$/ })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('button').filter({ hasText: /^EN$/ })

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
        - menuitem "file-text Sınav Sonuçları" [ref=e18] [cursor=pointer]:
          - img "file-text" [ref=e19]:
            - img [ref=e20]
          - generic [ref=e22]: Sınav Sonuçları
        - menuitem "code Kod Test" [ref=e23] [cursor=pointer]:
          - img "code" [ref=e24]:
            - img [ref=e25]
          - generic [ref=e27]: Kod Test
        - menuitem "message Mesajlar" [ref=e28] [cursor=pointer]:
          - img "message" [ref=e29]:
            - img [ref=e30]
          - generic [ref=e32]: Mesajlar
        - menuitem "user Profil" [ref=e33] [cursor=pointer]:
          - img "user" [ref=e34]:
            - img [ref=e35]
          - generic [ref=e37]: Profil
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
          - button "global TR" [ref=e56] [cursor=pointer]:
            - img "global" [ref=e57]:
              - img [ref=e58]
            - generic [ref=e60]: TR
        - generic [ref=e61]:
          - img "bell" [ref=e62] [cursor=pointer]:
            - img [ref=e63]
          - superscript [ref=e65]:
            - generic [ref=e67]: "3"
        - generic [ref=e69] [cursor=pointer]: ÖĞ
    - main [ref=e70]:
      - generic [ref=e71]:
        - generic [ref=e72]:
          - heading "Profil" [level=4] [ref=e73]
          - text: Kişisel bilgilerinizi güncelleyin
        - generic [ref=e74]:
          - generic [ref=e77]:
            - generic [ref=e79]: CY
            - heading "Celal Yılmaz" [level=5] [ref=e80]
            - generic [ref=e81]: celal@example.com
            - separator [ref=e82]
          - generic [ref=e83]:
            - generic [ref=e84]:
              - generic [ref=e87]: Kişisel Bilgiler
              - generic [ref=e89]:
                - generic [ref=e90]:
                  - generic [ref=e93]:
                    - generic [ref=e96]: Ad
                    - generic [ref=e100]:
                      - img "user" [ref=e102]:
                        - img [ref=e103]
                      - textbox "Ad" [ref=e105]: Celal
                  - generic [ref=e108]:
                    - generic [ref=e111]: Soyad
                    - generic [ref=e115]:
                      - img "user" [ref=e117]:
                        - img [ref=e118]
                      - textbox "Soyad" [ref=e120]: Yılmaz
                - generic [ref=e122]:
                  - generic [ref=e125]: E-posta
                  - generic [ref=e129]:
                    - img "mail" [ref=e131]:
                      - img [ref=e132]
                    - textbox "E-posta" [ref=e134]: celal@example.com
                - button "save Kaydet" [ref=e135] [cursor=pointer]:
                  - img "save" [ref=e137]:
                    - img [ref=e138]
                  - generic [ref=e140]: Kaydet
            - generic [ref=e141]:
              - generic [ref=e144]: Şifre Değiştir
              - generic [ref=e146]:
                - generic [ref=e148]:
                  - generic [ref=e151]: Mevcut Şifre
                  - generic [ref=e155]:
                    - img "lock" [ref=e157]:
                      - img [ref=e158]
                    - textbox "Mevcut Şifre" [ref=e160]
                    - img "eye-invisible" [ref=e162] [cursor=pointer]:
                      - img [ref=e163]
                - generic [ref=e166]:
                  - generic [ref=e169]:
                    - generic [ref=e172]: Yeni Şifre
                    - generic [ref=e176]:
                      - img "lock" [ref=e178]:
                        - img [ref=e179]
                      - textbox "Yeni Şifre" [ref=e181]
                      - img "eye-invisible" [ref=e183] [cursor=pointer]:
                        - img [ref=e184]
                  - generic [ref=e189]:
                    - generic [ref=e192]: Şifre Tekrar
                    - generic [ref=e196]:
                      - img "lock" [ref=e198]:
                        - img [ref=e199]
                      - textbox "Şifre Tekrar" [ref=e201]
                      - img "eye-invisible" [ref=e203] [cursor=pointer]:
                        - img [ref=e204]
                - button "save Şifre Değiştir" [ref=e207] [cursor=pointer]:
                  - img "save" [ref=e209]:
                    - img [ref=e210]
                  - generic [ref=e212]: Şifre Değiştir
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { API_BASE, TEST_USERS, loginViaAPI, waitForPageReady } from "./helpers";
  3   | 
  4   | // ══════════════════════════════════════════════════════════════════════
  5   | // Helper: get admin auth header
  6   | // ══════════════════════════════════════════════════════════════════════
  7   | function adminHeader(token: string) {
  8   |   return { Authorization: `Bearer ${token}` };
  9   | }
  10  | 
  11  | // ══════════════════════════════════════════════════════════════════════
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
> 83  |     await expect(page.locator("button").filter({ hasText: /^EN$/ })).toBeVisible();
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
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
```