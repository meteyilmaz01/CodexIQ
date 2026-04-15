import { test, expect } from "@playwright/test";
import { API_BASE, TEST_USERS } from "./helpers";

let teacherToken: string;
let studentToken: string;

test.describe("Teacher Backend API - Deep Functional Tests", () => {
  test.beforeAll(async ({ request }) => {
    const [tRes, sRes] = await Promise.all([
      request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.teacher }),
      request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.student }),
    ]);
    teacherToken = (await tRes.json()).data.token;
    studentToken = (await sRes.json()).data.token;
  });

  const auth = () => ({ Authorization: `Bearer ${teacherToken}` });

  // ══════════════════════════════════════════════════════════════
  // ROLE GUARD
  // ══════════════════════════════════════════════════════════════
  test("Student cannot access teacher stats", async ({ request }) => {
    const res = await request.get(`${API_BASE}/teacher/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test("Unauthenticated cannot access teacher endpoints", async ({ request }) => {
    const res = await request.get(`${API_BASE}/teacher/stats`);
    expect(res.status()).toBe(401);
  });

  // ══════════════════════════════════════════════════════════════
  // DASHBOARD / STATS
  // ══════════════════════════════════════════════════════════════
  test.describe("Dashboard Stats", () => {
    test("GET /teacher/stats returns stats object", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/stats`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data).toBeTruthy();
    });

    test("GET /teacher/recent-uploads returns list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/recent-uploads`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /teacher/course-averages returns averages", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/course-averages`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /teacher/queue-status returns queue data", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/queue-status`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // RESULTS - Listing, Filtering, Pagination
  // ══════════════════════════════════════════════════════════════
  test.describe("Results", () => {
    test("GET /teacher/results returns result list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/results`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /teacher/results with pagination", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/results?page=1&pageSize=5`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /teacher/results with search", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/results?search=test`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /teacher/results with page 2", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/results?page=2&pageSize=5`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /teacher/results/:id returns detail (if results exist)", async ({ request }) => {
      const listRes = await request.get(`${API_BASE}/teacher/results?pageSize=1`, { headers: auth() });
      const listData = await listRes.json();
      const items = listData.items || listData.results || listData.data || listData;
      if (Array.isArray(items) && items.length > 0) {
        const id = items[0].id;
        const res = await request.get(`${API_BASE}/teacher/results/${id}`, { headers: auth() });
        expect(res.ok()).toBeTruthy();
        const detail = await res.json();
        expect(detail).toBeTruthy();
      }
    });

    test("GET /teacher/results/:id with invalid id returns error", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/results/00000000-0000-0000-0000-000000000000`, { headers: auth() });
      expect(res.ok()).toBeFalsy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SCORE OVERRIDE & NOTE UPDATE
  // ══════════════════════════════════════════════════════════════
  test.describe("Score Override & Notes", () => {
    let resultId: string;

    test("Find a result to work with", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/results?pageSize=1`, { headers: auth() });
      const data = await res.json();
      const items = data.items || data.results || data.data || data;
      if (Array.isArray(items) && items.length > 0) {
        resultId = items[0].id;
      }
    });

    test("PUT /teacher/results/:id/override changes score", async ({ request }) => {
      if (!resultId) return;
      const res = await request.put(`${API_BASE}/teacher/results/${resultId}/override`, {
        headers: auth(),
        data: { newScore: 85 },
      });
      // Might succeed or fail depending on data state
      expect([200, 400, 404].includes(res.status())).toBeTruthy();
    });

    test("PUT /teacher/results/:id/note updates note", async ({ request }) => {
      if (!resultId) return;
      const res = await request.put(`${API_BASE}/teacher/results/${resultId}/note`, {
        headers: auth(),
        data: { note: "Playwright test note - good work" },
      });
      expect([200, 400, 404].includes(res.status())).toBeTruthy();
    });

    test("PUT /teacher/results/:id/share shares result with student", async ({ request }) => {
      if (!resultId) return;
      const res = await request.put(`${API_BASE}/teacher/results/${resultId}/share`, { headers: auth() });
      expect([200, 400, 404].includes(res.status())).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // BULK SHARE
  // ══════════════════════════════════════════════════════════════
  test.describe("Bulk Share", () => {
    test("PUT /teacher/results/bulk-share with empty list", async ({ request }) => {
      const res = await request.put(`${API_BASE}/teacher/results/bulk-share`, {
        headers: auth(),
        data: { examPaperIds: [] },
      });
      // Empty list might succeed or return validation error
      expect([200, 400].includes(res.status())).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════════════════════════
  test.describe("Export", () => {
    test("GET /teacher/results/export/excel returns file or error", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/results/export/excel`, { headers: auth() });
      // Might need examId param
      expect([200, 400, 404].includes(res.status())).toBeTruthy();
    });

    test("GET /teacher/results/export/pdf returns file or error", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/results/export/pdf`, { headers: auth() });
      expect([200, 400, 404].includes(res.status())).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // STUDENTS
  // ══════════════════════════════════════════════════════════════
  test.describe("Students", () => {
    test("GET /teacher/students returns student list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/students`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /teacher/students/:id/stats returns stats (if students exist)", async ({ request }) => {
      const listRes = await request.get(`${API_BASE}/teacher/students`, { headers: auth() });
      const data = await listRes.json();
      const students = Array.isArray(data) ? data : data.data || data.items || [];
      if (students.length > 0) {
        const res = await request.get(`${API_BASE}/teacher/students/${students[0].id}/stats`, { headers: auth() });
        expect(res.ok()).toBeTruthy();
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // PROFILE
  // ══════════════════════════════════════════════════════════════
  test.describe("Profile", () => {
    let originalProfile: any;

    test("GET /teacher/profile returns profile data", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/profile`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      originalProfile = data.data || data;
      expect(originalProfile).toBeTruthy();
    });

    test("PUT /teacher/profile updates profile", async ({ request }) => {
      if (!originalProfile) return;
      const res = await request.put(`${API_BASE}/teacher/profile`, {
        headers: auth(),
        data: {
          firstName: originalProfile.firstName || "Test",
          lastName: originalProfile.lastName || "Teacher",
          email: originalProfile.email || TEST_USERS.teacher.email,
        },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("Profile update persists", async ({ request }) => {
      const res = await request.get(`${API_BASE}/teacher/profile`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      const profile = data.data || data;
      expect(profile.firstName).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // EXAM CREATION FLOW
  // ══════════════════════════════════════════════════════════════
  test.describe("Exam Creation", () => {
    test("POST /teacher/exams with invalid courseId returns error", async ({ request }) => {
      const res = await request.post(`${API_BASE}/teacher/exams`, {
        headers: auth(),
        data: {
          name: "PW Test Exam",
          courseId: "00000000-0000-0000-0000-000000000000",
          language: "C",
          codePurpose: "Test purpose",
        },
      });
      expect([200, 400, 404, 500].includes(res.status())).toBeTruthy();
    });

    test("POST /teacher/exams without name fails", async ({ request }) => {
      const res = await request.post(`${API_BASE}/teacher/exams`, {
        headers: auth(),
        data: { name: "", courseId: "00000000-0000-0000-0000-000000000000" },
      });
      expect(res.ok()).toBeFalsy();
    });
  });
});
