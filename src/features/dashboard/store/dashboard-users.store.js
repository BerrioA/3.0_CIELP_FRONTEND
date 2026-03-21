import { create } from "zustand";
import {
  changeUserPasswordService,
  getInstitutionalUsersService,
  getUsersTrashService,
  getMyAdditionalInformationService,
  permanentDeleteUserService,
  registerAdditionalInformationService,
  registerAdminService,
  registerPsychologistService,
  restoreUserService,
  softDeleteUserService,
  updateUserService,
} from "../services/users-management.service";
import { createAutoDismissNotice } from "../../../shared/lib/autoDismissNotice";

const registerUserNoticeDismiss = createAutoDismissNotice(5500);
const userActionNoticeDismiss = createAutoDismissNotice(5500);
const additionalInfoNoticeDismiss = createAutoDismissNotice(5500);

const normalizeErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  "No fue posible completar la solicitud.";

export const useDashboardUsersStore = create((set, get) => ({
  users: [],
  isLoadingUsers: false,
  usersError: null,
  hasLoadedUsers: false,
  isRegisteringUser: false,
  registerUserError: null,
  registerUserSuccessMessage: null,

  trashUsers: [],
  isLoadingTrashUsers: false,
  trashUsersError: null,
  hasLoadedTrashUsers: false,

  isProcessingUserAction: false,
  userActionError: null,
  userActionSuccessMessage: null,

  isRegisteringAdditionalInformation: false,
  registerAdditionalInformationError: null,
  registerAdditionalInformationSuccessMessage: null,
  myAdditionalInformation: null,
  isLoadingMyAdditionalInformation: false,
  myAdditionalInformationError: null,
  hasLoadedMyAdditionalInformation: false,

  fetchUsers: async ({ force = false } = {}) => {
    if (get().isLoadingUsers) {
      return;
    }

    if (get().hasLoadedUsers && !force) {
      return;
    }

    set({
      isLoadingUsers: true,
      usersError: null,
    });

    try {
      const response = await getInstitutionalUsersService();
      set({
        users: Array.isArray(response) ? response : [],
        isLoadingUsers: false,
        usersError: null,
        hasLoadedUsers: true,
      });
    } catch (error) {
      set({
        isLoadingUsers: false,
        usersError: normalizeErrorMessage(error),
      });
    }
  },

  fetchTrashUsers: async ({ force = false } = {}) => {
    if (get().isLoadingTrashUsers) {
      return;
    }

    if (get().hasLoadedTrashUsers && !force) {
      return;
    }

    set({
      isLoadingTrashUsers: true,
      trashUsersError: null,
    });

    try {
      const response = await getUsersTrashService();
      set({
        trashUsers: Array.isArray(response) ? response : [],
        isLoadingTrashUsers: false,
        trashUsersError: null,
        hasLoadedTrashUsers: true,
      });
    } catch (error) {
      set({
        isLoadingTrashUsers: false,
        trashUsersError: normalizeErrorMessage(error),
      });
    }
  },

  registerInstitutionalUser: async ({ roleTarget, userData }) => {
    if (get().isRegisteringUser) {
      return { ok: false };
    }

    set({
      isRegisteringUser: true,
      registerUserError: null,
      registerUserSuccessMessage: null,
    });

    try {
      const response =
        roleTarget === "admin"
          ? await registerAdminService(userData)
          : await registerPsychologistService(userData);

      set({
        isRegisteringUser: false,
        registerUserError: null,
        registerUserSuccessMessage:
          response?.message || "Usuario registrado correctamente.",
      });

      registerUserNoticeDismiss.schedule(() => {
        set({ registerUserError: null, registerUserSuccessMessage: null });
      });

      await get().fetchUsers({ force: true });
      await get().fetchTrashUsers({ force: true });

      return {
        ok: true,
        message: response?.message || "Usuario registrado correctamente.",
      };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isRegisteringUser: false,
        registerUserError: message,
        registerUserSuccessMessage: null,
      });

      registerUserNoticeDismiss.schedule(() => {
        set({ registerUserError: null, registerUserSuccessMessage: null });
      });

      return { ok: false, message };
    }
  },

  updateUserById: async ({ userId, dataUserUpdate }) => {
    if (get().isProcessingUserAction) {
      return { ok: false };
    }

    set({
      isProcessingUserAction: true,
      userActionError: null,
      userActionSuccessMessage: null,
    });

    try {
      const response = await updateUserService({ userId, dataUserUpdate });

      set({
        isProcessingUserAction: false,
        userActionError: null,
        userActionSuccessMessage:
          response?.message || "Usuario actualizado correctamente.",
      });

      userActionNoticeDismiss.schedule(() => {
        set({ userActionError: null, userActionSuccessMessage: null });
      });

      await get().fetchUsers({ force: true });

      return { ok: true, message: response?.message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isProcessingUserAction: false,
        userActionError: message,
        userActionSuccessMessage: null,
      });

      userActionNoticeDismiss.schedule(() => {
        set({ userActionError: null, userActionSuccessMessage: null });
      });

      return { ok: false, message };
    }
  },

  changeUserPasswordById: async ({ userId, oldPassword, newPassword }) => {
    if (get().isProcessingUserAction) {
      return { ok: false };
    }

    set({
      isProcessingUserAction: true,
      userActionError: null,
      userActionSuccessMessage: null,
    });

    try {
      const response = await changeUserPasswordService({
        userId,
        oldPassword,
        newPassword,
      });

      set({
        isProcessingUserAction: false,
        userActionError: null,
        userActionSuccessMessage:
          response?.message || "Contraseña actualizada correctamente.",
      });

      userActionNoticeDismiss.schedule(() => {
        set({ userActionError: null, userActionSuccessMessage: null });
      });

      return { ok: true, message: response?.message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isProcessingUserAction: false,
        userActionError: message,
        userActionSuccessMessage: null,
      });

      userActionNoticeDismiss.schedule(() => {
        set({ userActionError: null, userActionSuccessMessage: null });
      });

      return { ok: false, message };
    }
  },

  softDeleteUserById: async ({ userId, currentPassword = "" }) => {
    if (get().isProcessingUserAction) {
      return { ok: false };
    }

    set({
      isProcessingUserAction: true,
      userActionError: null,
      userActionSuccessMessage: null,
    });

    try {
      const response = await softDeleteUserService({
        userId,
        currentPassword,
      });

      set({
        isProcessingUserAction: false,
        userActionError: null,
        userActionSuccessMessage:
          response?.message || "Usuario enviado a papelera correctamente.",
      });

      userActionNoticeDismiss.schedule(() => {
        set({ userActionError: null, userActionSuccessMessage: null });
      });

      await get().fetchUsers({ force: true });
      await get().fetchTrashUsers({ force: true });

      return { ok: true, message: response?.message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isProcessingUserAction: false,
        userActionError: message,
        userActionSuccessMessage: null,
      });

      userActionNoticeDismiss.schedule(() => {
        set({ userActionError: null, userActionSuccessMessage: null });
      });

      return { ok: false, message };
    }
  },

  restoreUserById: async (userId) => {
    if (get().isProcessingUserAction) {
      return { ok: false };
    }

    set({
      isProcessingUserAction: true,
      userActionError: null,
      userActionSuccessMessage: null,
    });

    try {
      const response = await restoreUserService(userId);

      set({
        isProcessingUserAction: false,
        userActionError: null,
        userActionSuccessMessage:
          response?.message || "Usuario restaurado correctamente.",
      });

      userActionNoticeDismiss.schedule(() => {
        set({ userActionError: null, userActionSuccessMessage: null });
      });

      await get().fetchUsers({ force: true });
      await get().fetchTrashUsers({ force: true });

      return { ok: true, message: response?.message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isProcessingUserAction: false,
        userActionError: message,
        userActionSuccessMessage: null,
      });

      userActionNoticeDismiss.schedule(() => {
        set({ userActionError: null, userActionSuccessMessage: null });
      });

      return { ok: false, message };
    }
  },

  permanentDeleteUserById: async (userId) => {
    if (get().isProcessingUserAction) {
      return { ok: false };
    }

    set({
      isProcessingUserAction: true,
      userActionError: null,
      userActionSuccessMessage: null,
    });

    try {
      const response = await permanentDeleteUserService(userId);

      set({
        isProcessingUserAction: false,
        userActionError: null,
        userActionSuccessMessage:
          response?.message || "Usuario eliminado permanentemente.",
      });

      userActionNoticeDismiss.schedule(() => {
        set({ userActionError: null, userActionSuccessMessage: null });
      });

      await get().fetchTrashUsers({ force: true });
      await get().fetchUsers({ force: true });

      return { ok: true, message: response?.message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isProcessingUserAction: false,
        userActionError: message,
        userActionSuccessMessage: null,
      });

      userActionNoticeDismiss.schedule(() => {
        set({ userActionError: null, userActionSuccessMessage: null });
      });

      return { ok: false, message };
    }
  },

  registerAdditionalInformation: async (additionalInformation) => {
    if (get().isRegisteringAdditionalInformation) {
      return { ok: false };
    }

    set({
      isRegisteringAdditionalInformation: true,
      registerAdditionalInformationError: null,
      registerAdditionalInformationSuccessMessage: null,
    });

    try {
      const response = await registerAdditionalInformationService(
        additionalInformation,
      );

      set({
        isRegisteringAdditionalInformation: false,
        registerAdditionalInformationError: null,
        registerAdditionalInformationSuccessMessage:
          response?.message ||
          "Información adicional registrada correctamente.",
        hasLoadedMyAdditionalInformation: false,
      });

      additionalInfoNoticeDismiss.schedule(() => {
        set({
          registerAdditionalInformationError: null,
          registerAdditionalInformationSuccessMessage: null,
        });
      });

      return { ok: true, message: response?.message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isRegisteringAdditionalInformation: false,
        registerAdditionalInformationError: message,
        registerAdditionalInformationSuccessMessage: null,
      });

      additionalInfoNoticeDismiss.schedule(() => {
        set({
          registerAdditionalInformationError: null,
          registerAdditionalInformationSuccessMessage: null,
        });
      });

      return { ok: false, message };
    }
  },

  fetchMyAdditionalInformation: async ({ force = false } = {}) => {
    if (get().isLoadingMyAdditionalInformation) {
      return;
    }

    if (get().hasLoadedMyAdditionalInformation && !force) {
      return;
    }

    set({
      isLoadingMyAdditionalInformation: true,
      myAdditionalInformationError: null,
    });

    try {
      const response = await getMyAdditionalInformationService();

      set({
        myAdditionalInformation: response?.data || null,
        isLoadingMyAdditionalInformation: false,
        myAdditionalInformationError: null,
        hasLoadedMyAdditionalInformation: true,
      });
    } catch (error) {
      set({
        isLoadingMyAdditionalInformation: false,
        myAdditionalInformationError: normalizeErrorMessage(error),
      });
    }
  },

  clearRegisterStatus: () =>
    set({
      registerUserError: null,
      registerUserSuccessMessage: null,
    }),

  clearUserActionStatus: () =>
    set({
      userActionError: null,
      userActionSuccessMessage: null,
    }),

  clearAdditionalInformationStatus: () =>
    set({
      registerAdditionalInformationError: null,
      registerAdditionalInformationSuccessMessage: null,
    }),
}));
