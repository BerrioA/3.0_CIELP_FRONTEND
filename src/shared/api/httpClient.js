import axios from "axios";
import { API_BASE_URL } from "../config/env";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../lib/sessionToken";
import {
  notifySessionExpired,
  notifyTokenRefreshed,
} from "../lib/authSessionEvents";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

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

const resolveAccessToken = (payload) => {
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

const requestNewAccessToken = async () => {
  try {
    const response = await refreshClient.get("/auth/refresh");
    const newAccessToken = resolveAccessToken(response.data);

    if (!newAccessToken) {
      throw new Error("No se recibio un access token en el refresh.");
    }

    setAccessToken(newAccessToken);
    notifyTokenRefreshed(newAccessToken);

    return newAccessToken;
  } catch (error) {
    clearAccessToken();
    notifySessionExpired();
    throw error;
  }
};

apiClient.interceptors.request.use((config) => {
  const token = sanitizeAccessToken(getAccessToken());

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthRoute = requestUrl.includes("/auth/login");
    const isRefreshRoute = requestUrl.includes("/auth/refresh");

    const shouldTryRefresh =
      statusCode === 401 &&
      !originalRequest._retry &&
      !isAuthRoute &&
      !isRefreshRoute;

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = requestNewAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = sanitizeAccessToken(await refreshPromise);

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export const authSessionClient = {
  refresh: requestNewAccessToken,
};
