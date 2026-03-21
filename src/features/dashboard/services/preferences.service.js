import { apiClient } from "../../../shared/api/httpClient";

export const getMyPreferencesService = async () => {
  const response = await apiClient.get("/users/me/preferences");
  return response.data;
};

export const updateMyPreferencesService = async (preferencesPayload) => {
  const response = await apiClient.patch(
    "/users/me/preferences",
    preferencesPayload,
  );
  return response.data;
};
