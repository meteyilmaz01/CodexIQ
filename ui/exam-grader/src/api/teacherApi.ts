import api from "./axiosInstance";

export const teacherApi = {
  getStats: () => api.get("/teacher/stats").then((r) => r.data),
  getRecentUploads: () => api.get("/teacher/recent-uploads").then((r) => r.data),
  getCourseAverages: () => api.get("/teacher/course-averages").then((r) => r.data),
  getQueueStatus: () => api.get("/teacher/queue-status").then((r) => r.data),

  createExam: (data: { name: string; courseId: string; language?: string; codePurpose?: string }) =>
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
  exportExcel: (examId: string) =>
    api.get("/teacher/results/export/excel", { params: { examId }, responseType: "blob" }),
  exportPdf: (examId: string) =>
    api.get("/teacher/results/export/pdf", { params: { examId }, responseType: "blob" }),

  getStudents: (classId?: string) =>
    api.get("/teacher/students", { params: classId ? { classId } : {} }).then((r) => r.data),
  getStudentStats: (id: string) => api.get(`/teacher/students/${id}/stats`).then((r) => r.data),

  getProfile: () => api.get("/teacher/profile").then((r) => r.data),
  updateProfile: (data: { firstName: string; lastName: string; email: string }) =>
    api.put("/teacher/profile", data).then((r) => r.data),
};
