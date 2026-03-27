import { create } from "zustand";
import { softDeleteUserService } from "../services/users-management.service";
import { useDashboardUsersStore } from "./dashboard-users.store";
import { createAutoDismissNotice } from "../../../shared/lib/autoDismissNotice";
import {
  getTeacherByIdApi,
  getTeachersListApi,
  registerTeacherApi,
} from "../services/teachers.service";
import {
  clearSessionCache,
  readSessionCacheWithMeta,
  writeSessionCache,
} from "../../../shared/lib/sessionCache";

const teacherNoticeDismiss = createAutoDismissNotice(5500);
const DASHBOARD_TEACHERS_CACHE_KEY = "cielp_dashboard_teachers_cache_v1";
const DASHBOARD_TEACHERS_CACHE_TTL_MS = 4 * 60 * 1000;

const initialCacheEntry = readSessionCacheWithMeta(
  DASHBOARD_TEACHERS_CACHE_KEY,
  DASHBOARD_TEACHERS_CACHE_TTL_MS,
);

const initialCache = initialCacheEntry?.payload || {};
const isInitialCacheStale = Boolean(initialCacheEntry?.isExpired);

const persistTeachersCache = (partialPayload = {}) => {
  const currentCache =
    readSessionCacheWithMeta(
      DASHBOARD_TEACHERS_CACHE_KEY,
      DASHBOARD_TEACHERS_CACHE_TTL_MS,
    )?.payload || {};

  writeSessionCache(DASHBOARD_TEACHERS_CACHE_KEY, {
    ...currentCache,
    ...partialPayload,
  });
};

const normalizeErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback ||
  "No fue posible completar la solicitud.";

