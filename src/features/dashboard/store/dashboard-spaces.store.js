import { create } from "zustand";
import {
  endSpaceSessionApi,
  getDigitalSpacesApi,
  getMyActiveSpaceSessionApi,
  getSpaceMoodHistoryApi,
  getMySpaceStatsApi,
  startSpaceSessionApi,
} from "../services/spaces.service";

const ACTIVE_SPACE_SESSION_KEY = "cielp_active_space_session";

const normalizeErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.response?.data?.errors?.[0]?.msg ||
  fallback ||
  "No fue posible completar la solicitud.";

const normalizeSpaceTypeLabel = (type) => {
  const labels = {
    sonido_ambiental: "Sonido ambiental",
    meditacion_guiada: "Meditacion guiada",
    ejercicio_respiracion: "Ejercicio de respiracion",
  };

  return labels[type] || type || "Sin tipo";
};

const normalizeSpace = (space = {}) => ({
  id: space.id,
  name: space.name || "Espacio sin nombre",
  description: space.description || "Sin descripcion",
  type: space.type || null,
  typeLabel: normalizeSpaceTypeLabel(space.type),
  thumbnail_url: space.thumbnail_url || "",
  video_url: space.video_url || "",
});

const normalizeWeeklyEvolution = (weeklyEvolutionPayload) => {
  if (!Array.isArray(weeklyEvolutionPayload)) {
    return [];
  }

  return weeklyEvolutionPayload.map((item) => ({
    week_start: item?.week_start || null,
    week_label: item?.week_label || "Semana",
    total_minutes: Number(item?.total_minutes) || 0,
    sessions_count: Number(item?.sessions_count) || 0,
  }));
};

const normalizeActiveSession = (sessionPayload = {}) => {
  if (!sessionPayload || !sessionPayload.session_id) {
    return null;
  }

  return {
    session_id: sessionPayload.session_id,
    space_id: sessionPayload.space_id || null,
    started_at: sessionPayload.started_at || null,
    space: sessionPayload.space
      ? {
          id: sessionPayload.space.id || null,
          name: sessionPayload.space.name || "",
          type: sessionPayload.space.type || null,
          thumbnail_url: sessionPayload.space.thumbnail_url || "",
          video_url: sessionPayload.space.video_url || "",
        }
      : null,
  };
};

