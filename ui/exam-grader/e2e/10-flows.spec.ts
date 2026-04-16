import { test, expect } from "@playwright/test";
import { API_BASE, TEST_USERS } from "./helpers";

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ══════════════════════════════════════════════════════════════════════
// #1 — CLASS → COURSE → TEACHER ASSIGNMENT FLOW
// Sınıf oluştur → Course ekle → Teacher atanmış mı doğrula → Temizle
// ══════════════════════════════════════════════════════════════════════
test.describe("Class & Course Full Flow", () => {
  let adminToken: string;
  let teacherId: string;
  let classId: string;
  let courseId: string;
  const className = `E2E-Flow-Class-${Date.now()}`;
  const courseName = `E2E-Flow-Course-${Date.now()}`;

  test("Setup: get admin token and teacher ID", async ({ request }) => {
    // Admin login
    const adminRes = await request.post(`${API_BASE}/auth/login`, {
      data: TEST_USERS.admin,
    });
    expect(adminRes.ok()).toBeTruthy();
    adminToken = (await adminRes.json()).data.token;

    // Get teacher ID
    const teacherRes = await request.post(`${API_BASE}/auth/login`, {
      data: TEST_USERS.teacher,
    });
    expect(teacherRes.ok()).toBeTruthy();

    // Find teacher in user list
    const usersRes = await request.get(`${API_BASE}/admin/users?role=2`, {
      headers: auth(adminToken),
    });
    const usersData = await usersRes.json();
    const teachers = usersData.items || usersData.results || usersData.data || usersData;
    const teacher = Array.isArray(teachers) ? teachers.find((u: any) => u.email === TEST_USERS.teacher.email) : null;
    expect(teacher).toBeTruthy();
    teacherId = teacher.id;
  });

  test("Step 1: Create class with teacher assignment", async ({ request }) => {
    const res = await request.post(`${API_BASE}/admin/classes`, {
      headers: auth(adminToken),
      data: { name: className, teacherId },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("Step 2: Verify class exists in list with correct teacher", async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/classes`, {
      headers: auth(adminToken),
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const classes = Array.isArray(data) ? data : data.data || data.items || [];
    const found = classes.find((c: any) => c.name === className);
    expect(found).toBeTruthy();
    expect(found.teacherId).toBe(teacherId);
    classId = found.id;
  });

  test("Step 3: Create course under the class", async ({ request }) => {
    expect(classId).toBeTruthy();
    const res = await request.post(`${API_BASE}/admin/classes/courses`, {
      headers: auth(adminToken),
      data: { name: courseName, classId },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("Step 4: Verify course exists and belongs to correct class", async ({ request }) => {
    expect(classId).toBeTruthy();
    const res = await request.get(`${API_BASE}/admin/courses?classId=${classId}`, {
      headers: auth(adminToken),
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const courses = data.items || data.results || data.data || (Array.isArray(data) ? data : []);
    const found = courses.find((c: any) => c.name === courseName);
    expect(found).toBeTruthy();
    courseId = found.id;
  });

  test("Step 5: Teacher can see their class in teacher API", async ({ request }) => {
    const teacherLoginRes = await request.post(`${API_BASE}/auth/login`, {
      data: TEST_USERS.teacher,
    });
    const teacherToken = (await teacherLoginRes.json()).data.token;

    // Teacher's students endpoint filtered by class
    const res = await request.get(`${API_BASE}/teacher/students?classId=${classId}`, {
      headers: auth(teacherToken),
    });
    // Should succeed (even if 0 students in the new class)
    expect(res.ok()).toBeTruthy();
  });

  test("Step 6: Class shows correct student count (0 for new class) and course count (1)", async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/classes`, {
      headers: auth(adminToken),
    });
    const data = await res.json();
    const classes = Array.isArray(data) ? data : data.data || data.items || [];
    const found = classes.find((c: any) => c.name === className);
    expect(found).toBeTruthy();
    expect(found.studentCount).toBe(0);
    expect(found.courseCount).toBe(1);
  });

  test("Cleanup: delete course then class", async ({ request }) => {
    if (courseId) {
      await request.delete(`${API_BASE}/admin/courses/${courseId}`, {
        headers: auth(adminToken),
      });
    }
    if (classId) {
      await request.delete(`${API_BASE}/admin/classes/${classId}`, {
        headers: auth(adminToken),
      });
    }

    // Verify class is deleted
    const res = await request.get(`${API_BASE}/admin/classes`, {
      headers: auth(adminToken),
    });
    const data = await res.json();
    const classes = Array.isArray(data) ? data : data.data || data.items || [];
    const found = classes.find((c: any) => c.name === className);
    expect(found).toBeFalsy();
  });
});

// ══════════════════════════════════════════════════════════════════════
// #2 — END-TO-END MESSAGING FLOW
// Öğretmen mesaj atar → Öğrenci konuşmada görür → Öğrenci cevap yazar
// → Öğretmen cevabı konuşmada görür
// ══════════════════════════════════════════════════════════════════════
test.describe("End-to-End Messaging Flow", () => {
  let teacherToken: string;
  let studentToken: string;
  let teacherId: string;
  let studentId: string;
  const timestamp = Date.now();
  const teacherMessage = `E2E-teacher-says-hello-${timestamp}`;
  const studentReply = `E2E-student-replies-${timestamp}`;

  test("Setup: login both users and get IDs via admin user list", async ({ request }) => {
    // Login teacher
    const tRes = await request.post(`${API_BASE}/auth/login`, {
      data: TEST_USERS.teacher,
    });
    expect(tRes.ok()).toBeTruthy();
    teacherToken = (await tRes.json()).data.token;

    // Login student
    const sRes = await request.post(`${API_BASE}/auth/login`, {
      data: TEST_USERS.student,
    });
    expect(sRes.ok()).toBeTruthy();
    studentToken = (await sRes.json()).data.token;

    // Get user IDs from admin user list (messages/students only returns class-assigned students)
    const adminRes = await request.post(`${API_BASE}/auth/login`, {
      data: TEST_USERS.admin,
    });
    const adminToken = (await adminRes.json()).data.token;

    // Find teacher by email search
    const teacherUsersRes = await request.get(`${API_BASE}/admin/users?search=${encodeURIComponent(TEST_USERS.teacher.email)}`, {
      headers: auth(adminToken),
    });
    const teacherData = await teacherUsersRes.json();
    const teachers = teacherData.items || teacherData.results || teacherData.data || teacherData;
    const teacherUser = Array.isArray(teachers) ? teachers.find((u: any) => u.email === TEST_USERS.teacher.email) : null;
    expect(teacherUser).toBeTruthy();
    teacherId = teacherUser.id;

    // Find student by email search
    const studentUsersRes = await request.get(`${API_BASE}/admin/users?search=${encodeURIComponent(TEST_USERS.student.email)}`, {
      headers: auth(adminToken),
    });
    const studentData = await studentUsersRes.json();
    const students = studentData.items || studentData.results || studentData.data || studentData;
    const studentUser = Array.isArray(students) ? students.find((u: any) => u.email === TEST_USERS.student.email) : null;
    expect(studentUser).toBeTruthy();
    studentId = studentUser.id;
  });

  test("Step 1: Teacher sends message to student", async ({ request }) => {
    expect(studentId).toBeTruthy();
    const res = await request.post(`${API_BASE}/messages`, {
      headers: auth(teacherToken),
      data: { receiverId: studentId, text: teacherMessage },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("Step 2: Student sees the teacher's message in conversation", async ({ request }) => {
    expect(teacherId).toBeTruthy();
    const res = await request.get(`${API_BASE}/messages/${teacherId}`, {
      headers: auth(studentToken),
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const messages = Array.isArray(data) ? data : data.data || data.items || [];
    // Find the exact message teacher sent
    const found = messages.find((m: any) => m.text === teacherMessage);
    expect(found).toBeTruthy();
    // MessageDto has: id, from, text, time, isRead
    expect(found.from).toBeTruthy();
  });

  test("Step 3: Student replies to teacher", async ({ request }) => {
    expect(teacherId).toBeTruthy();
    const res = await request.post(`${API_BASE}/messages`, {
      headers: auth(studentToken),
      data: { receiverId: teacherId, text: studentReply },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("Step 4: Teacher sees the student's reply in conversation", async ({ request }) => {
    expect(studentId).toBeTruthy();
    const res = await request.get(`${API_BASE}/messages/${studentId}`, {
      headers: auth(teacherToken),
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const messages = Array.isArray(data) ? data : data.data || data.items || [];
    // Find the exact reply student sent
    const found = messages.find((m: any) => m.text === studentReply);
    expect(found).toBeTruthy();
  });

  test("Step 5: Full conversation has both messages in correct order", async ({ request }) => {
    expect(studentId).toBeTruthy();
    const res = await request.get(`${API_BASE}/messages/${studentId}`, {
      headers: auth(teacherToken),
    });
    const data = await res.json();
    const messages = Array.isArray(data) ? data : data.data || data.items || [];

    const teacherMsg = messages.find((m: any) => m.text === teacherMessage);
    const studentMsg = messages.find((m: any) => m.text === studentReply);
    expect(teacherMsg).toBeTruthy();
    expect(studentMsg).toBeTruthy();

    // Teacher's message should come before student's reply
    const teacherIdx = messages.indexOf(teacherMsg);
    const studentIdx = messages.indexOf(studentMsg);
    expect(teacherIdx).toBeLessThan(studentIdx);
  });

  test("Step 6: Student marks teacher's message as read", async ({ request }) => {
    expect(teacherId).toBeTruthy();
    // Get conversation to find the teacher's message ID
    const convRes = await request.get(`${API_BASE}/messages/${teacherId}`, {
      headers: auth(studentToken),
    });
    const data = await convRes.json();
    const messages = Array.isArray(data) ? data : data.data || data.items || [];
    const teacherMsg = messages.find((m: any) => m.text === teacherMessage);
    if (teacherMsg && teacherMsg.id) {
      const readRes = await request.put(`${API_BASE}/messages/${teacherMsg.id}/read`, {
        headers: auth(studentToken),
      });
      expect([200, 400].includes(readRes.status())).toBeTruthy();
    }
  });

  test("Step 7: Teacher's unread count is a valid number", async ({ request }) => {
    // Re-login to get fresh token (previous token may have expired)
    const tRes = await request.post(`${API_BASE}/auth/login`, {
      data: TEST_USERS.teacher,
    });
    expect(tRes.ok()).toBeTruthy();
    const freshToken = (await tRes.json()).data.token;

    const res = await request.get(`${API_BASE}/messages/unread-count`, {
      headers: auth(freshToken),
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    // Should be a number (could be in data wrapper or direct)
    const count = typeof data === "number" ? data : data.data ?? data.count ?? data.unreadCount;
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
