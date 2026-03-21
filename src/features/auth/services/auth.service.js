import { apiClient, authSessionClient } from "../../../shared/api/httpClient";

export const loginService = async ({ email, password }) => {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
};

export const registerTeacherService = async (userData) => {
  const response = await apiClient.post("/teachers", { userData });
  return response.data;
};

export const verifyAccountService = async (verificationCode) => {
  const response = await apiClient.get(
    `/auth/verify-account/${verificationCode}`,
  );
  return response.data;
};

export const resendVerificationService = async (email) => {
  const response = await apiClient.post("/auth/resend-verification", { email });
  return response.data;
};

export const requestPasswordRecoveryService = async (email) => {
  const response = await apiClient.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPasswordService = async ({
  verificationCode,
  newPassword,
}) => {
  const response = await apiClient.post(
    `/auth/reset-password/${verificationCode}`,
    { newPassword },
  );
  return response.data;
};

export const profileService = async () => {
  const response = await apiClient.get("/auth/profile");
  return response.data;
};

export const refreshSessionService = async () => {
  const token = await authSessionClient.refresh();
  return { token };
};

export const logoutService = async () => {
  const response = await apiClient.post("/auth/logout");
  return response.data;
};

export const changeMyPasswordService = async ({ oldPassword, newPassword }) => {
  const response = await apiClient.patch("/users/me/password", {
    oldPassword,
    newPassword,
  });

  return response.data;
};