const persistActiveSession = (activeSession, userUid) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!activeSession || !userUid) {
    window.localStorage.removeItem(ACTIVE_SPACE_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(
    ACTIVE_SPACE_SESSION_KEY,
    JSON.stringify({ userUid, activeSession }),
  );
};

const readPersistedActiveSession = (userUid) => {
  if (typeof window === "undefined" || !userUid) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(ACTIVE_SPACE_SESSION_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    if (parsed?.userUid !== userUid) {
      return null;
    }

    return normalizeActiveSession(parsed?.activeSession);
  } catch {
    return null;
  }
};

const normalizeStats = (payload = {}) => {
  const overview = payload?.overview || {};
  const recentHistoryPayload = Array.isArray(payload?.recent_history)
    ? payload.recent_history
    : [];

  const recentHistory = recentHistoryPayload.map((session) => ({
    id: session?.id || null,
    space_id: session?.digital_space?.id || null,
    started_at: session?.started_at || null,
    ended_at: session?.ended_at || null,
    duration_seconds: Number(session?.duration_seconds) || 0,
    status: session?.status || "unknown",
    space_name: session?.digital_space?.name || "Espacio no disponible",
    space_type: session?.digital_space?.type || null,
    space_type_label: normalizeSpaceTypeLabel(session?.digital_space?.type),
    space_thumbnail_url: session?.digital_space?.thumbnail_url || "",
  }));

  return {
    overview: {
      total_sessions: Number(overview?.total_sessions) || 0,
      total_minutes_meditated: Number(overview?.total_minutes_meditated) || 0,
      favorite_space: overview?.favorite_space || "Aún no hay datos",
    },
    recent_history: recentHistory,
    weekly_evolution: normalizeWeeklyEvolution(payload?.weekly_evolution),
  };
};

export const useDashboardSpacesStore = create((set, get) => ({
  spaces: [],
  isLoadingSpaces: false,
  spacesError: null,
  hasLoadedSpaces: false,

  teacherStats: {
    overview: {
      total_sessions: 0,
      total_minutes_meditated: 0,
      favorite_space: "Aún no hay datos",
    },
    recent_history: [],
  },
  isLoadingTeacherStats: false,
  teacherStatsError: null,
  hasLoadedTeacherStats: false,

  moodHistoryBySpace: {
    summary: [],
    weekly_mood_trend: [],
    recent_logs: [],
    metadata: null,
  },
  isLoadingMoodHistoryBySpace: false,
  moodHistoryBySpaceError: null,
  hasLoadedMoodHistoryBySpace: false,

  hydratedActiveSessionForUid: null,

  activeSession: null,
  isStartingSession: false,
  isEndingSession: false,
  sessionActionError: null,
  sessionActionSuccessMessage: null,
  lastCompletedSession: null,

  fetchActiveSession: async ({ force = false, userUid = null } = {}) => {
    if (!userUid) {
      return;
    }

    const hasHydratedSameUser = get().hydratedActiveSessionForUid === userUid;
    if (hasHydratedSameUser && !force) {
      return;
    }

    const persistedSession = readPersistedActiveSession(userUid);
    if (persistedSession) {
      set({
        activeSession: persistedSession,
      });
    }

    try {
      const response = await getMyActiveSpaceSessionApi();
      const nextActiveSession = normalizeActiveSession(response?.data);

      persistActiveSession(nextActiveSession, userUid);

      set({
        activeSession: nextActiveSession,
        hydratedActiveSessionForUid: userUid,
      });
    } catch {
      persistActiveSession(null, userUid);
      set({
        activeSession: null,
        hydratedActiveSessionForUid: userUid,
      });
    }
  },

  fetchSpaces: async ({ force = false } = {}) => {
    if (get().isLoadingSpaces) {
      return;
    }

    if (get().hasLoadedSpaces && !force) {
      return;
    }

    set({
      isLoadingSpaces: true,
      spacesError: null,
    });

    try {
      const response = await getDigitalSpacesApi();
      const spaces = Array.isArray(response?.data)
        ? response.data.map((space) => normalizeSpace(space))
        : [];

      set({
        spaces,
        isLoadingSpaces: false,
        spacesError: null,
        hasLoadedSpaces: true,
      });
    } catch (error) {
      set({
        isLoadingSpaces: false,
        spacesError: normalizeErrorMessage(
          error,
          "No fue posible obtener el catálogo de espacios.",
        ),
      });
    }
  },

  fetchTeacherStats: async ({ force = false } = {}) => {
    if (get().isLoadingTeacherStats) {
      return;
    }

    if (get().hasLoadedTeacherStats && !force) {
      return;
    }

    set({
      isLoadingTeacherStats: true,
      teacherStatsError: null,
    });

    try {
      const response = await getMySpaceStatsApi();
      const normalizedStats = normalizeStats(response?.data || {});

      set({
        teacherStats: normalizedStats,
        isLoadingTeacherStats: false,
        teacherStatsError: null,
        hasLoadedTeacherStats: true,
      });
    } catch (error) {
      set({
        isLoadingTeacherStats: false,
        teacherStatsError: normalizeErrorMessage(
          error,
          "No fue posible obtener sus estadísticas de espacios.",
        ),
      });
    }
  },

  fetchMoodHistoryBySpace: async ({ force = false, days = 90 } = {}) => {
    if (get().isLoadingMoodHistoryBySpace) {
      return;
    }

    if (get().hasLoadedMoodHistoryBySpace && !force) {
      return;
    }

    set({
      isLoadingMoodHistoryBySpace: true,
      moodHistoryBySpaceError: null,
    });

    try {
      const response = await getSpaceMoodHistoryApi({ days });

      set({
        moodHistoryBySpace: {
          summary: Array.isArray(response?.data?.summary)
            ? response.data.summary
            : [],
          weekly_mood_trend: Array.isArray(response?.data?.weekly_mood_trend)
            ? response.data.weekly_mood_trend
            : [],
          recent_logs: Array.isArray(response?.data?.recent_logs)
            ? response.data.recent_logs
            : [],
          metadata: response?.data?.metadata || null,
        },
        isLoadingMoodHistoryBySpace: false,
        moodHistoryBySpaceError: null,
        hasLoadedMoodHistoryBySpace: true,
      });
    } catch (error) {
      set({
        isLoadingMoodHistoryBySpace: false,
        moodHistoryBySpaceError: normalizeErrorMessage(
          error,
          "No fue posible obtener el histórico de mood por espacio.",
        ),
      });
    }
  },

  startSession: async (spaceId) => {
    if (!spaceId || get().isStartingSession || get().isEndingSession) {
      return { ok: false };
    }

    set({
      isStartingSession: true,
      sessionActionError: null,
      sessionActionSuccessMessage: null,
      lastCompletedSession: null,
    });

    try {
      const response = await startSpaceSessionApi(spaceId);
      const sessionData = response?.data || {};

      set({
        activeSession: {
          session_id: sessionData.session_id,
          space_id: spaceId,
          started_at: sessionData.started_at || new Date().toISOString(),
          space: null,
        },
        isStartingSession: false,
        sessionActionError: null,
        sessionActionSuccessMessage:
          response?.message || "Sesión iniciada correctamente.",
      });

      const currentUserUid = get().hydratedActiveSessionForUid;
      if (currentUserUid) {
        persistActiveSession(get().activeSession, currentUserUid);
      }

      return { ok: true, data: sessionData };
    } catch (error) {
      const message = normalizeErrorMessage(
        error,
        "No fue posible iniciar la sesión del espacio.",
      );

      set({
        isStartingSession: false,
        sessionActionError: message,
      });

      return { ok: false, message };
    }
  },

  endSession: async ({ sessionId, moodScore }) => {
    const effectiveSessionId = sessionId || get().activeSession?.session_id;

    if (
      !effectiveSessionId ||
      get().isEndingSession ||
      get().isStartingSession
    ) {
      return { ok: false };
    }

    set({
      isEndingSession: true,
      sessionActionError: null,
      sessionActionSuccessMessage: null,
    });

    try {
      const response = await endSpaceSessionApi({
        sessionId: effectiveSessionId,
        moodScore,
      });
      const sessionData = response?.data || {};

      set({
        activeSession: null,
        isEndingSession: false,
        sessionActionError: null,
        sessionActionSuccessMessage:
          response?.message || "Sesión finalizada correctamente.",
        lastCompletedSession: {
          session_id: sessionData.session_id,
          duration_seconds: Number(sessionData.duration_seconds) || 0,
          duration_minutes: Number(sessionData.duration_minutes) || 0,
          mood_score: Number(sessionData.mood_score) || null,
        },
        hasLoadedTeacherStats: false,
      });

      const currentUserUid = get().hydratedActiveSessionForUid;
      if (currentUserUid) {
        persistActiveSession(null, currentUserUid);
      }

      await get().fetchTeacherStats({ force: true });

      return { ok: true, data: sessionData };
    } catch (error) {
      const message = normalizeErrorMessage(
        error,
        "No fue posible finalizar la sesión del espacio.",
      );

      set({
        isEndingSession: false,
        sessionActionError: message,
      });

      return { ok: false, message };
    }
  },

  clearSessionFeedback: () =>
    set({
      sessionActionError: null,
      sessionActionSuccessMessage: null,
      lastCompletedSession: null,
    }),
}));
