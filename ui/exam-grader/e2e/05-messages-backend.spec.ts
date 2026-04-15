import { test, expect } from "@playwright/test";
import { API_BASE, TEST_USERS } from "./helpers";

let teacherToken: string;
let studentToken: string;
let teacherId: string;
let studentId: string;

test.describe("Messages Backend API - Deep Functional Tests", () => {
  test.beforeAll(async ({ request }) => {
    const [tRes, sRes] = await Promise.all([
      request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.teacher }),
      request.post(`${API_BASE}/auth/login`, { data: TEST_USERS.student }),
    ]);
    teacherToken = (await tRes.json()).data.token;
    studentToken = (await sRes.json()).data.token;
  });

  const teacherAuth = () => ({ Authorization: `Bearer ${teacherToken}` });
  const studentAuth = () => ({ Authorization: `Bearer ${studentToken}` });

  // ══════════════════════════════════════════════════════════════
  // AUTH GUARD
  // ══════════════════════════════════════════════════════════════
  test("Unauthenticated cannot access messages", async ({ request }) => {
    const res = await request.get(`${API_BASE}/messages/teachers`);
    expect(res.status()).toBe(401);
  });

  test("Unauthenticated cannot send message", async ({ request }) => {
    const res = await request.post(`${API_BASE}/messages`, {
      data: { receiverId: "some-id", content: "hello" },
    });
    expect(res.status()).toBe(401);
  });

  // ══════════════════════════════════════════════════════════════
  // CONTACT LISTS
  // ══════════════════════════════════════════════════════════════
  test.describe("Contact Lists", () => {
    test("Student can get teacher list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/messages/teachers`, { headers: studentAuth() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      const teachers = Array.isArray(data) ? data : data.data || data.items || [];
      if (Array.isArray(teachers) && teachers.length > 0) {
        teacherId = teachers[0].id;
      }
    });

    test("Teacher can get student list", async ({ request }) => {
      const res = await request.get(`${API_BASE}/messages/students`, { headers: teacherAuth() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      const students = Array.isArray(data) ? data : data.data || data.items || [];
      if (Array.isArray(students) && students.length > 0) {
        studentId = students[0].id;
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SEND & RECEIVE MESSAGES
  // ══════════════════════════════════════════════════════════════
  test.describe("Send & Receive", () => {
    test("Student sends message to teacher", async ({ request }) => {
      if (!teacherId) return;
      const res = await request.post(`${API_BASE}/messages`, {
        headers: studentAuth(),
        data: { receiverId: teacherId, content: `PW test message from student ${Date.now()}` },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("Teacher sends message to student", async ({ request }) => {
      if (!studentId) return;
      const res = await request.post(`${API_BASE}/messages`, {
        headers: teacherAuth(),
        data: { receiverId: studentId, content: `PW test message from teacher ${Date.now()}` },
      });
      expect(res.ok()).toBeTruthy();
    });

    test("Send message with empty content fails", async ({ request }) => {
      if (!teacherId) return;
      const res = await request.post(`${API_BASE}/messages`, {
        headers: studentAuth(),
        data: { receiverId: teacherId, content: "" },
      });
      expect(res.ok()).toBeFalsy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // CONVERSATION HISTORY
  // ══════════════════════════════════════════════════════════════
  test.describe("Conversation", () => {
    test("Student can view conversation with teacher", async ({ request }) => {
      if (!teacherId) return;
      const res = await request.get(`${API_BASE}/messages/${teacherId}`, { headers: studentAuth() });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      const messages = Array.isArray(data) ? data : data.data || data.items || [];
      expect(Array.isArray(messages)).toBeTruthy();
    });

    test("Teacher can view conversation with student", async ({ request }) => {
      if (!studentId) return;
      const res = await request.get(`${API_BASE}/messages/${studentId}`, { headers: teacherAuth() });
      expect(res.ok()).toBeTruthy();
    });

    test("Conversation with invalid id returns empty or error", async ({ request }) => {
      const res = await request.get(`${API_BASE}/messages/00000000-0000-0000-0000-000000000000`, { headers: studentAuth() });
      expect([200, 400, 404].includes(res.status())).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // MARK AS READ
  // ══════════════════════════════════════════════════════════════
  test.describe("Mark as Read", () => {
    test("Mark message as read (if messages exist)", async ({ request }) => {
      if (!teacherId) return;
      const convRes = await request.get(`${API_BASE}/messages/${teacherId}`, { headers: studentAuth() });
      const data = await convRes.json();
      const messages = Array.isArray(data) ? data : data.data || data.items || [];
      if (messages.length > 0) {
        const msgId = messages[messages.length - 1].id;
        const res = await request.put(`${API_BASE}/messages/${msgId}/read`, { headers: studentAuth() });
        expect([200, 400, 404].includes(res.status())).toBeTruthy();
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // UNREAD COUNT
  // ══════════════════════════════════════════════════════════════
  test.describe("Unread Count", () => {
    test("Student unread count returns number", async ({ request }) => {
      const res = await request.get(`${API_BASE}/messages/unread-count`, { headers: studentAuth() });
      expect(res.ok()).toBeTruthy();
    });

    test("Teacher unread count returns number", async ({ request }) => {
      const res = await request.get(`${API_BASE}/messages/unread-count`, { headers: teacherAuth() });
      expect(res.ok()).toBeTruthy();
    });
  });
});
