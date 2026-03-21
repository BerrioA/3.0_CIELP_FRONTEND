import { create } from "zustand";
import {
  getMbiQuestionsApi,
  getMyMbiHistoryApi,
  getMyMbiProgressComparisonApi,
  getMyMbiRetestStatusApi,
  getTeacherByIdApi,
  getTeacherMbiHistoryApi,
  getTeachersApi,
  submitMbiTestApi,
} from "../services/mbi.service";

const normalizeErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback ||
  "No fue posible completar la solicitud.";

const normalizeSessionDate = (session = {}) => {
  const candidate = session.date ?? session.created_at ?? session.createdAt;

  if (!candidate) {
    return null;
  }

  const parsedDate = new Date(String(candidate));
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
};

const normalizeSessionScores = (scores = {}) => ({
  cansancio_emocional: Number(scores?.cansancio_emocional) || 0,
  despersonalizacion: Number(scores?.despersonalizacion) || 0,
  realizacion_personal: Number(scores?.realizacion_personal) || 0,
});

const normalizeRecommendations = (recommendations) => {
  if (!Array.isArray(recommendations)) {
    return [];
  }

  return recommendations.map((recommendation) => ({
    sintoma_detectado: recommendation?.sintoma_detectado || "Sin sintoma",
    espacio_sugerido: recommendation?.espacio_sugerido || "Sin sugerencia",
    motivo: recommendation?.motivo || "Sin detalle",
  }));
};

const normalizeMbiSession = (session = {}) => ({
  ...session,
  date: normalizeSessionDate(session),
  scores: normalizeSessionScores(session?.scores),
  diagnostico: session?.diagnostico || "Estado no disponible.",
  recomendaciones: normalizeRecommendations(session?.recomendaciones),
});

const normalizeMbiHistory = (historyPayload) => {
  if (!Array.isArray(historyPayload)) {
    return [];
  }

  return historyPayload.map((session) => normalizeMbiSession(session));
};

