import api from "./axiosInstance";

export const messageApi = {
  getTeachers: () => api.get("/messages/teachers").then((r) => r.data),
  getStudents: () => api.get("/messages/students").then((r) => r.data),
  getConversation: (userId: string) => api.get(`/messages/${userId}`).then((r) => r.data),
  sendMessage: (data: { receiverId: string; content: string }) =>
    api.post("/messages", data).then((r) => r.data),
  markAsRead: (messageId: string) => api.put(`/messages/${messageId}/read`).then((r) => r.data),
  getUnreadCount: () => api.get("/messages/unread-count").then((r) => r.data),
};
