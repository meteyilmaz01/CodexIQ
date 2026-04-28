import api from "./axiosInstance";

export const teacherApi = {
  getStats: () => api.get("/teacher/stats").then((r) => r.data),
  getRecentUploads: () => api.get("/teacher/recent-uploads").then((r) => r.data),
  getCourseAverages: () => api.get("/teacher/course-averages").then((r) => r.data),
  getQueueStatus: () => api.get("/teacher/queue-status").then((r) => r.data),

  createExam: (data: { name: string; courseId: string; programmingLanguage?: string; codePurpose?: string }) =>
    api.post("/teacher/exams", data).then((r) => r.data),
  uploadPapers: (examId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return api.post(`/teacher/exams/${examId}/papers`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
  saveRubric: (examId: string, items: { criteria: string; maxPoints: number }[]) =>
    api.post(`/teacher/exams/${examId}/rubric`, { items }).then((r) => r.data),
  startEvaluation: (examId: string) =>
    api.post(`/teacher/exams/${examId}/start-evaluation`).then((r) => r.data),

  getResults: (params: { search?: string; course?: string; exam?: string; sortBy?: string; page?: number; pageSize?: number }) =>
    api.get("/teacher/results", { params }).then((r) => r.data),
  getResultDetail: (id: string) => api.get(`/teacher/results/${id}`).then((r) => r.data),
  overrideScore: (id: string, newScore: number) =>
    api.put(`/teacher/results/${id}/override`, { newScore }).then((r) => r.data),
  updateNote: (id: string, note: string) =>
    api.put(`/teacher/results/${id}/note`, { note }).then((r) => r.data),
  shareResult: (id: string) => api.put(`/teacher/results/${id}/share`).then((r) => r.data),
  bulkShare: (examPaperIds: string[]) =>
    api.put("/teacher/results/bulk-share", { examPaperIds }).then((r) => r.data),
  exportExcel: (examName?: string) =>
    api.get("/teacher/results/export/excel", { params: examName ? { examName } : {}, responseType: "blob" }),
  exportPdf: (examName?: string) =>
    api.get("/teacher/results/export/pdf", { params: examName ? { examName } : {}, responseType: "blob" }),

  getStudents: (classId?: string) =>
    api.get("/teacher/students", { params: classId ? { classId } : {} }).then((r) => r.data),
  getStudentStats: (id: string) => api.get(`/teacher/students/${id}/stats`).then((r) => r.data),

  getProfile: () => api.get("/teacher/profile").then((r) => r.data),
  updateProfile: (data: { firstName: string; lastName: string; email: string }) =>
    api.put("/teacher/profile", data).then((r) => r.data),

  getCourses: () => api.get("/teacher/courses").then((r) => r.data),
  getClasses: () => api.get("/teacher/classes").then((r) => r.data),
  regenerateJoinCode: (classId: string) =>
    api.post(`/teacher/classes/${classId}/regenerate-code`).then((r) => r.data),
  getRegradeRequests: () => api.get("/teacher/regrade-requests").then((r) => r.data),
  getRegradeRequestCount: () => api.get("/teacher/regrade-requests/count").then((r) => r.data),
  resolveRegradeRequest: (requestId: string, decision: string, teacherNote?: string, newScore?: number) =>
    api.post(`/teacher/regrade-requests/${requestId}/resolve`, { decision, teacherNote, newScore }).then((r) => r.data),
  getAnnouncements: () => api.get("/teacher/announcements").then((r) => r.data),
};
