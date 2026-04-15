# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-advanced.spec.ts >> Deactivated User Cannot Login >> Deactivated user cannot login
- Location: e2e\09-advanced.spec.ts:298:3

# Error details

```
Error: expect(received).toBeFalsy()

Received: true
```

# Test source

```ts
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
> 302 |     expect(loginRes.ok()).toBeFalsy();
      |                           ^ Error: expect(received).toBeFalsy()
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
  330 | // #9 — SIGNALR REAL-TIME TESTS
  331 | // ══════════════════════════════════════════════════════════════════════
  332 | test.describe("SignalR Real-Time", () => {
  333 |   test.describe("Log Hub (/hubs/logs)", () => {
  334 |     test("Admin can connect to log hub via WebSocket", async ({ request }) => {
  335 |       // Get admin token
  336 |       const loginRes = await request.post(`${API_BASE}/auth/login`, {
  337 |         data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
  338 |       });
  339 |       const token = (await loginRes.json()).data.token;
  340 | 
  341 |       // Negotiate endpoint
  342 |       const baseUrl = API_BASE.replace("/api", "");
  343 |       const negotiateRes = await request.post(`${baseUrl}/hubs/logs/negotiate?negotiateVersion=1`, {
  344 |         headers: { Authorization: `Bearer ${token}` },
  345 |       });
  346 |       expect(negotiateRes.ok()).toBeTruthy();
  347 |       const negotiateBody = await negotiateRes.json();
  348 |       expect(negotiateBody.connectionId || negotiateBody.connectionToken).toBeTruthy();
  349 |     });
  350 | 
  351 |     test("Non-admin cannot connect to log hub", async ({ request }) => {
  352 |       const loginRes = await request.post(`${API_BASE}/auth/login`, {
  353 |         data: { email: TEST_USERS.student.email, password: TEST_USERS.student.password },
  354 |       });
  355 |       const token = (await loginRes.json()).data.token;
  356 | 
  357 |       const baseUrl = API_BASE.replace("/api", "");
  358 |       const negotiateRes = await request.post(`${baseUrl}/hubs/logs/negotiate?negotiateVersion=1`, {
  359 |         headers: { Authorization: `Bearer ${token}` },
  360 |       });
  361 |       // Should be forbidden or unauthorized
  362 |       expect([401, 403]).toContain(negotiateRes.status());
  363 |     });
  364 | 
  365 |     test("Unauthenticated cannot connect to log hub", async ({ request }) => {
  366 |       const baseUrl = API_BASE.replace("/api", "");
  367 |       const negotiateRes = await request.post(`${baseUrl}/hubs/logs/negotiate?negotiateVersion=1`);
  368 |       expect(negotiateRes.ok()).toBeFalsy();
  369 |     });
  370 |   });
  371 | 
  372 |   test.describe("Chat Hub (/hubs/chat)", () => {
  373 |     test("Student can connect to chat hub via negotiate", async ({ request }) => {
  374 |       const loginRes = await request.post(`${API_BASE}/auth/login`, {
  375 |         data: { email: TEST_USERS.student.email, password: TEST_USERS.student.password },
  376 |       });
  377 |       const token = (await loginRes.json()).data.token;
  378 | 
  379 |       const baseUrl = API_BASE.replace("/api", "");
  380 |       const negotiateRes = await request.post(`${baseUrl}/hubs/chat/negotiate?negotiateVersion=1`, {
  381 |         headers: { Authorization: `Bearer ${token}` },
  382 |       });
  383 |       expect(negotiateRes.ok()).toBeTruthy();
  384 |       const body = await negotiateRes.json();
  385 |       expect(body.connectionId || body.connectionToken).toBeTruthy();
  386 |     });
  387 | 
  388 |     test("Teacher can connect to chat hub via negotiate", async ({ request }) => {
  389 |       const loginRes = await request.post(`${API_BASE}/auth/login`, {
  390 |         data: { email: TEST_USERS.teacher.email, password: TEST_USERS.teacher.password },
  391 |       });
  392 |       const token = (await loginRes.json()).data.token;
  393 | 
  394 |       const baseUrl = API_BASE.replace("/api", "");
  395 |       const negotiateRes = await request.post(`${baseUrl}/hubs/chat/negotiate?negotiateVersion=1`, {
  396 |         headers: { Authorization: `Bearer ${token}` },
  397 |       });
  398 |       expect(negotiateRes.ok()).toBeTruthy();
  399 |     });
  400 | 
  401 |     test("Unauthenticated cannot connect to chat hub", async ({ request }) => {
  402 |       const baseUrl = API_BASE.replace("/api", "");
```