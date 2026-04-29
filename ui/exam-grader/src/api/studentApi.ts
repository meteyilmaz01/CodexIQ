import api from "./axiosInstance";

export const studentApi = {
  getStats: () => api.get("/student/stats").then((r) => r.data),
  getProfile: () => api.get("/student/profile").then((r) => r.data),
  updateProfile: (data: { firstName: string; lastName: string; email: string }) =>
    api.put("/student/profile", data).then((r) => r.data),
  getRecentResults: () => api.get("/student/recent-results").then((r) => r.data),
  getWeakTopics: () => api.get("/student/weak-topics").then((r) => r.data),
  getResults: (params: { search?: string; course?: string; sortBy?: string; page?: number; pageSize?: number }) =>
    api.get("/student/results", { params }).then((r) => r.data),
  getResultDetail: (id: string) => api.get(`/student/results/${id}`).then((r) => r.data),
  getAnnouncements: () => api.get("/student/announcements").then((r) => r.data),
  getExamNotifications: () => api.get("/student/exam-notifications").then((r) => r.data),
  joinClass: (joinCode: string) => api.post("/student/join-class", { joinCode }).then((r) => r.data),
  createRegradeRequest: (examPaperId: string, reason: string) =>
    api.post(`/student/results/${examPaperId}/regrade-request`, { reason }).then((r) => r.data),
  getRegradeRequestStatus: (examPaperId: string) =>
    api.get(`/student/results/${examPaperId}/regrade-request`).then((r) => r.data),
  getProgress: () => api.get("/student/analytics/progress").then((r) => r.data),
  getErrorSummary: () => api.get("/student/analytics/error-summary").then((r) => r.data),
};
