import { apiClient } from "../../../shared/api/httpClient";

export const getGlobalAnalyticsService = async ({ period = "week" } = {}) => {
  const response = await apiClient.get("/analytics/global", {
    params: {
      period,
    },
  });
  return response.data;
};
