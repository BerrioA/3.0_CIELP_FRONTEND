import { create } from "zustand";
import { getGlobalAnalyticsService } from "../services/analytics.service";
import {
  clearSessionCache,
  readSessionCacheWithMeta,
  writeSessionCache,
} from "../../../shared/lib/sessionCache";

export const GLOBAL_ANALYTICS_PERIODS = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
};

const DASHBOARD_ANALYTICS_CACHE_KEY = "cielp_dashboard_analytics_cache_v1";
const DASHBOARD_ANALYTICS_CACHE_TTL_MS = 2 * 60 * 1000;

const initialCacheEntry = readSessionCacheWithMeta(
  DASHBOARD_ANALYTICS_CACHE_KEY,
  DASHBOARD_ANALYTICS_CACHE_TTL_MS,
);
const initialCache = initialCacheEntry?.payload || {};
const isInitialCacheStale = Boolean(initialCacheEntry?.isExpired);

const persistAnalyticsCache = (partialPayload = {}) => {
  const currentCache =
    readSessionCacheWithMeta(
      DASHBOARD_ANALYTICS_CACHE_KEY,
      DASHBOARD_ANALYTICS_CACHE_TTL_MS,
    )?.payload || {};

  writeSessionCache(DASHBOARD_ANALYTICS_CACHE_KEY, {
    ...currentCache,
    ...partialPayload,
  });
};

const initialState = {
  globalAnalytics: initialCache?.globalAnalytics || null,
  globalAnalyticsComparison: initialCache?.globalAnalyticsComparison || null,
  globalAnalyticsPeriodMeta: initialCache?.globalAnalyticsPeriodMeta || null,
  executiveMvpAnalytics: initialCache?.executiveMvpAnalytics || null,
  selectedGlobalPeriod:
    initialCache?.selectedGlobalPeriod || GLOBAL_ANALYTICS_PERIODS.WEEK,
  analyticsByPeriod: initialCache?.analyticsByPeriod || {},
  isLoadingGlobalAnalytics: false,
  globalAnalyticsError: null,
  hasLoadedGlobalAnalytics:
    Object.keys(initialCache?.analyticsByPeriod || {}).length > 0,
  isModuleCacheStale: isInitialCacheStale,
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
      isModuleCacheStale: get().isModuleCacheStale,
    }),

  fetchGlobalAnalytics: async ({ force = false, period } = {}) => {
    if (get().isLoadingGlobalAnalytics) {
      return;
    }

    const effectivePeriod = period || get().selectedGlobalPeriod;
    const cachedPeriodData = get().analyticsByPeriod[effectivePeriod];

    const hasCachedPeriodData = Boolean(cachedPeriodData);

    if (cachedPeriodData && !force && !get().isModuleCacheStale) {
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
      isLoadingGlobalAnalytics: hasCachedPeriodData ? false : true,
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
        isModuleCacheStale: false,
      });

      persistAnalyticsCache({
        selectedGlobalPeriod: effectivePeriod,
        globalAnalytics: impactoInstitucional,
        globalAnalyticsComparison: comparativoPeriodoAnterior,
        globalAnalyticsPeriodMeta: periodMeta,
        executiveMvpAnalytics: executiveMvp,
        analyticsByPeriod: nextAnalyticsByPeriod,
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

  resetGlobalAnalytics: () => {
    clearSessionCache(DASHBOARD_ANALYTICS_CACHE_KEY);
    set({ ...initialState, analyticsByPeriod: {}, isModuleCacheStale: true });
  },
}));
