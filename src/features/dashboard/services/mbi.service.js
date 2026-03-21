import { apiClient } from "../../../shared/api/httpClient";

export const getMbiQuestionsApi = async () => {
  const response = await apiClient.get("/mbi/questions");
  return response.data;
};

export const submitMbiTestApi = async ({ answers }) => {
  const response = await apiClient.post("/mbi/submit", { answers });
  return response.data;
};

export const getMyMbiHistoryApi = async () => {
  const response = await apiClient.get("/mbi/history");
  return response.data;
};

export const getMyMbiRetestStatusApi = async () => {
  const response = await apiClient.get("/mbi/retest-status/me");
  return response.data;
};

export const getMyMbiProgressComparisonApi = async () => {
  const response = await apiClient.get("/mbi/progress/my");
  return response.data;
};

export const getTeacherMbiHistoryApi = async (teacherId) => {
  const response = await apiClient.get(`/mbi/history/${teacherId}`);
  return response.data;
};

export const getTeachersApi = async () => {
  const response = await apiClient.get("/teachers");
  return response.data;
};

export const getTeacherByIdApi = async (teacherId) => {
  const response = await apiClient.get(`/teachers/${teacherId}`);
  return response.data;
};
