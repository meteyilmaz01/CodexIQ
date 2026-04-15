import api from "./axiosInstance";

export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard").then((r) => r.data),

  getUsers: (params: { search?: string; role?: string; isActive?: boolean; page?: number; pageSize?: number }) =>
    api.get("/admin/users", { params }).then((r) => r.data),
  createUser: (data: { email: string; firstName: string; lastName: string; role: string; password: string }) =>
    api.post("/admin/users", data).then((r) => r.data),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data).then((r) => r.data),
  updateUserStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin/users/${id}`, { isActive }).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),

  getAnnouncements: () => api.get("/admin/announcements").then((r) => r.data),
  createAnnouncement: (data: { title: string; content: string }) =>
    api.post("/admin/announcements", data).then((r) => r.data),
  updateAnnouncement: (id: string, data: any) =>
    api.put(`/admin/announcements/${id}`, data).then((r) => r.data),
  deleteAnnouncement: (id: string) => api.delete(`/admin/announcements/${id}`).then((r) => r.data),

  getClasses: () => api.get("/admin/classes").then((r) => r.data),
  createClass: (data: { name: string }) => api.post("/admin/classes", data).then((r) => r.data),
  updateClass: (id: string, data: { name: string }) => api.put(`/admin/classes/${id}`, data).then((r) => r.data),
  updateClassStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin/classes/${id}/status`, { isActive }).then((r) => r.data),
  deleteClass: (id: string) => api.delete(`/admin/classes/${id}`).then((r) => r.data),

  getCourses: (params: { search?: string; classId?: string; isActive?: boolean; page?: number; pageSize?: number }) =>
    api.get("/admin/courses", { params }).then((r) => r.data),
  createCourse: (data: { name: string; classId: string }) =>
    api.post("/admin/classes/courses", data).then((r) => r.data),
  updateCourse: (id: string, data: any) => api.put(`/admin/courses/${id}`, data).then((r) => r.data),
  updateCourseStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin/courses/${id}/status`, { isActive }).then((r) => r.data),
  deleteCourse: (id: string) => api.delete(`/admin/courses/${id}`).then((r) => r.data),

  getLogs: (take: number = 50) => api.get("/admin/logs", { params: { take } }).then((r) => r.data),
  getApiCosts: () => api.get("/admin/api-costs").then((r) => r.data),
  getQueue: () => api.get("/admin/queue").then((r) => r.data),
};
