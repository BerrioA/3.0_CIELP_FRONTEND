import { create } from "zustand";
import {
  getMyPreferencesService,
  updateMyPreferencesService,
} from "../services/preferences.service";
import { useThemeStore } from "../../../app/store/theme.store";
import { createAutoDismissNotice } from "../../../shared/lib/autoDismissNotice";
import {
  clearSessionCache,
  readSessionCache,
  writeSessionCache,
} from "../../../shared/lib/sessionCache";

const preferencesNoticeDismiss = createAutoDismissNotice(5500);
const DASHBOARD_PREFERENCES_CACHE_KEY = "cielp_dashboard_preferences_cache_v1";
const DASHBOARD_PREFERENCES_CACHE_TTL_MS = 15 * 60 * 1000;

const DEFAULT_PREFERENCES = {
  email_notifications_enabled: true,
  security_events_notifications_enabled: true,
  compact_dashboard_mode_enabled: false,
  dark_mode_enabled: false,
};

const readPreferencesCache = () =>
  readSessionCache(
    DASHBOARD_PREFERENCES_CACHE_KEY,
    DASHBOARD_PREFERENCES_CACHE_TTL_MS,
  );

const persistPreferencesCache = ({ preferences, userUid }) => {
  writeSessionCache(DASHBOARD_PREFERENCES_CACHE_KEY, {
    preferences,
    userUid,
  });
};

const initialCache = readPreferencesCache() || {};

const normalizeErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  "No fue posible gestionar las preferencias.";

export const useDashboardPreferencesStore = create((set, get) => ({
  preferences: {
    ...DEFAULT_PREFERENCES,
    ...(initialCache?.preferences || {}),
  },
  loadedForUserUid: initialCache?.userUid || null,
  hasLoadedPreferences: Boolean(initialCache?.userUid),
  isLoadingPreferences: false,
  isSavingPreferences: false,
  preferencesError: null,
  preferencesSuccessMessage: null,

  resetPreferences: () => {
    preferencesNoticeDismiss.clear();
    clearSessionCache(DASHBOARD_PREFERENCES_CACHE_KEY);

    set({
      preferences: DEFAULT_PREFERENCES,
      loadedForUserUid: null,
      hasLoadedPreferences: false,
      isLoadingPreferences: false,
      isSavingPreferences: false,
      preferencesError: null,
      preferencesSuccessMessage: null,
    });

    useThemeStore.getState().applyDarkModePreference(false);
  },

  setLocalPreference: (key, value) => {
    preferencesNoticeDismiss.clear();

    set((state) => ({
      preferences: {
        ...state.preferences,
        [key]: value,
      },
      preferencesSuccessMessage: null,
    }));

    persistPreferencesCache({
      preferences: {
        ...get().preferences,
        [key]: value,
      },
      userUid: get().loadedForUserUid,
    });

    if (key === "dark_mode_enabled") {
      useThemeStore.getState().applyDarkModePreference(Boolean(value));
    }
  },

  fetchPreferences: async ({ force = false, userUid = null } = {}) => {
    if (get().isLoadingPreferences) {
      return;
    }

    const isSameUser = get().loadedForUserUid === userUid;

    if (get().hasLoadedPreferences && isSameUser && !force) {
      return;
    }

    set({
      isLoadingPreferences: true,
      preferencesError: null,
      preferencesSuccessMessage: null,
    });

    try {
      const response = await getMyPreferencesService();
      const fetchedPreferences = {
        ...DEFAULT_PREFERENCES,
        ...(response?.data || {}),
      };

      set({
        preferences: fetchedPreferences,
        loadedForUserUid: userUid,
        hasLoadedPreferences: true,
        isLoadingPreferences: false,
        preferencesError: null,
      });

      persistPreferencesCache({
        preferences: fetchedPreferences,
        userUid,
      });

      useThemeStore
        .getState()
        .applyDarkModePreference(fetchedPreferences.dark_mode_enabled);
    } catch (error) {
      set({
        isLoadingPreferences: false,
        preferencesError: normalizeErrorMessage(error),
      });

      preferencesNoticeDismiss.schedule(() => {
        set({ preferencesError: null });
      });
    }
  },

  savePreferences: async () => {
    if (get().isSavingPreferences) {
      return { ok: false };
    }

    set({
      isSavingPreferences: true,
      preferencesError: null,
      preferencesSuccessMessage: null,
    });

    try {
      const response = await updateMyPreferencesService(get().preferences);
      const updatedPreferences = {
        ...DEFAULT_PREFERENCES,
        ...(response?.data || {}),
      };

      set({
        preferences: updatedPreferences,
        hasLoadedPreferences: true,
        isSavingPreferences: false,
        preferencesError: null,
        preferencesSuccessMessage:
          response?.message || "Preferencias actualizadas correctamente.",
      });

      persistPreferencesCache({
        preferences: updatedPreferences,
        userUid: get().loadedForUserUid,
      });

      preferencesNoticeDismiss.schedule(() => {
        set({ preferencesError: null, preferencesSuccessMessage: null });
      });

      useThemeStore
        .getState()
        .applyDarkModePreference(updatedPreferences.dark_mode_enabled);

      return { ok: true, message: response?.message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isSavingPreferences: false,
        preferencesError: message,
      });

      preferencesNoticeDismiss.schedule(() => {
        set({ preferencesError: null, preferencesSuccessMessage: null });
      });

      return { ok: false, message };
    }
  },
}));
