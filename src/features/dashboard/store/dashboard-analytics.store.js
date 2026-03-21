import { create } from "zustand";
import { getGlobalAnalyticsService } from "../services/analytics.service";

export const GLOBAL_ANALYTICS_PERIODS = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
};

const initialState = {
  globalAnalytics: null,
  globalAnalyticsComparison: null,
  globalAnalyticsPeriodMeta: null,
  executiveMvpAnalytics: null,
  selectedGlobalPeriod: GLOBAL_ANALYTICS_PERIODS.WEEK,
  analyticsByPeriod: {},
  isLoadingGlobalAnalytics: false,
  globalAnalyticsError: null,
  hasLoadedGlobalAnalytics: false,
};

const normalizeErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "No fue posible obtener las analíticas globales."
  );
};

export const useDashboardAnalyticsStore = create((set, get) => ({
  ...initialState,

  setSelectedGlobalPeriod: (period) =>
    set({
      selectedGlobalPeriod: period,
      hasLoadedGlobalAnalytics: Boolean(get().analyticsByPeriod[period]),
      globalAnalytics: get().analyticsByPeriod[period]?.impacto || null,
      globalAnalyticsComparison:
        get().analyticsByPeriod[period]?.comparativo || null,
      globalAnalyticsPeriodMeta:
        get().analyticsByPeriod[period]?.periodo || null,
      executiveMvpAnalytics:
        get().analyticsByPeriod[period]?.mvpEjecutivo || null,
      globalAnalyticsError: null,
    }),

  fetchGlobalAnalytics: async ({ force = false, period } = {}) => {
    if (get().isLoadingGlobalAnalytics) {
      return;
    }

    const effectivePeriod = period || get().selectedGlobalPeriod;
    const cachedPeriodData = get().analyticsByPeriod[effectivePeriod];

    if (cachedPeriodData && !force) {
      set({
        selectedGlobalPeriod: effectivePeriod,
        globalAnalytics: cachedPeriodData.impacto,
        globalAnalyticsComparison: cachedPeriodData.comparativo,
        globalAnalyticsPeriodMeta: cachedPeriodData.periodo,
        executiveMvpAnalytics: cachedPeriodData.mvpEjecutivo,
        hasLoadedGlobalAnalytics: true,
      });
      return cachedPeriodData;
    }

    set({
      selectedGlobalPeriod: effectivePeriod,
      isLoadingGlobalAnalytics: true,
      globalAnalyticsError: null,
    });

    try {
      const response = await getGlobalAnalyticsService({
        period: effectivePeriod,
      });
      const impactoInstitucional =
        response?.data?.impacto_institucional || null;
      const comparativoPeriodoAnterior =
        response?.data?.comparativo_periodo_anterior || null;
      const periodMeta = response?.data?.periodo || null;
      const executiveMvp = response?.data?.mvp_ejecutivo || null;

      const nextAnalyticsByPeriod = {
        ...get().analyticsByPeriod,
        [effectivePeriod]: {
          impacto: impactoInstitucional,
          comparativo: comparativoPeriodoAnterior,
          periodo: periodMeta,
          mvpEjecutivo: executiveMvp,
        },
      };

      set({
        globalAnalytics: impactoInstitucional,
        globalAnalyticsComparison: comparativoPeriodoAnterior,
        globalAnalyticsPeriodMeta: periodMeta,
        executiveMvpAnalytics: executiveMvp,
        analyticsByPeriod: nextAnalyticsByPeriod,
        isLoadingGlobalAnalytics: false,
        globalAnalyticsError: null,
        hasLoadedGlobalAnalytics: true,
      });

      return nextAnalyticsByPeriod[effectivePeriod];
    } catch (error) {
      set({
        isLoadingGlobalAnalytics: false,
        globalAnalyticsError: normalizeErrorMessage(error),
      });

      return null;
    }
  },

  resetGlobalAnalytics: () => set({ ...initialState }),
}));
