import { apiClient, authSessionClient } from "../../../shared/api/httpClient";

const sanitizeAccessToken = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.replace(/^Bearer\s+/i, "");
};

export const resolveAccessTokenFromPayload = (payload) => {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    return sanitizeAccessToken(payload);
  }

  return (
    sanitizeAccessToken(payload.token) ||
    sanitizeAccessToken(payload.accessToken) ||
    sanitizeAccessToken(payload.access_token) ||
    sanitizeAccessToken(payload?.data?.token) ||
    sanitizeAccessToken(payload?.data?.accessToken) ||
    sanitizeAccessToken(payload?.data?.access_token)
  );
};

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
  const token = resolveAccessTokenFromPayload(
    await authSessionClient.refresh(),
  );

  if (!token) {
    throw new Error(
      "No se recibio un access token valido en la renovacion de sesion.",
    );
  }

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