export const useDashboardTeachersStore = create((set, get) => ({
  teachers: Array.isArray(initialCache?.teachers) ? initialCache.teachers : [],
  isLoadingTeachers: false,
  teachersError: null,
  hasLoadedTeachers: Array.isArray(initialCache?.teachers),

  selectedTeacherId: "",
  selectedTeacherProfile: initialCache?.selectedTeacherProfile || null,
  isLoadingSelectedTeacherProfile: false,
  selectedTeacherProfileError: null,
  isModuleCacheStale: isInitialCacheStale,

  isRegisteringTeacher: false,
  registerTeacherError: null,
  registerTeacherSuccessMessage: null,

  isDeletingTeacher: false,
  deleteTeacherError: null,
  deleteTeacherSuccessMessage: null,

  setSelectedTeacherId: (teacherId) =>
    set({
      selectedTeacherId: teacherId || "",
      selectedTeacherProfileError: null,
    }),

  fetchTeachers: async ({ force = false } = {}) => {
    if (get().isLoadingTeachers) {
      return;
    }

    if (get().hasLoadedTeachers && !force && !get().isModuleCacheStale) {
      return;
    }

    const hasCachedData = get().hasLoadedTeachers;

    set({
      isLoadingTeachers: hasCachedData ? false : true,
      teachersError: null,
    });

    try {
      const response = await getTeachersListApi();

      set({
        teachers: Array.isArray(response) ? response : [],
        isLoadingTeachers: false,
        teachersError: null,
        hasLoadedTeachers: true,
        isModuleCacheStale: false,
      });

      persistTeachersCache({
        teachers: Array.isArray(response) ? response : [],
      });
    } catch (error) {
      set({
        isLoadingTeachers: false,
        teachersError: normalizeErrorMessage(
          error,
          "No fue posible obtener el listado de docentes.",
        ),
      });
    }
  },

  fetchTeacherById: async (teacherId) => {
    const effectiveTeacherId = teacherId || get().selectedTeacherId;

    if (!effectiveTeacherId || get().isLoadingSelectedTeacherProfile) {
      return;
    }

    set({
      selectedTeacherId: effectiveTeacherId,
      isLoadingSelectedTeacherProfile: true,
      selectedTeacherProfileError: null,
    });

    try {
      const response = await getTeacherByIdApi(effectiveTeacherId);

      set({
        selectedTeacherProfile: response || null,
        isLoadingSelectedTeacherProfile: false,
        selectedTeacherProfileError: null,
        isModuleCacheStale: false,
      });

      persistTeachersCache({ selectedTeacherProfile: response || null });
    } catch (error) {
      set({
        selectedTeacherProfile: null,
        isLoadingSelectedTeacherProfile: false,
        selectedTeacherProfileError: normalizeErrorMessage(
          error,
          "No fue posible obtener el detalle del docente.",
        ),
      });
    }
  },

  registerTeacherFromDashboard: async (userData) => {
    if (get().isRegisteringTeacher) {
      return { ok: false };
    }

    set({
      isRegisteringTeacher: true,
      registerTeacherError: null,
      registerTeacherSuccessMessage: null,
    });

    try {
      const response = await registerTeacherApi(userData);

      const message =
        response?.message ||
        "Docente registrado correctamente. Debe verificar su correo.";

      set({
        isRegisteringTeacher: false,
        registerTeacherError: null,
        registerTeacherSuccessMessage: message,
        isModuleCacheStale: true,
      });

      teacherNoticeDismiss.schedule(() => {
        set({
          registerTeacherError: null,
          registerTeacherSuccessMessage: null,
        });
      });

      await get().fetchTeachers({ force: true });

      return { ok: true, message };
    } catch (error) {
      const message = normalizeErrorMessage(
        error,
        "No fue posible registrar el docente.",
      );

      set({
        isRegisteringTeacher: false,
        registerTeacherError: message,
        registerTeacherSuccessMessage: null,
      });

      teacherNoticeDismiss.schedule(() => {
        set({
          registerTeacherError: null,
          registerTeacherSuccessMessage: null,
        });
      });

      return { ok: false, message };
    }
  },

  softDeleteTeacherById: async (teacherId) => {
    if (!teacherId || get().isDeletingTeacher) {
      return { ok: false };
    }

    set({
      isDeletingTeacher: true,
      deleteTeacherError: null,
      deleteTeacherSuccessMessage: null,
    });

    try {
      const response = await softDeleteUserService(teacherId);
      const message =
        response?.message || "Docente enviado a papelera correctamente.";

      set({
        isDeletingTeacher: false,
        deleteTeacherError: null,
        deleteTeacherSuccessMessage: message,
        selectedTeacherId:
          get().selectedTeacherId === teacherId ? "" : get().selectedTeacherId,
        selectedTeacherProfile:
          get().selectedTeacherId === teacherId
            ? null
            : get().selectedTeacherProfile,
        isModuleCacheStale: true,
      });

      teacherNoticeDismiss.schedule(() => {
        set({ deleteTeacherError: null, deleteTeacherSuccessMessage: null });
      });

      await get().fetchTeachers({ force: true });
      await useDashboardUsersStore.getState().fetchTrashUsers({ force: true });

      return { ok: true, message };
    } catch (error) {
      const message = normalizeErrorMessage(
        error,
        "No fue posible eliminar el docente.",
      );

      set({
        isDeletingTeacher: false,
        deleteTeacherError: message,
        deleteTeacherSuccessMessage: null,
      });

      teacherNoticeDismiss.schedule(() => {
        set({ deleteTeacherError: null, deleteTeacherSuccessMessage: null });
      });

      return { ok: false, message };
    }
  },

  clearRegisterTeacherStatus: () =>
    set({
      registerTeacherError: null,
      registerTeacherSuccessMessage: null,
      deleteTeacherError: null,
      deleteTeacherSuccessMessage: null,
    }),

  clearTeachersModuleCache: () => {
    clearSessionCache(DASHBOARD_TEACHERS_CACHE_KEY);
    set({
      hasLoadedTeachers: false,
      isModuleCacheStale: true,
    });
  },
}));
