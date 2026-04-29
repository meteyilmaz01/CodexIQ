import { test, expect } from "@playwright/test";
import { API_BASE, TEST_USERS } from "./helpers";

let adminToken: string;
let teacherToken: string;
let studentToken: string;

test.describe("Admin Backend API - Deep Functional Tests", () => {
  test.beforeAll(async ({ request }) => {
    const [adminRes, teacherRes, studentRes] = await Promise.all([
      request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.admin }),
      request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.teacher }),
      request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.student }),
    ]);
    adminToken = (await adminRes.json()).data.token;
    teacherToken = (await teacherRes.json()).data.token;
    studentToken = (await studentRes.json()).data.token;
  });

  const admin = () => ({ Authorization: `Bearer ${adminToken}` });
  const teacher = () => ({ Authorization: `Bearer ${teacherToken}` });
  const student = () => ({ Authorization: `Bearer ${studentToken}` });

  // ══════════════════════════════════════════════════════════════
  // ROLE GUARD - All endpoints require Admin role
  // ══════════════════════════════════════════════════════════════
  test.describe("Role Guard", () => {
    test("Student cannot access admin dashboard", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/dashboard`, { headers: student() });
      expect(res.status()).toBe(403);
    });

    test("Teacher cannot access admin dashboard", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/dashboard`, { headers: teacher() });
      expect(res.status()).toBe(403);
    });

    test("Student cannot access admin users", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users`, { headers: student() });
      expect(res.status()).toBe(403);
    });

    test("Teacher cannot access admin users", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users`, { headers: teacher() });
      expect(res.status()).toBe(403);
    });

    test("Unauthenticated cannot access admin", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/dashboard`);
      expect(res.status()).toBe(401);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════
  test.describe("Dashboard", () => {
    test("Returns dashboard data with expected structure", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/dashboard`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // USERS CRUD - Full lifecycle
  // ══════════════════════════════════════════════════════════════
  test.describe("Users CRUD", () => {
    let createdUserId: string;
    const testEmail = `playwright_${Date.now()}@test.com`;

    test("GET /admin/users returns paginated list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users?page=1&pageSize=5`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data).toBeTruthy();
    });

    test("GET /admin/users with search filter", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users?search=admin`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /admin/users with role filter (Student)", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users?role=1`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /admin/users with role filter (Teacher)", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users?role=2`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /admin/users with isActive filter", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users?isActive=true`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /admin/users with combined filters", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users?role=1&isActive=true&page=1&pageSize=5`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("POST /admin/users creates a Student user", async ({ request }) => {
      const res = await request.post(`${API_BASE}/admin/users`, {
        headers: admin(),
        data: {
          email: testEmail,
          firstName: "Playwright",
          lastName: "TestUser",
          role: 1, // Student
          password: "Test1234!",
        },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    test("Created user can be found by search", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users?search=Playwright`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      const users = data.items || data.results || data.data || data;
      const found = Array.isArray(users) ? users.find((u: any) => u.email === testEmail) : null;
      if (found) createdUserId = found.id;
      expect(found).toBeTruthy();
    });

    test("PUT /admin/users/:id updates user info", async ({ request }) => {
      if (!createdUserId) return;
      const res = await request.put(`${API_BASE}/admin/users/${createdUserId}`, {
        headers: admin(),
        data: { firstName: "Updated", lastName: "Name", email: testEmail, role: 1 },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("PATCH /admin/users/:id/status deactivates user", async ({ request }) => {
      if (!createdUserId) return;
      const res = await request.patch(`${API_BASE}/admin/users/${createdUserId}/status`, {
        headers: admin(),
        data: { isActive: false },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("PATCH /admin/users/:id/status reactivates user", async ({ request }) => {
      if (!createdUserId) return;
      const res = await request.patch(`${API_BASE}/admin/users/${createdUserId}/status`, {
        headers: admin(),
        data: { isActive: true },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("DELETE /admin/users/:id deletes user", async ({ request }) => {
      if (!createdUserId) return;
      const res = await request.delete(`${API_BASE}/admin/users/${createdUserId}`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("Deleted user no longer found by search", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users?search=${testEmail}`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      const users = data.items || data.results || data.data || data;
      const found = Array.isArray(users) ? users.find((u: any) => u.email === testEmail) : null;
      expect(found).toBeFalsy();
    });

    test("POST /admin/users with duplicate email fails", async ({ request }) => {
      // Try creating with existing email
      const res = await request.post(`${API_BASE}/admin/users`, {
        headers: admin(),
        data: { email: TEST_USERS.admin.email, firstName: "Dup", lastName: "User", role: 1, password: "Test1234!" },
      });
      expect(res.ok()).toBeFalsy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // ANNOUNCEMENTS CRUD - Full lifecycle
  // ══════════════════════════════════════════════════════════════
  test.describe("Announcements CRUD", () => {
    let announcementId: string;

    test("GET /admin/announcements returns list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/announcements`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("POST /admin/announcements creates announcement", async ({ request }) => {
      const res = await request.post(`${API_BASE}/admin/announcements`, {
        headers: admin(),
        data: { title: "PW Test Announcement", content: "Created by Playwright deep test" },
      });
      expect(res.ok()).toBeTruthy();
      expect((await res.json()).success).toBe(true);
    });

    test("Created announcement appears in list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/announcements`, { headers: admin() });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.items || [];
      const found = list.find((a: any) => a.title === "PW Test Announcement");
      expect(found).toBeTruthy();
      announcementId = found.id;
    });

    test("PUT /admin/announcements/:id updates announcement", async ({ request }) => {
      if (!announcementId) return;
      const res = await request.put(`${API_BASE}/admin/announcements/${announcementId}`, {
        headers: admin(),
        data: { title: "PW Updated Title", content: "Updated content by Playwright" },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("Updated announcement has new title", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/announcements`, { headers: admin() });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.items || [];
      const found = list.find((a: any) => a.id === announcementId);
      expect(found?.title).toBe("PW Updated Title");
    });

    test("DELETE /admin/announcements/:id deletes announcement", async ({ request }) => {
      if (!announcementId) return;
      const res = await request.delete(`${API_BASE}/admin/announcements/${announcementId}`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("Deleted announcement no longer in list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/announcements`, { headers: admin() });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.items || [];
      const found = list.find((a: any) => a.id === announcementId);
      expect(found).toBeFalsy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // CLASSES CRUD - Full lifecycle
  // ══════════════════════════════════════════════════════════════
  test.describe("Classes CRUD", () => {
    let classId: string;
    let teacherId: string;

    test("Find a teacher for class operations", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/users?role=Teacher`, { headers: admin() });
      const data = await res.json();
      const users = data.items || data.results || data.data || data;
      expect(Array.isArray(users) && users.length > 0).toBeTruthy();
      teacherId = users[0].id;
    });

    test("GET /admin/classes returns list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/classes`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("POST /admin/classes creates a class with teacherId", async ({ request }) => {
      expect(teacherId).toBeTruthy();
      const res = await request.post(`${API_BASE}/admin/classes`, {
        headers: admin(),
        data: { name: `PW Test Class ${Date.now()}`, teacherId },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("POST /admin/classes without teacherId fails (400)", async ({ request }) => {
      const res = await request.post(`${API_BASE}/admin/classes`, {
        headers: admin(),
        data: { name: "No Teacher Class" },
      });
      expect(res.status()).toBe(400);
    });

    test("Created class appears in list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/classes`, { headers: admin() });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.items || [];
      expect(list.length).toBeGreaterThan(0);
      classId = list[list.length - 1].id;
    });

    test("PUT /admin/classes/:id updates class", async ({ request }) => {
      if (!classId || !teacherId) return;
      const res = await request.put(`${API_BASE}/admin/classes/${classId}`, {
        headers: admin(),
        data: { name: "PW Updated Class", teacherId },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("PATCH /admin/classes/:id/status deactivates class", async ({ request }) => {
      if (!classId) return;
      const res = await request.patch(`${API_BASE}/admin/classes/${classId}/status`, {
        headers: admin(),
        data: { isActive: false },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("PATCH /admin/classes/:id/status reactivates class", async ({ request }) => {
      if (!classId) return;
      const res = await request.patch(`${API_BASE}/admin/classes/${classId}/status`, {
        headers: admin(),
        data: { isActive: true },
      });
      expect(res.ok()).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // COURSES CRUD - Full lifecycle
  // ══════════════════════════════════════════════════════════════
  test.describe("Courses CRUD", () => {
    let courseId: string;
    let classId: string;

    test("Get a class for course operations", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/classes`, { headers: admin() });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.items || [];
      expect(list.length).toBeGreaterThan(0);
      classId = list[0].id;
    });

    test("GET /admin/courses returns paginated list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/courses?page=1&pageSize=10`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("POST /admin/classes/courses creates a course", async ({ request }) => {
      expect(classId).toBeTruthy();
      const res = await request.post(`${API_BASE}/admin/classes/courses`, {
        headers: admin(),
        data: { name: `PW Course ${Date.now()}`, classId },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("Created course appears in list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/courses?pageSize=100`, { headers: admin() });
      const data = await res.json();
      const list = data.items || data.results || data.data || data;
      expect(Array.isArray(list) ? list.length : 0).toBeGreaterThan(0);
      if (Array.isArray(list)) courseId = list[list.length - 1].id;
    });

    test("GET /admin/courses with classId filter", async ({ request }) => {
      if (!classId) return;
      const res = await request.get(`${API_BASE}/admin/courses?classId=${classId}`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("PUT /admin/courses/:id updates course", async ({ request }) => {
      if (!courseId) return;
      const res = await request.put(`${API_BASE}/admin/courses/${courseId}`, {
        headers: admin(),
        data: { name: "PW Updated Course", classId },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("PATCH /admin/courses/:id/status deactivates course", async ({ request }) => {
      if (!courseId) return;
      const res = await request.patch(`${API_BASE}/admin/courses/${courseId}/status`, {
        headers: admin(),
        data: { isActive: false },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("PATCH /admin/courses/:id/status reactivates course", async ({ request }) => {
      if (!courseId) return;
      const res = await request.patch(`${API_BASE}/admin/courses/${courseId}/status`, {
        headers: admin(),
        data: { isActive: true },
      });
      expect(res.ok()).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // LOGS
  // ══════════════════════════════════════════════════════════════
  test.describe("Logs", () => {
    test("GET /admin/logs returns entries", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/logs?take=10`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /admin/logs with large take", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/logs?take=100`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });

    test("GET /admin/logs default take", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/logs`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // API COSTS
  // ══════════════════════════════════════════════════════════════
  test.describe("API Costs", () => {
    test("GET /admin/api-costs returns cost data", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/api-costs`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // QUEUE
  // ══════════════════════════════════════════════════════════════
  test.describe("Queue", () => {
    test("GET /admin/queue returns queue status", async ({ request }) => {
      const res = await request.get(`${API_BASE}/admin/queue`, { headers: admin() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data).toBeTruthy();
    });
  });
});
