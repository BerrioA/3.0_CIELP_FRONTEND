import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import DashboardSectionCard from "../components/DashboardSectionCard";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/store/auth.store";
import { USER_ROLES } from "../config/roles";
import { useDashboardSpacesStore } from "../store/dashboard-spaces.store";
import { useDashboardMbiStore } from "../store/dashboard-mbi.store";

const normalizeTextForMatch = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const ROLE_SPACES_CONTENT = {
  [USER_ROLES.SUPER_ADMIN]: {
    heading: "Espacios digitales institucionales",
    title: "Rendimiento de espacios",
    description:
      "Indicadores de adopción, sesiones completadas y uso agregado por poblaciones.",
  },
  [USER_ROLES.ADMIN]: {
    heading: "Espacios digitales",
    title: "Gestión operativa de sesiones",
    description:
      "Monitorea uso diario, duraciones y cumplimiento de actividades de bienestar.",
  },
  [USER_ROLES.TEACHER]: {
    heading: "Mis espacios digitales",
    title: "Rutina guiada",
    description:
      "Acceda a espacios sugeridos por el sistema, gestione su sesión activa y monitoree su progreso semanal.",
  },
  [USER_ROLES.DEVELOPER]: {
    heading: "Espacios digitales técnico",
    title: "Telemetría del módulo",
    description:
      "Revisión de comportamiento funcional, tiempos de sesión y consistencia de eventos.",
  },
  [USER_ROLES.PSYCHOLOGIST]: {
    heading: "Espacios de bienestar",
    title: "Catálogo terapéutico",
    description:
      "Consulta recursos disponibles para soporte y acompañamiento del bienestar docente.",
  },
};

const formatDurationLabel = (seconds) => {
  const safeSeconds = Number(seconds) || 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
};

