// src/api/authApi.ts

import api from "./axiosInstance";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await api.post<{ success: boolean; data: LoginResponse }>(
      "/auth/login",
      data
    );
    return response.data;
  },
  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    const response = await api.put("/auth/change-password", data);
    return response.data;
  },
};