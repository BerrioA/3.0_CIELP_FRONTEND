import { apiClient } from "../../../shared/api/httpClient";

export const getInstitutionalUsersService = async () => {
  const response = await apiClient.get("/users");
  return response.data;
};

export const registerPsychologistService = async (userData) => {
  const response = await apiClient.post("/users/psychologists", { userData });
  return response.data;
};

export const registerAdminService = async (userData) => {
  const response = await apiClient.post("/users/admins", { userData });
  return response.data;
};

export const getUsersTrashService = async () => {
  const response = await apiClient.get("/users/trash");
  return response.data;
};

export const updateUserService = async ({ userId, dataUserUpdate }) => {
  const response = await apiClient.patch(`/users/${userId}`, {
    dataUserUpdate,
  });
  return response.data;
};

export const changeUserPasswordService = async ({
  userId,
  oldPassword,
  newPassword,
}) => {
  const response = await apiClient.patch(`/users/${userId}/password`, {
    oldPassword,
    newPassword,
  });
  return response.data;
};

export const softDeleteUserService = async ({ userId, currentPassword }) => {
  const response = await apiClient.delete(`/users/${userId}`, {
    data: {
      currentPassword: currentPassword || "",
    },
  });
  return response.data;
};

export const restoreUserService = async (userId) => {
  const response = await apiClient.patch(`/users/${userId}/restore`);
  return response.data;
};

export const permanentDeleteUserService = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}/permanent`);
  return response.data;
};

export const registerAdditionalInformationService = async (
  additionalInformation,
) => {
  const response = await apiClient.post("/users/additional-information", {
    additionalInformation,
  });
  return response.data;
};

export const getMyAdditionalInformationService = async () => {
  const response = await apiClient.get("/users/me/additional-information");
  return response.data;
};
