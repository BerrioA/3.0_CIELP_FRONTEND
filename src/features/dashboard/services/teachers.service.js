import { apiClient } from "../../../shared/api/httpClient";

export const getTeachersListApi = async () => {
  const response = await apiClient.get("/teachers");
  return response.data;
};

export const getTeacherByIdApi = async (teacherId) => {
  const response = await apiClient.get(`/teachers/${teacherId}`);
  return response.data;
};

export const registerTeacherApi = async (userData) => {
  const response = await apiClient.post("/teachers", { userData });
  return response.data;
};
