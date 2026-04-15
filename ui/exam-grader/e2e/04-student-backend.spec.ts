import { test, expect } from "@playwright/test";
import { API_BASE, TEST_USERS } from "./helpers";

let studentToken: string;
let teacherToken: string;

test.describe("Student Backend API - Deep Functional Tests", () => {
  test.beforeAll(async ({ request }) => {
    const [sRes, tRes] = await Promise.all([
      request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.student }),
      request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.teacher }),
    ]);
    studentToken = (await sRes.json()).data.token;
    teacherToken = (await tRes.json()).data.token;
  });

  const auth = () => ({ Authorization: `Bearer ${studentToken}` });

  // ══════════════════════════════════════════════════════════════
  // ROLE GUARD
  // ══════════════════════════════════════════════════════════════
  test("Student cannot access admin endpoints", async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/dashboard`, { headers: auth() });
    expect(res.status()).toBe(403);
  });

  test("Student cannot access teacher endpoints", async ({ request }) => {
    const res = await request.get(`${API_BASE}/teacher/stats`, { headers: auth() });
    expect(res.status()).toBe(403);
  });

  test("Unauthenticated cannot access student endpoints", async ({ request }) => {
    const res = await request.get(`${API_BASE}/student/stats`);
    expect(res.status()).toBe(401);
  });

  // ══════════════════════════════════════════════════════════════
  // STATS / DASHBOARD
  // ══════════════════════════════════════════════════════════════
  test.describe("Stats", () => {
    test("GET /student/stats returns stats", async ({ request }) => {
      const res = await request.get(`${API_BASE}/student/stats`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data).toBeTruthy();
    });

    test("GET /student/recent-results returns list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/student/recent-results`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /student/weak-topics returns topics", async ({ request }) => {
      const res = await request.get(`${API_BASE}/student/weak-topics`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // PROFILE - Get & Update
  // ══════════════════════════════════════════════════════════════
  test.describe("Profile", () => {
    let originalProfile: any;

    test("GET /student/profile returns profile", async ({ request }) => {
      const res = await request.get(`${API_BASE}/student/profile`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      originalProfile = data.data || data;
      expect(originalProfile).toBeTruthy();
    });

    test("PUT /student/profile updates profile", async ({ request }) => {
      if (!originalProfile) return;
      const res = await request.put(`${API_BASE}/student/profile`, {
        headers: auth(),
        data: {
          firstName: originalProfile.firstName || "Celal",
          lastName: originalProfile.lastName || "Test",
          email: originalProfile.email || TEST_USERS.student.email,
        },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("Updated profile persists", async ({ request }) => {
      const res = await request.get(`${API_BASE}/student/profile`, { headers: auth() });
      const data = await res.json();
      const profile = data.data || data;
      expect(profile.firstName).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // RESULTS - Listing, Filtering, Pagination, Detail
  // ══════════════════════════════════════════════════════════════
  test.describe("Results", () => {
    test("GET /student/results returns list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/student/results`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /student/results with pagination", async ({ request }) => {
      const res = await request.get(`${API_BASE}/student/results?page=1&pageSize=5`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /student/results with search", async ({ request }) => {
      const res = await request.get(`${API_BASE}/student/results?search=test`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /student/results page 2", async ({ request }) => {
      const res = await request.get(`${API_BASE}/student/results?page=2&pageSize=5`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /student/results/:id returns detail (if results exist)", async ({ request }) => {
      const listRes = await request.get(`${API_BASE}/student/results?pageSize=1`, { headers: auth() });
      const data = await listRes.json();
      const items = data.items || data.results || data.data || data;
      if (Array.isArray(items) && items.length > 0) {
        const id = items[0].id;
        const res = await request.get(`${API_BASE}/student/results/${id}`, { headers: auth() });
        expect(res.ok()).toBeTruthy();
        const detail = await res.json();
        expect(detail).toBeTruthy();
      }
    });

    test("GET /student/results/:id with invalid id returns error", async ({ request }) => {
      const res = await request.get(`${API_BASE}/student/results/00000000-0000-0000-0000-000000000000`, { headers: auth() });
      expect(res.ok()).toBeFalsy();
    });
  });
});
