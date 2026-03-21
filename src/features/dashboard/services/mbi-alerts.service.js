import { apiClient } from "../../../shared/api/httpClient";

export const getMyBurnoutAlertsApi = async () => {
  const response = await apiClient.get("/mbi/alerts/my");
  return response.data;
};

export const markBurnoutAlertAsReadApi = async (alertId) => {
  const response = await apiClient.patch(`/mbi/alerts/${alertId}/read`);
  return response.data;
};
