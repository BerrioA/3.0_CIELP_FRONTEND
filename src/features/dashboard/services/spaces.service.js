import { apiClient } from "../../../shared/api/httpClient";

export const getDigitalSpacesApi = async () => {
  const response = await apiClient.get("/spaces");
  return response.data;
};

export const startSpaceSessionApi = async (spaceId) => {
  const response = await apiClient.post("/spaces/start", {
    space_id: spaceId,
  });
  return response.data;
};

export const endSpaceSessionApi = async ({ sessionId, moodScore }) => {
  const response = await apiClient.put(`/spaces/end/${sessionId}`, {
    mood_score: moodScore,
  });
  return response.data;
};

export const getMySpaceStatsApi = async () => {
  const response = await apiClient.get("/spaces/stats");
  return response.data;
};

export const getMyActiveSpaceSessionApi = async () => {
  const response = await apiClient.get("/spaces/active-session");
  return response.data;
};

export const getSpaceMoodHistoryApi = async ({ days = 90 } = {}) => {
  const response = await apiClient.get("/spaces/mood-history", {
    params: { days },
  });
  return response.data;
};