export const useDashboardMbiStore = create((set, get) => ({
  questions: [],
  isLoadingQuestions: false,
  questionsError: null,
  hasLoadedQuestions: false,

  myHistory: [],
  isLoadingMyHistory: false,
  myHistoryError: null,
  hasLoadedMyHistory: false,

  teachers: [],
  isLoadingTeachers: false,
  teachersError: null,
  hasLoadedTeachers: false,

  selectedTeacherId: "",
  selectedTeacherProfile: null,
  selectedTeacherHistory: [],
  isLoadingSelectedTeacherProfile: false,
  isLoadingSelectedTeacherHistory: false,
  selectedTeacherProfileError: null,
  selectedTeacherHistoryError: null,

  isSubmittingMbiTest: false,
  submitMbiTestError: null,
  submitMbiTestSuccessMessage: null,
  lastMbiResult: null,

  mbiRetestStatus: null,
  isLoadingMbiRetestStatus: false,
  mbiRetestStatusError: null,

  mbiProgressComparison: null,
  isLoadingMbiProgressComparison: false,
  mbiProgressComparisonError: null,

  setSelectedTeacherId: (teacherId) =>
    set({
      selectedTeacherId: teacherId || "",
      selectedTeacherProfile: null,
      selectedTeacherProfileError: null,
      selectedTeacherHistoryError: null,
    }),

  fetchSelectedTeacherProfile: async (teacherId) => {
    const effectiveTeacherId = teacherId || get().selectedTeacherId;

    if (!effectiveTeacherId || get().isLoadingSelectedTeacherProfile) {
      return;
    }

    set({
      isLoadingSelectedTeacherProfile: true,
      selectedTeacherProfileError: null,
      selectedTeacherId: effectiveTeacherId,
    });

    try {
      const response = await getTeacherByIdApi(effectiveTeacherId);

      set({
        selectedTeacherProfile: response || null,
        isLoadingSelectedTeacherProfile: false,
        selectedTeacherProfileError: null,
      });
    } catch (error) {
      set({
        selectedTeacherProfile: null,
        isLoadingSelectedTeacherProfile: false,
        selectedTeacherProfileError: normalizeErrorMessage(
          error,
          "No fue posible obtener el perfil del docente seleccionado.",
        ),
      });
    }
  },

  fetchQuestions: async ({ force = false } = {}) => {
    if (get().isLoadingQuestions) {
      return;
    }

    if (get().hasLoadedQuestions && !force) {
      return;
    }

    set({
      isLoadingQuestions: true,
      questionsError: null,
    });

    try {
      const response = await getMbiQuestionsApi();
      set({
        questions: Array.isArray(response?.data) ? response.data : [],
        isLoadingQuestions: false,
        questionsError: null,
        hasLoadedQuestions: true,
      });
    } catch (error) {
      set({
        isLoadingQuestions: false,
        questionsError: normalizeErrorMessage(
          error,
          "No fue posible obtener las preguntas MBI.",
        ),
      });
    }
  },

  fetchMyHistory: async ({ force = false } = {}) => {
    if (get().isLoadingMyHistory) {
      return;
    }

    if (get().hasLoadedMyHistory && !force) {
      return;
    }

    set({
      isLoadingMyHistory: true,
      myHistoryError: null,
    });

    try {
      const response = await getMyMbiHistoryApi();
      const normalizedHistory = normalizeMbiHistory(response?.data);

      set({
        myHistory: normalizedHistory,
        isLoadingMyHistory: false,
        myHistoryError: null,
        hasLoadedMyHistory: true,
      });
    } catch (error) {
      set({
        isLoadingMyHistory: false,
        myHistoryError: normalizeErrorMessage(
          error,
          "No fue posible obtener tu historial MBI.",
        ),
      });
    }
  },

  fetchTeachers: async ({ force = false } = {}) => {
    if (get().isLoadingTeachers) {
      return;
    }

    if (get().hasLoadedTeachers && !force) {
      return;
    }

    set({
      isLoadingTeachers: true,
      teachersError: null,
    });

    try {
      const response = await getTeachersApi();
      set({
        teachers: Array.isArray(response) ? response : [],
        isLoadingTeachers: false,
        teachersError: null,
        hasLoadedTeachers: true,
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

  fetchSelectedTeacherHistory: async (teacherId) => {
    const effectiveTeacherId = teacherId || get().selectedTeacherId;

    if (!effectiveTeacherId || get().isLoadingSelectedTeacherHistory) {
      return;
    }

    set({
      isLoadingSelectedTeacherHistory: true,
      selectedTeacherHistoryError: null,
      selectedTeacherId: effectiveTeacherId,
    });

    try {
      const response = await getTeacherMbiHistoryApi(effectiveTeacherId);
      const normalizedHistory = normalizeMbiHistory(response?.data);

      set({
        selectedTeacherHistory: normalizedHistory,
        isLoadingSelectedTeacherHistory: false,
        selectedTeacherHistoryError: null,
      });
    } catch (error) {
      set({
        isLoadingSelectedTeacherHistory: false,
        selectedTeacherHistoryError: normalizeErrorMessage(
          error,
          "No fue posible obtener el historial del docente seleccionado.",
        ),
      });
    }
  },

  submitMbiTest: async ({ answers }) => {
    if (get().isSubmittingMbiTest) {
      return { ok: false };
    }

    set({
      isSubmittingMbiTest: true,
      submitMbiTestError: null,
      submitMbiTestSuccessMessage: null,
      lastMbiResult: null,
    });

    try {
      const response = await submitMbiTestApi({ answers });
      const normalizedLastResult = normalizeMbiSession(response?.data || {});

      set({
        isSubmittingMbiTest: false,
        submitMbiTestError: null,
        submitMbiTestSuccessMessage:
          response?.message || "Evaluacion MBI enviada correctamente.",
        lastMbiResult: normalizedLastResult,
        hasLoadedMyHistory: false,
      });

      await get().fetchMyHistory({ force: true });
      await get().fetchMbiRetestStatus({ force: true });
      await get().fetchMbiProgressComparison({ force: true });

      return { ok: true, data: normalizedLastResult };
    } catch (error) {
      const message = normalizeErrorMessage(
        error,
        "No fue posible enviar la evaluacion MBI.",
      );

      set({
        isSubmittingMbiTest: false,
        submitMbiTestError: message,
      });

      return { ok: false, message };
    }
  },

  clearSubmissionStatus: () =>
    set({
      submitMbiTestError: null,
      submitMbiTestSuccessMessage: null,
      lastMbiResult: null,
    }),

  fetchMbiRetestStatus: async ({ force = false } = {}) => {
    if (get().isLoadingMbiRetestStatus) {
      return;
    }

    if (get().mbiRetestStatus && !force) {
      return;
    }

    set({
      isLoadingMbiRetestStatus: true,
      mbiRetestStatusError: null,
    });

    try {
      const response = await getMyMbiRetestStatusApi();

      set({
        mbiRetestStatus: response?.data || null,
        isLoadingMbiRetestStatus: false,
        mbiRetestStatusError: null,
      });
    } catch (error) {
      set({
        isLoadingMbiRetestStatus: false,
        mbiRetestStatusError: normalizeErrorMessage(
          error,
          "No fue posible obtener el estado de recaptura MBI.",
        ),
      });
    }
  },

  fetchMbiProgressComparison: async ({ force = false } = {}) => {
    if (get().isLoadingMbiProgressComparison) {
      return;
    }

    if (get().mbiProgressComparison && !force) {
      return;
    }

    set({
      isLoadingMbiProgressComparison: true,
      mbiProgressComparisonError: null,
    });

    try {
      const response = await getMyMbiProgressComparisonApi();

      set({
        mbiProgressComparison: response?.data || null,
        isLoadingMbiProgressComparison: false,
        mbiProgressComparisonError: null,
      });
    } catch (error) {
      set({
        isLoadingMbiProgressComparison: false,
        mbiProgressComparisonError: normalizeErrorMessage(
          error,
          "No fue posible obtener la comparacion clinica MBI.",
        ),
      });
    }
  },
}));
