import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useNavigate } from "react-router-dom";
import { useDashboardSpacesStore } from "../store/dashboard-spaces.store";
import { useDashboardMbiStore } from "../store/dashboard-mbi.store";
import { useAuthStore } from "../../auth/store/auth.store";
import { USER_ROLES } from "../config/roles";

const EMPTY_HISTORY = [];

const normalizeTextForMatch = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatDurationLabel = (seconds) => {
  const safeSeconds = Number(seconds) || 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
};

const formatDateLabel = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function DashboardSpacesHistoryPage({ embedded = false, onBackToSpaces }) {
  const navigate = useNavigate();
  const userRole = useAuthStore((state) => state.user?.role);

  const isTeacherRole = userRole === USER_ROLES.TEACHER;
  const isInstitutionalRole =
    userRole === USER_ROLES.SUPER_ADMIN ||
    userRole === USER_ROLES.ADMIN ||
    userRole === USER_ROLES.PSYCHOLOGIST;

  const teacherStats = useDashboardSpacesStore((state) => state.teacherStats);
  const isLoadingTeacherStats = useDashboardSpacesStore(
    (state) => state.isLoadingTeacherStats,
  );
  const teacherStatsError = useDashboardSpacesStore(
    (state) => state.teacherStatsError,
  );
  const fetchTeacherStats = useDashboardSpacesStore(
    (state) => state.fetchTeacherStats,
  );
  const moodHistoryBySpace = useDashboardSpacesStore(
    (state) => state.moodHistoryBySpace,
  );
  const isLoadingMoodHistoryBySpace = useDashboardSpacesStore(
    (state) => state.isLoadingMoodHistoryBySpace,
  );
  const moodHistoryBySpaceError = useDashboardSpacesStore(
    (state) => state.moodHistoryBySpaceError,
  );
  const fetchMoodHistoryBySpace = useDashboardSpacesStore(
    (state) => state.fetchMoodHistoryBySpace,
  );
  const spaces = useDashboardSpacesStore((state) => state.spaces);
  const fetchSpaces = useDashboardSpacesStore((state) => state.fetchSpaces);

  const myMbiHistory = useDashboardMbiStore((state) => state.myHistory);
  const isLoadingMyMbiHistory = useDashboardMbiStore(
    (state) => state.isLoadingMyHistory,
  );
  const myMbiHistoryError = useDashboardMbiStore(
    (state) => state.myHistoryError,
  );
  const fetchMyMbiHistory = useDashboardMbiStore(
    (state) => state.fetchMyHistory,
  );

  const [spaceFilter, setSpaceFilter] = useState("all");

  useEffect(() => {
    if (!isTeacherRole) {
      return;
    }

    void fetchTeacherStats();
  }, [fetchTeacherStats, isTeacherRole]);

  useEffect(() => {
    if (!isTeacherRole) {
      return;
    }

    void fetchSpaces();
    void fetchMyMbiHistory();
  }, [fetchMyMbiHistory, fetchSpaces, isTeacherRole]);

  useEffect(() => {
    if (!isInstitutionalRole) {
      return;
    }

    void fetchMoodHistoryBySpace();
  }, [fetchMoodHistoryBySpace, isInstitutionalRole]);

  const recentHistory = Array.isArray(teacherStats?.recent_history)
    ? teacherStats.recent_history
    : EMPTY_HISTORY;

  const filteredHistory = useMemo(() => {
    if (!isTeacherRole) {
      return EMPTY_HISTORY;
    }

    if (spaceFilter === "all") {
      return recentHistory;
    }

    return recentHistory.filter(
      (session) => session.space_name === spaceFilter,
    );
  }, [recentHistory, spaceFilter]);

  const favoriteSpaceName = teacherStats?.overview?.favorite_space || "";

  const institutionalSummary = useMemo(() => {
    return Array.isArray(moodHistoryBySpace?.summary)
      ? moodHistoryBySpace.summary
      : EMPTY_HISTORY;
  }, [moodHistoryBySpace]);

  const institutionalRecentLogs = useMemo(() => {
    return Array.isArray(moodHistoryBySpace?.recent_logs)
      ? moodHistoryBySpace.recent_logs
      : EMPTY_HISTORY;
  }, [moodHistoryBySpace]);

  const institutionalWeeklyTrend = useMemo(() => {
    return Array.isArray(moodHistoryBySpace?.weekly_mood_trend)
      ? moodHistoryBySpace.weekly_mood_trend
      : EMPTY_HISTORY;
  }, [moodHistoryBySpace]);

  const availableInstitutionalSpaces = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(
        [...institutionalSummary, ...institutionalRecentLogs]
          .map((item) => item?.space_name || item?.space?.name)
          .filter(Boolean),
      ),
    );

    return ["all", ...uniqueNames];
  }, [institutionalRecentLogs, institutionalSummary]);

  const availableSpaces = useMemo(() => {
    if (isInstitutionalRole) {
      return availableInstitutionalSpaces;
    }

    const uniqueNames = Array.from(
      new Set(
        recentHistory.map((session) => session.space_name).filter(Boolean),
      ),
    );

    return ["all", ...uniqueNames];
  }, [availableInstitutionalSpaces, isInstitutionalRole, recentHistory]);

  const filteredInstitutionalSummary = useMemo(() => {
    if (spaceFilter === "all") {
      return institutionalSummary;
    }

    return institutionalSummary.filter(
      (item) => item?.space_name === spaceFilter,
    );
  }, [institutionalSummary, spaceFilter]);

  const filteredInstitutionalLogs = useMemo(() => {
    if (spaceFilter === "all") {
      return institutionalRecentLogs;
    }

    return institutionalRecentLogs.filter(
      (item) => item?.space?.name === spaceFilter,
    );
  }, [institutionalRecentLogs, spaceFilter]);

  const latestSessionId = useMemo(() => {
    if (!recentHistory.length) {
      return null;
    }

    let latestId = null;
    let latestTime = -Infinity;

    for (const session of recentHistory) {
      const rawDate = session?.ended_at || session?.started_at;
      const time = rawDate ? new Date(String(rawDate)).getTime() : NaN;

      if (!Number.isNaN(time) && time > latestTime) {
        latestTime = time;
        latestId = session?.id || null;
      }
    }

    return latestId;
  }, [recentHistory]);

  const weeklyEvolution = teacherStats?.weekly_evolution || [];
  const weeklyEvolutionHasData = weeklyEvolution.some(
    (item) => Number(item?.total_minutes) > 0,
  );

  const institutionalWeeklyHasData = institutionalWeeklyTrend.some(
    (item) => Number(item?.entries_count) > 0,
  );

  const totalFilteredSeconds = filteredHistory.reduce(
    (acc, session) => acc + (Number(session?.duration_seconds) || 0),
    0,
  );

  const latestMbiSession = useMemo(() => {
    if (!Array.isArray(myMbiHistory) || myMbiHistory.length === 0) {
      return null;
    }

    return [...myMbiHistory].sort((leftSession, rightSession) => {
      const leftTime = leftSession?.date
        ? new Date(String(leftSession.date)).getTime()
        : 0;
      const rightTime = rightSession?.date
        ? new Date(String(rightSession.date)).getTime()
        : 0;

      return rightTime - leftTime;
    })[0];
  }, [myMbiHistory]);

  const primaryRecommendation = latestMbiSession?.recomendaciones?.[0] || null;
  const suggestedSpaceName = primaryRecommendation?.espacio_sugerido || "";

  const recommendedSpace = useMemo(() => {
    const normalizedSuggestedName = normalizeTextForMatch(suggestedSpaceName);

    if (!normalizedSuggestedName) {
      return null;
    }

    return (
      spaces.find((space) => {
        const normalizedSpaceName = normalizeTextForMatch(space?.name);

        return (
          normalizedSpaceName === normalizedSuggestedName ||
          normalizedSpaceName.includes(normalizedSuggestedName) ||
          normalizedSuggestedName.includes(normalizedSpaceName)
        );
      }) || null
    );
  }, [spaces, suggestedSpaceName]);

  const goToSpaces = () => {
    if (embedded && typeof onBackToSpaces === "function") {
      onBackToSpaces();
      return;
    }

    navigate("/dashboard/espacios");
  };

  if (isInstitutionalRole) {
    const totalInstitutionalSessions = filteredInstitutionalSummary.reduce(
      (acc, item) => acc + (Number(item?.sessions_count) || 0),
      0,
    );

    return (
      <Stack spacing={2.3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" } }}
            >
              Historial institucional de espacios
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Consulta consolidada de uso por espacio, con opcion de filtrar un
              espacio especifico para seguimiento.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
          >
            {!embedded ? (
              <Button
                variant="outlined"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate("/dashboard")}
              >
                Volver al inicio
              </Button>
            ) : null}
            <Button
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => {
                void fetchMoodHistoryBySpace({ force: true });
              }}
              disabled={isLoadingMoodHistoryBySpace}
            >
              Actualizar
            </Button>
          </Stack>
        </Stack>

        {moodHistoryBySpaceError ? (
          <Alert severity="error">{moodHistoryBySpaceError}</Alert>
        ) : null}

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          <Chip label={`Espacios: ${filteredInstitutionalSummary.length}`} />
          <Chip label={`Sesiones: ${totalInstitutionalSessions}`} />
          <Chip
            label={`Registros recientes: ${filteredInstitutionalLogs.length}`}
            color="primary"
          />
        </Stack>

        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 1.25 }}
        >
          <TextField
            size="small"
            select
            label="Filtrar por espacio"
            value={spaceFilter}
            onChange={(event) => {
              setSpaceFilter(event.target.value);
            }}
            sx={{ minWidth: { xs: "100%", md: 320 } }}
          >
            {availableSpaces.map((spaceName) => (
              <MenuItem
                key={spaceName}
                value={spaceName}
              >
                {spaceName === "all" ? "Todos los espacios" : spaceName}
              </MenuItem>
            ))}
          </TextField>
        </Paper>

        {institutionalWeeklyHasData ? (
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 1.25 }}
          >
            <Stack spacing={1.1}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                Tendencia semanal de estado de animo (promedio)
              </Typography>
              <Box sx={{ height: 220 }}>
                <BarChart
                  xAxis={[
                    {
                      scaleType: "band",
                      data: institutionalWeeklyTrend.map(
                        (item) => item.week_label,
                      ),
                    },
                  ]}
                  series={[
                    {
                      data: institutionalWeeklyTrend.map(
                        (item) => Number(item.average_mood_score) || 0,
                      ),
                      label: "Mood promedio",
                      color: "#1976d2",
                    },
                  ]}
                  margin={{ top: 16, right: 10, bottom: 30, left: 30 }}
                  height={220}
                  slotProps={{ legend: { hidden: true } }}
                />
              </Box>
            </Stack>
          </Paper>
        ) : (
          <Alert severity="info">
            Aun no hay suficientes datos para graficar la tendencia semanal.
          </Alert>
        )}

        {isLoadingMoodHistoryBySpace ? (
          <Alert severity="info">Cargando historial institucional...</Alert>
        ) : null}

        {!isLoadingMoodHistoryBySpace &&
        filteredInstitutionalSummary.length === 0 ? (
          <Alert severity="info">
            No hay registros para el filtro seleccionado en este periodo.
          </Alert>
        ) : null}

        {!isLoadingMoodHistoryBySpace &&
        filteredInstitutionalSummary.length > 0 ? (
          <Stack spacing={1}>
            {filteredInstitutionalSummary.map((item) => (
              <Paper
                key={item.space_id || item.space_name}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 1.1 }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">{item.space_name}</Typography>
                  <Stack
                    direction="row"
                    spacing={0.8}
                    useFlexGap
                    flexWrap="wrap"
                  >
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Sesiones: ${Number(item.sessions_count) || 0}`}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Mood prom.: ${Number(item.average_mood_score) || 0}`}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Duracion prom.: ${Number(item.average_duration_minutes) || 0} min`}
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Ultimo registro: {formatDateLabel(item.last_logged_at)}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : null}
      </Stack>
    );
  }

  return (
    <Stack spacing={2.3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" } }}
          >
            Historial de espacios
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Trazabilidad de sesiones, duración acumulada y evolución semanal por
            práctica de autocuidado.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          {!embedded ? (
            <Button
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={goToSpaces}
            >
              Volver a espacios
            </Button>
          ) : null}
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => {
              void fetchTeacherStats({ force: true });
            }}
            disabled={isLoadingTeacherStats}
          >
            Actualizar
          </Button>
        </Stack>
      </Stack>

      {teacherStatsError ? (
        <Alert severity="error">{teacherStatsError}</Alert>
      ) : null}

      {myMbiHistoryError ? (
        <Alert severity="error">{myMbiHistoryError}</Alert>
      ) : null}

      {!isLoadingMyMbiHistory && primaryRecommendation ? (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 1.25 }}
        >
          <Stack spacing={1.1}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="h6">Continuidad recomendada</Typography>
              {latestMbiSession?.date ? (
                <Chip
                  size="small"
                  label={`Basado en evaluación: ${formatDateLabel(latestMbiSession.date)}`}
                />
              ) : null}
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Según su resultado MBI, se recomienda priorizar el espacio
              <strong> {primaryRecommendation.espacio_sugerido}</strong> para
              sostener el autocuidado y dar continuidad al plan de bienestar.
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              Motivo clínico: {primaryRecommendation.motivo || "Sin detalle"}
            </Typography>

            {latestMbiSession?.diagnostico ? (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Estado reportado: {latestMbiSession.diagnostico}
              </Typography>
            ) : null}

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button
                variant="contained"
                onClick={() => {
                  if (recommendedSpace?.id) {
                    navigate(
                      `/dashboard/espacios/${recommendedSpace.id}/inmersion`,
                    );
                    return;
                  }

                  navigate("/dashboard/espacios");
                }}
              >
                {recommendedSpace?.id
                  ? "Iniciar espacio recomendado"
                  : "Ver espacios sugeridos"}
              </Button>
              <Button
                variant="outlined"
                onClick={goToSpaces}
              >
                Volver a Mis espacios digitales
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {!isLoadingMyMbiHistory && !primaryRecommendation ? (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 1.25 }}
        >
          <Stack spacing={1.1}>
            <Typography variant="h6">Siguiente paso sugerido</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Aún no hay una recomendación MBI disponible para orientar su
              continuidad terapéutica. Para personalizar el espacio más
              adecuado, complete o actualice su evaluación MBI.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button
                variant="contained"
                onClick={() => navigate("/dashboard/mbi")}
              >
                Resolver MBI
              </Button>
              <Button
                variant="outlined"
                onClick={goToSpaces}
              >
                Volver a Mis espacios digitales
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
      >
        <Chip
          label={`Sesiones: ${filteredHistory.length}`}
          color="primary"
        />
        <Chip
          label={`Duración acumulada: ${formatDurationLabel(totalFilteredSeconds)}`}
        />
        <Chip
          label={`Espacio favorito: ${teacherStats?.overview?.favorite_space || "Aún no hay datos"}`}
        />
      </Stack>

      <Paper
        variant="outlined"
        sx={{ p: 2, borderRadius: 1.25 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <TextField
            size="small"
            select
            label="Filtrar por espacio"
            value={spaceFilter}
            onChange={(event) => {
              setSpaceFilter(event.target.value);
            }}
            sx={{ minWidth: { xs: "100%", md: 320 } }}
          >
            {availableSpaces.map((spaceName) => (
              <MenuItem
                key={spaceName}
                value={spaceName}
              >
                {spaceName === "all" ? "Todos los espacios" : spaceName}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {weeklyEvolutionHasData ? (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 1.25 }}
        >
          <Stack spacing={1.1}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              Evolución semanal (minutos)
            </Typography>
            <Box sx={{ height: 220 }}>
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: weeklyEvolution.map((item) => item.week_label),
                  },
                ]}
                series={[
                  {
                    data: weeklyEvolution.map((item) => item.total_minutes),
                    label: "Minutos",
                    color: "#1976d2",
                  },
                ]}
                margin={{ top: 16, right: 10, bottom: 30, left: 30 }}
                height={220}
                slotProps={{ legend: { hidden: true } }}
              />
            </Box>
          </Stack>
        </Paper>
      ) : (
        <Alert severity="info">
          Aún no hay suficientes datos para graficar la evolución semanal.
        </Alert>
      )}

      {isLoadingTeacherStats ? (
        <Alert severity="info">Cargando historial de sesiones...</Alert>
      ) : null}

      {!isLoadingTeacherStats && filteredHistory.length === 0 ? (
        <Alert severity="info">
          No hay sesiones registradas para el filtro seleccionado.
        </Alert>
      ) : null}

      {!isLoadingTeacherStats && filteredHistory.length > 0 ? (
        <Stack spacing={1}>
          {filteredHistory.map((session) => (
            <Paper
              key={session.id}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 1.1 }}
            >
              <Stack spacing={0.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={0.8}
                >
                  <Typography variant="subtitle2">
                    {session.space_name}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.8}
                    useFlexGap
                    flexWrap="wrap"
                  >
                    <Chip
                      size="small"
                      variant="outlined"
                      label={session.space_type_label}
                    />
                    {favoriteSpaceName &&
                    session.space_name === favoriteSpaceName ? (
                      <Chip
                        size="small"
                        color="secondary"
                        label="Espacio favorito"
                      />
                    ) : null}
                    {session.id &&
                    latestSessionId &&
                    session.id === latestSessionId ? (
                      <Chip
                        size="small"
                        color="primary"
                        label="Último usado"
                      />
                    ) : null}
                  </Stack>
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Inicio: {formatDateLabel(session.started_at)} | Fin:{" "}
                  {formatDateLabel(session.ended_at)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Duración: {formatDurationLabel(session.duration_seconds)}
                </Typography>

                <Stack
                  direction="row"
                  justifyContent="flex-end"
                >
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!session.space_id}
                    onClick={() => {
                      if (!session.space_id) {
                        return;
                      }

                      navigate(
                        `/dashboard/espacios/${session.space_id}/inmersion`,
                      );
                    }}
                  >
                    Repetir sesión
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

export default DashboardSpacesHistoryPage;
