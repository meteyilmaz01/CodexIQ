# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-advanced.spec.ts >> Create User Then Login >> Admin creates a new student user
- Location: e2e\09-advanced.spec.ts:207:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: undefined
```

# Test source

```ts
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
> 229 |     expect(createdUserId).toBeTruthy();
      |                           ^ Error: expect(received).toBeTruthy()
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
  249 | });
  250 | 
  251 | // ══════════════════════════════════════════════════════════════════════
  252 | // #7 — DEACTIVATED USER CANNOT LOGIN
  253 | // ══════════════════════════════════════════════════════════════════════
  254 | test.describe("Deactivated User Cannot Login", () => {
  255 |   const uniqueEmail = `e2e-deactivate-${Date.now()}@test.com`;
  256 |   const userPassword = "TestPass123!";
  257 |   let adminToken: string;
  258 |   let createdUserId: string;
  259 | 
  260 |   test("Setup: admin creates a user and verifies login works", async ({ request }) => {
  261 |     // Admin login
  262 |     const adminLogin = await request.post(`${API_BASE}/auth/login`, {
  263 |       data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
  264 |     });
  265 |     adminToken = (await adminLogin.json()).data.token;
  266 | 
  267 |     // Create user
  268 |     const createRes = await request.post(`${API_BASE}/admin/users`, {
  269 |       headers: adminHeader(adminToken),
  270 |       data: {
  271 |         email: uniqueEmail,
  272 |         firstName: "E2E",
  273 |         lastName: "Deactivate",
  274 |         role: 1,
  275 |         password: userPassword,
  276 |       },
  277 |     });
  278 |     expect(createRes.ok()).toBeTruthy();
  279 |     const body = await createRes.json();
  280 |     createdUserId = body.data?.id || body.id;
  281 | 
  282 |     // Verify user can login
  283 |     const loginRes = await request.post(`${API_BASE}/auth/login`, {
  284 |       data: { email: uniqueEmail, password: userPassword },
  285 |     });
  286 |     expect(loginRes.ok()).toBeTruthy();
  287 |   });
  288 | 
  289 |   test("Admin deactivates the user", async ({ request }) => {
  290 |     if (!createdUserId) return;
  291 |     const res = await request.patch(`${API_BASE}/admin/users/${createdUserId}/status`, {
  292 |       headers: adminHeader(adminToken),
  293 |       data: { isActive: false },
  294 |     });
  295 |     expect(res.ok()).toBeTruthy();
  296 |   });
  297 | 
  298 |   test("Deactivated user cannot login", async ({ request }) => {
  299 |     const loginRes = await request.post(`${API_BASE}/auth/login`, {
  300 |       data: { email: uniqueEmail, password: userPassword },
  301 |     });
  302 |     expect(loginRes.ok()).toBeFalsy();
  303 |   });
  304 | 
  305 |   test("Admin reactivates user and login works again", async ({ request }) => {
  306 |     if (!createdUserId) return;
  307 |     // Reactivate
  308 |     const reactivateRes = await request.patch(`${API_BASE}/admin/users/${createdUserId}/status`, {
  309 |       headers: adminHeader(adminToken),
  310 |       data: { isActive: true },
  311 |     });
  312 |     expect(reactivateRes.ok()).toBeTruthy();
  313 | 
  314 |     // Login should work now
  315 |     const loginRes = await request.post(`${API_BASE}/auth/login`, {
  316 |       data: { email: uniqueEmail, password: userPassword },
  317 |     });
  318 |     expect(loginRes.ok()).toBeTruthy();
  319 |   });
  320 | 
  321 |   test("Cleanup: delete created user", async ({ request }) => {
  322 |     if (!createdUserId || !adminToken) return;
  323 |     await request.delete(`${API_BASE}/admin/users/${createdUserId}`, {
  324 |       headers: adminHeader(adminToken),
  325 |     });
  326 |   });
  327 | });
  328 | 
  329 | // ══════════════════════════════════════════════════════════════════════
```