function DashboardSpacesPage() {
  const userUid = useAuthStore((state) => state.user?.uid);
  const navigate = useNavigate();
  const userRole = useAuthStore((state) => state.user?.role);
  const isTeacher = userRole === USER_ROLES.TEACHER;

  const spaces = useDashboardSpacesStore((state) => state.spaces);
  const isLoadingSpaces = useDashboardSpacesStore(
    (state) => state.isLoadingSpaces,
  );
  const spacesError = useDashboardSpacesStore((state) => state.spacesError);
  const fetchSpaces = useDashboardSpacesStore((state) => state.fetchSpaces);

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

  const activeSession = useDashboardSpacesStore((state) => state.activeSession);
  const isStartingSession = useDashboardSpacesStore(
    (state) => state.isStartingSession,
  );
  const isEndingSession = useDashboardSpacesStore(
    (state) => state.isEndingSession,
  );
  const sessionActionError = useDashboardSpacesStore(
    (state) => state.sessionActionError,
  );
  const sessionActionSuccessMessage = useDashboardSpacesStore(
    (state) => state.sessionActionSuccessMessage,
  );
  const lastCompletedSession = useDashboardSpacesStore(
    (state) => state.lastCompletedSession,
  );
  const fetchActiveSession = useDashboardSpacesStore(
    (state) => state.fetchActiveSession,
  );
  const endSession = useDashboardSpacesStore((state) => state.endSession);
  const clearSessionFeedback = useDashboardSpacesStore(
    (state) => state.clearSessionFeedback,
  );

  const myMbiHistory = useDashboardMbiStore((state) => state.myHistory);
  const fetchMyMbiHistory = useDashboardMbiStore(
    (state) => state.fetchMyHistory,
  );

  const [elapsedNow, setElapsedNow] = useState(() => Date.now());
  const [spaceTypeFilter, setSpaceTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [selectedMoodScore, setSelectedMoodScore] = useState(null);

  const moodOptions = [
    { score: 2, emoji: "😟", label: "Muy tenso" },
    { score: 4, emoji: "🙁", label: "Inestable" },
    { score: 6, emoji: "😐", label: "Neutral" },
    { score: 8, emoji: "🙂", label: "Mejor" },
    { score: 10, emoji: "😌", label: "Muy bien" },
  ];

  useEffect(() => {
    void fetchSpaces();
  }, [fetchSpaces]);

  useEffect(() => {
    if (!isTeacher) {
      return;
    }

    void fetchTeacherStats();
  }, [fetchTeacherStats, isTeacher]);

  useEffect(() => {
    if (!isTeacher) {
      return;
    }

    void fetchMyMbiHistory();
  }, [fetchMyMbiHistory, isTeacher]);

  useEffect(() => {
    if (!isTeacher || !userUid) {
      return;
    }

    void fetchActiveSession({ userUid });
  }, [fetchActiveSession, isTeacher, userUid]);

  useEffect(() => {
    if (!activeSession?.started_at) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeSession]);

  const elapsedSeconds = useMemo(() => {
    if (!activeSession?.started_at) {
      return 0;
    }

    const startedAt = new Date(String(activeSession.started_at));
    return Math.max(0, Math.floor((elapsedNow - startedAt.getTime()) / 1000));
  }, [activeSession, elapsedNow]);

  const activeSpaceName = activeSession?.space_id
    ? activeSession?.space?.name ||
      spaces.find((space) => space.id === activeSession.space_id)?.name ||
      ""
    : "";
  const activeSpaceId = activeSession?.space_id || "";

  const availableSpaceTypes = [
    "all",
    ...Array.from(new Set(spaces.map((space) => space.type))).filter(Boolean),
  ];

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredSpaces = spaces.filter((space) => {
    const matchesType =
      spaceTypeFilter === "all" || space.type === spaceTypeFilter;
    const matchesSearch =
      !normalizedSearchTerm ||
      space.name.toLowerCase().includes(normalizedSearchTerm);

    return matchesType && matchesSearch;
  });

  const orderedTeacherSpaces = useMemo(() => {
    const favoriteSpace = teacherStats?.overview?.favorite_space || "";

    return [...spaces].sort((leftSpace, rightSpace) => {
      const leftIsActive = leftSpace.id === activeSpaceId ? 1 : 0;
      const rightIsActive = rightSpace.id === activeSpaceId ? 1 : 0;

      if (leftIsActive !== rightIsActive) {
        return rightIsActive - leftIsActive;
      }

      const leftIsFavorite =
        favoriteSpace && leftSpace.name === favoriteSpace ? 1 : 0;
      const rightIsFavorite =
        favoriteSpace && rightSpace.name === favoriteSpace ? 1 : 0;

      if (leftIsFavorite !== rightIsFavorite) {
        return rightIsFavorite - leftIsFavorite;
      }

      return leftSpace.name.localeCompare(rightSpace.name, "es", {
        sensitivity: "base",
      });
    });
  }, [activeSpaceId, spaces, teacherStats?.overview?.favorite_space]);

  const latestMbiRecommendation = useMemo(
    () => myMbiHistory?.[0]?.recomendaciones?.[0] || null,
    [myMbiHistory],
  );

  const recommendedTeacherSpace = useMemo(() => {
    const suggestedSpaceName = normalizeTextForMatch(
      latestMbiRecommendation?.espacio_sugerido,
    );

    if (!suggestedSpaceName) {
      return null;
    }

    return (
      spaces.find((space) => {
        const normalizedSpaceName = normalizeTextForMatch(space?.name);

        return (
          normalizedSpaceName === suggestedSpaceName ||
          normalizedSpaceName.includes(suggestedSpaceName) ||
          suggestedSpaceName.includes(normalizedSpaceName)
        );
      }) || null
    );
  }, [latestMbiRecommendation?.espacio_sugerido, spaces]);

  const visibleTeacherSpaces = useMemo(() => {
    if (!isTeacher) {
      return [];
    }

    if (recommendedTeacherSpace?.id) {
      return orderedTeacherSpaces.filter(
        (space) => space.id === recommendedTeacherSpace.id,
      );
    }

    return orderedTeacherSpaces;
  }, [isTeacher, orderedTeacherSpaces, recommendedTeacherSpace]);

  const visibleSpaces = isTeacher ? visibleTeacherSpaces : filteredSpaces;

  const weeklyEvolution = teacherStats.weekly_evolution || [];
  const weeklyEvolutionHasData = weeklyEvolution.some(
    (item) => item.total_minutes > 0,
  );

  const content =
    ROLE_SPACES_CONTENT[userRole] || ROLE_SPACES_CONTENT[USER_ROLES.TEACHER];

  const handleEndSession = async () => {
    if (!activeSession?.session_id) {
      return;
    }

    clearSessionFeedback();
    setSelectedMoodScore(null);
    setIsMoodDialogOpen(true);
  };

  const handleSelectMoodAndFinish = async (score) => {
    if (
      !activeSession?.session_id ||
      !Number.isInteger(score) ||
      isEndingSession
    ) {
      return;
    }

    setSelectedMoodScore(score);

    await endSession({
      sessionId: activeSession?.session_id,
      moodScore: score,
    });

    setIsMoodDialogOpen(false);
    setSelectedMoodScore(null);
  };

  const handleOpenImmersiveSpace = (spaceId) => {
    navigate(`/dashboard/espacios/${spaceId}/inmersion`);
  };

  return (
    <Stack spacing={2.5}>
      <Typography
        variant="h4"
        sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" } }}
      >
        {content.heading}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
      >
        {content.description}
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        useFlexGap
        flexWrap="wrap"
      >
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          <Chip label={`Espacios disponibles: ${spaces.length}`} />
          {isTeacher ? (
            <>
              <Chip
                label={`Sesiones completadas: ${teacherStats.overview.total_sessions}`}
                color="primary"
              />
              <Chip
                label={`Minutos acumulados: ${teacherStats.overview.total_minutes_meditated}`}
              />
              <Chip
                label={`Sesión activa: ${activeSession ? "Sí" : "No"}`}
                color={activeSession ? "success" : "default"}
              />
            </>
          ) : null}
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => {
              void fetchSpaces({ force: true });
              if (isTeacher) {
                void fetchTeacherStats({ force: true });
                if (userUid) {
                  void fetchActiveSession({ force: true, userUid });
                }
              }
            }}
            disabled={isLoadingSpaces || isLoadingTeacherStats}
          >
            Actualizar
          </Button>

          {isTeacher ? (
            <Button
              variant="contained"
              onClick={() => navigate("/dashboard/espacios/historial")}
            >
              Ver mi historial
            </Button>
          ) : null}
        </Stack>
      </Stack>

      {spacesError ? <Alert severity="error">{spacesError}</Alert> : null}

      <Dialog
        open={isMoodDialogOpen}
        onClose={() => {
          if (isEndingSession) {
            return;
          }

          setIsMoodDialogOpen(false);
          setSelectedMoodScore(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Feedback post-sesión</DialogTitle>
        <DialogContent>
          <Stack
            spacing={1.2}
            sx={{ pt: 0.8 }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              ¿Cómo se sintió durante y al finalizar esta sesión?
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Seleccione el emoji que mejor describe su estado. Guardaremos
              automáticamente su cierre con la escala EVA (1 a 10).
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
            >
              {moodOptions.map((option) => (
                <Button
                  key={`spaces-mood-${option.score}`}
                  variant={
                    selectedMoodScore === option.score
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => void handleSelectMoodAndFinish(option.score)}
                  disabled={isEndingSession}
                  sx={{ minWidth: 96, textTransform: "none" }}
                >
                  {option.emoji} {option.score}
                </Button>
              ))}
            </Stack>

            {isEndingSession ? (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Guardando cierre de sesión...
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <Box sx={{ px: 3, pb: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={() => {
              setIsMoodDialogOpen(false);
              setSelectedMoodScore(null);
            }}
            disabled={isEndingSession}
          >
            Cancelar
          </Button>
        </Box>
      </Dialog>

      {isTeacher ? (
        <>
          {teacherStatsError ? (
            <Alert severity="error">{teacherStatsError}</Alert>
          ) : null}

          {sessionActionError ? (
            <Alert severity="error">{sessionActionError}</Alert>
          ) : null}

          {sessionActionSuccessMessage ? (
            <Alert severity="success">{sessionActionSuccessMessage}</Alert>
          ) : null}

          {activeSession ? (
            <Alert
              severity="info"
              action={
                <Stack
                  direction="row"
                  spacing={0.8}
                >
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<PlayCircleRoundedIcon />}
                    onClick={() => handleOpenImmersiveSpace(activeSpaceId)}
                  >
                    Reanudar inmersión
                  </Button>
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<StopCircleRoundedIcon />}
                    onClick={handleEndSession}
                    disabled={isEndingSession || isStartingSession}
                  >
                    {isEndingSession ? "Finalizando..." : "Finalizar"}
                  </Button>
                </Stack>
              }
            >
              Sesión activa en: {activeSpaceName || "Espacio seleccionado"}.
              Tiempo transcurrido: {formatDurationLabel(elapsedSeconds)}.
            </Alert>
          ) : null}

          {lastCompletedSession ? (
            <Alert severity="success">
              Última sesión finalizada:{" "}
              {formatDurationLabel(lastCompletedSession.duration_seconds)} ({" "}
              {lastCompletedSession.duration_minutes.toFixed(2)} min).
            </Alert>
          ) : null}
        </>
      ) : (
        <Alert severity="info">
          Para tu rol, este módulo funciona en modo catálogo. El inicio y cierre
          de sesiones está disponible para docentes.
        </Alert>
      )}

      {isLoadingSpaces ? (
        <DashboardSectionCard
          title="Catálogo de espacios"
          description="Cargando espacios digitales..."
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <CircularProgress size={20} />
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Obteniendo catálogo...
            </Typography>
          </Stack>
        </DashboardSectionCard>
      ) : null}

      {!isLoadingSpaces && !isTeacher ? (
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
              label="Buscar por nombre"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
              placeholder="Ej. Respiración guiada"
              fullWidth
            />

            <TextField
              size="small"
              select
              label="Tipo"
              value={spaceTypeFilter}
              onChange={(event) => {
                setSpaceTypeFilter(event.target.value);
              }}
              sx={{ minWidth: { xs: "100%", md: 240 } }}
            >
              {availableSpaceTypes.map((type) => (
                <MenuItem
                  key={type}
                  value={type}
                >
                  {type === "all" ? "Todos los tipos" : type}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>
      ) : null}

      {isTeacher ? (
        <Alert severity="info">
          {recommendedTeacherSpace?.id
            ? `Se está mostrando únicamente el espacio recomendado por su última evaluación MBI: ${recommendedTeacherSpace.name}.`
            : "No se encontró una recomendación MBI vigente; se muestra el catálogo completo para que pueda continuar su práctica."}
        </Alert>
      ) : null}

      {!isLoadingSpaces && visibleSpaces.length > 0 ? (
        <Stack spacing={1.5}>
          {visibleSpaces.map((space) => {
            const isCurrentActive = activeSession?.space_id === space.id;
            const isBlockedByOtherActiveSession =
              Boolean(activeSession) && !isCurrentActive;

            return (
              <Paper
                key={space.id}
                variant="outlined"
                sx={{ p: 2.2, borderRadius: 1.25 }}
              >
                <Stack spacing={1.1}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    <Box>
                      <Typography variant="h6">{space.name}</Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {space.description}
                      </Typography>
                    </Box>

                    <Chip
                      label={space.typeLabel}
                      variant="outlined"
                    />
                  </Stack>

                  {space.thumbnail_url ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Recurso visual: {space.thumbnail_url}
                    </Typography>
                  ) : null}

                  {isTeacher ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      {isCurrentActive ? (
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<StopCircleRoundedIcon />}
                          onClick={handleEndSession}
                          disabled={isEndingSession || isStartingSession}
                        >
                          {isEndingSession
                            ? "Finalizando..."
                            : "Finalizar sesión"}
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          startIcon={<PlayCircleRoundedIcon />}
                          onClick={() => handleOpenImmersiveSpace(space.id)}
                          disabled={
                            isBlockedByOtherActiveSession ||
                            isStartingSession ||
                            isEndingSession
                          }
                        >
                          Abrir inmersión
                        </Button>
                      )}

                      {isBlockedByOtherActiveSession ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Ya tienes una sesión activa en otro espacio.
                        </Typography>
                      ) : null}
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      ) : null}

      {!isLoadingSpaces && visibleSpaces.length === 0 ? (
        <DashboardSectionCard
          title={isTeacher ? "Espacios sugeridos" : "Catálogo de espacios"}
          description={
            spaces.length === 0
              ? "No hay espacios activos disponibles en este momento."
              : "No hay resultados con los filtros aplicados."
          }
        />
      ) : null}

      {isTeacher ? (
        <DashboardSectionCard
          title={content.title}
          description="Resumen de uso personal y trazabilidad de sesiones recientes."
        >
          {isLoadingTeacherStats ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <CircularProgress size={20} />
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Cargando estadísticas...
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.2}>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip
                  label={`Favorito: ${teacherStats.overview.favorite_space}`}
                />
                <Chip
                  label={`Sesiones: ${teacherStats.overview.total_sessions}`}
                  color="primary"
                />
                <Chip
                  label={`Total minutos: ${teacherStats.overview.total_minutes_meditated}`}
                />
              </Stack>

              <Divider />

              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                Evolución semanal (minutos)
              </Typography>

              {!weeklyEvolutionHasData ? (
                <Alert severity="info">
                  Aún no hay suficientes datos para graficar la evolución
                  semanal.
                </Alert>
              ) : (
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
              )}

              <Divider />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                >
                  Historial de práctica
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/dashboard/espacios/historial")}
                >
                  Ver historial reciente
                </Button>
              </Stack>
            </Stack>
          )}
        </DashboardSectionCard>
      ) : (
        <DashboardSectionCard
          title={content.title}
          description={content.description}
        />
      )}
    </Stack>
  );
}

export default DashboardSpacesPage;
