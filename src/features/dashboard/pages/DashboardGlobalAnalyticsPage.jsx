import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { useEffect, useMemo } from "react";
import DashboardSectionCard from "../components/DashboardSectionCard";
import {
  GLOBAL_ANALYTICS_PERIODS,
  useDashboardAnalyticsStore,
} from "../store/dashboard-analytics.store";

const PERIOD_OPTIONS = [
  { value: GLOBAL_ANALYTICS_PERIODS.TODAY, label: "Hoy" },
  { value: GLOBAL_ANALYTICS_PERIODS.WEEK, label: "Semana" },
  { value: GLOBAL_ANALYTICS_PERIODS.MONTH, label: "Mes" },
];

const formatDeltaLabel = (deltaInfo) => {
  if (!deltaInfo) {
    return "--";
  }

  const sign = deltaInfo.absolute > 0 ? "+" : "";
  return `${sign}${deltaInfo.absolute} (${sign}${deltaInfo.percent}%)`;
};

const getDeltaChipColor = (deltaInfo) => {
  if (!deltaInfo) {
    return "default";
  }

  if (deltaInfo.absolute > 0) {
    return "success";
  }

  if (deltaInfo.absolute < 0) {
    return "error";
  }

  return "default";
};

function DashboardGlobalAnalyticsPage() {
  const theme = useTheme();

  const globalAnalytics = useDashboardAnalyticsStore(
    (state) => state.globalAnalytics,
  );
  const isLoadingGlobalAnalytics = useDashboardAnalyticsStore(
    (state) => state.isLoadingGlobalAnalytics,
  );
  const globalAnalyticsError = useDashboardAnalyticsStore(
    (state) => state.globalAnalyticsError,
  );
  const fetchGlobalAnalytics = useDashboardAnalyticsStore(
    (state) => state.fetchGlobalAnalytics,
  );
  const selectedGlobalPeriod = useDashboardAnalyticsStore(
    (state) => state.selectedGlobalPeriod,
  );
  const setSelectedGlobalPeriod = useDashboardAnalyticsStore(
    (state) => state.setSelectedGlobalPeriod,
  );
  const globalAnalyticsComparison = useDashboardAnalyticsStore(
    (state) => state.globalAnalyticsComparison,
  );
  const globalAnalyticsPeriodMeta = useDashboardAnalyticsStore(
    (state) => state.globalAnalyticsPeriodMeta,
  );

  useEffect(() => {
    void fetchGlobalAnalytics({ period: selectedGlobalPeriod });
  }, [fetchGlobalAnalytics, selectedGlobalPeriod]);

  const metrics = useMemo(() => {
    const docentesActivos = Number(globalAnalytics?.docentes_activos || 0);
    const evaluacionesCompletadas = Number(
      globalAnalytics?.evaluaciones_completadas || 0,
    );
    const minutosTotalesTerapia = Number(
      globalAnalytics?.minutos_totales_terapia || 0,
    );

    return {
      docentesActivos,
      evaluacionesCompletadas,
      minutosTotalesTerapia,
      espacioMasUtilizado:
        globalAnalytics?.espacio_mas_utilizado || "Aún no hay datos",
    };
  }, [globalAnalytics]);

  const chartCategories = ["Docentes", "Evaluaciones", "Minutos terapia"];
  const chartValues = [
    metrics.docentesActivos,
    metrics.evaluacionesCompletadas,
    metrics.minutosTotalesTerapia,
  ];

  const maxValue = Math.max(...chartValues, 1);
  const normalizedValues = chartValues.map((value) =>
    Number(((value / maxValue) * 100).toFixed(2)),
  );

  const periodDescription = useMemo(() => {
    const current = globalAnalyticsPeriodMeta?.actual;
    const previous = globalAnalyticsPeriodMeta?.anterior;

    if (!current || !previous) {
      return "Comparativo contra periodo anterior equivalente.";
    }

    const currentStart = new Date(current.desde).toLocaleDateString("es-CO");
    const currentEnd = new Date(current.hasta).toLocaleDateString("es-CO");
    const previousStart = new Date(previous.desde).toLocaleDateString("es-CO");
    const previousEnd = new Date(previous.hasta).toLocaleDateString("es-CO");

    return `Actual: ${currentStart} - ${currentEnd}. Anterior: ${previousStart} - ${previousEnd}.`;
  }, [globalAnalyticsPeriodMeta]);

  const handlePeriodChange = (_, nextPeriod) => {
    if (!nextPeriod) {
      return;
    }

    setSelectedGlobalPeriod(nextPeriod);
  };

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" } }}
          >
            Analítica global institucional
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Vista consolidada de impacto institucional para administración y
            dirección.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          onClick={() =>
            void fetchGlobalAnalytics({
              force: true,
              period: selectedGlobalPeriod,
            })
          }
          disabled={isLoadingGlobalAnalytics}
        >
          Actualizar
        </Button>
      </Stack>

      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 1.5 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <ToggleButtonGroup
            color="primary"
            exclusive
            size="small"
            value={selectedGlobalPeriod}
            onChange={handlePeriodChange}
          >
            {PERIOD_OPTIONS.map((option) => (
              <ToggleButton
                key={option.value}
                value={option.value}
              >
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {periodDescription}
          </Typography>
        </Stack>
      </Paper>

      {globalAnalyticsError ? (
        <Alert severity="error">{globalAnalyticsError}</Alert>
      ) : null}

      {isLoadingGlobalAnalytics && !globalAnalytics ? (
        <Paper sx={{ p: 3, borderRadius: 1.5 }}>
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
          >
            <CircularProgress size={22} />
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Cargando analíticas globales...
            </Typography>
          </Stack>
        </Paper>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            display: "flex",
            minWidth: 0,
            gridColumn: {
              xs: "1 / -1",
              sm: "span 6",
              md: "span 3",
            },
          }}
        >
          <DashboardSectionCard
            title="Docentes activos"
            description={`${metrics.docentesActivos} docentes activos registrados.`}
          >
            <Chip
              size="small"
              color={getDeltaChipColor(
                globalAnalyticsComparison?.docentes_activos,
              )}
              label={`Vs anterior: ${formatDeltaLabel(globalAnalyticsComparison?.docentes_activos)}`}
              sx={{ width: "fit-content" }}
            />
          </DashboardSectionCard>
        </Box>
        <Box
          sx={{
            display: "flex",
            minWidth: 0,
            gridColumn: {
              xs: "1 / -1",
              sm: "span 6",
              md: "span 3",
            },
          }}
        >
          <DashboardSectionCard
            title="Evaluaciones completadas"
            description={`${metrics.evaluacionesCompletadas} tests MBI completados.`}
          >
            <Chip
              size="small"
              color={getDeltaChipColor(
                globalAnalyticsComparison?.evaluaciones_completadas,
              )}
              label={`Vs anterior: ${formatDeltaLabel(globalAnalyticsComparison?.evaluaciones_completadas)}`}
              sx={{ width: "fit-content" }}
            />
          </DashboardSectionCard>
        </Box>
        <Box
          sx={{
            display: "flex",
            minWidth: 0,
            gridColumn: {
              xs: "1 / -1",
              sm: "span 6",
              md: "span 3",
            },
          }}
        >
          <DashboardSectionCard
            title="Minutos de terapia"
            description={`${metrics.minutosTotalesTerapia} minutos acumulados en espacios.`}
          >
            <Chip
              size="small"
              color={getDeltaChipColor(
                globalAnalyticsComparison?.minutos_totales_terapia,
              )}
              label={`Vs anterior: ${formatDeltaLabel(globalAnalyticsComparison?.minutos_totales_terapia)}`}
              sx={{ width: "fit-content" }}
            />
          </DashboardSectionCard>
        </Box>
        <Box
          sx={{
            display: "flex",
            minWidth: 0,
            gridColumn: {
              xs: "1 / -1",
              sm: "span 6",
              md: "span 3",
            },
          }}
        >
          <DashboardSectionCard
            title="Espacio más utilizado"
            description={metrics.espacioMasUtilizado}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            minWidth: 0,
            gridColumn: {
              xs: "1 / -1",
              md: "span 8",
            },
          }}
        >
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 1.5, width: "100%" }}>
            <Stack spacing={1.2}>
              <Typography variant="h6">Indicadores absolutos</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Comparativo general de volumen institucional en docentes,
                evaluaciones y minutos de terapia.
              </Typography>
              <Box sx={{ overflowX: "auto", pt: 1 }}>
                <BarChart
                  height={300}
                  xAxis={[
                    {
                      scaleType: "band",
                      data: chartCategories,
                    },
                  ]}
                  series={[
                    {
                      data: chartValues,
                      color: theme.palette.primary.main,
                      label: "Valor",
                    },
                  ]}
                />
              </Box>
            </Stack>
          </Paper>
        </Box>

        <Box
          sx={{
            display: "flex",
            minWidth: 0,
            gridColumn: {
              xs: "1 / -1",
              md: "span 4",
            },
          }}
        >
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 1.5, width: "100%" }}>
            <Stack spacing={1.2}>
              <Typography variant="h6">Índice relativo</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Distribución normalizada de indicadores (escala 0 a 100) para
                lectura rápida.
              </Typography>
              <PieChart
                height={260}
                series={[
                  {
                    data: [
                      {
                        id: 0,
                        label: "Docentes",
                        value: normalizedValues[0],
                        color: theme.palette.primary.main,
                      },
                      {
                        id: 1,
                        label: "Evaluaciones",
                        value: normalizedValues[1],
                        color: theme.palette.secondary.main,
                      },
                      {
                        id: 2,
                        label: "Minutos",
                        value: normalizedValues[2],
                        color: theme.palette.primary.light,
                      },
                    ],
                    innerRadius: 44,
                    outerRadius: 90,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
              />
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Stack>
  );
}

export default DashboardGlobalAnalyticsPage;
