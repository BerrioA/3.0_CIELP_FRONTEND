import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../auth/store/auth.store";
import { USER_ROLES } from "../config/roles";
import { useDashboardSpacesStore } from "../store/dashboard-spaces.store";

const formatDurationLabel = (seconds) => {
  const safeSeconds = Number(seconds) || 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
};

function DashboardSpaceImmersivePage() {
  const navigate = useNavigate();
  const { spaceId } = useParams();
  const userUid = useAuthStore((state) => state.user?.uid);
  const userRole = useAuthStore((state) => state.user?.role);

  const spaces = useDashboardSpacesStore((state) => state.spaces);
  const isLoadingSpaces = useDashboardSpacesStore(
    (state) => state.isLoadingSpaces,
  );
  const fetchSpaces = useDashboardSpacesStore((state) => state.fetchSpaces);
  const activeSession = useDashboardSpacesStore((state) => state.activeSession);
  const fetchActiveSession = useDashboardSpacesStore(
    (state) => state.fetchActiveSession,
  );
  const startSession = useDashboardSpacesStore((state) => state.startSession);
  const endSession = useDashboardSpacesStore((state) => state.endSession);
  const isStartingSession = useDashboardSpacesStore(
    (state) => state.isStartingSession,
  );
  const isEndingSession = useDashboardSpacesStore(
    (state) => state.isEndingSession,
  );
  const sessionActionError = useDashboardSpacesStore(
    (state) => state.sessionActionError,
  );
  const clearSessionFeedback = useDashboardSpacesStore(
    (state) => state.clearSessionFeedback,
  );

  const [elapsedNow, setElapsedNow] = useState(() => Date.now());
  const [sessionStartedInView, setSessionStartedInView] = useState(false);
  const [dismissedRecommendationBySpace, setDismissedRecommendationBySpace] =
    useState({});
  const [showMoodFeedbackPrompt, setShowMoodFeedbackPrompt] = useState(false);
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
    if (!userUid) {
      return;
    }

    void fetchActiveSession({ userUid, force: true });
  }, [fetchActiveSession, userUid]);

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

  useEffect(() => {
    return () => {
      clearSessionFeedback();
    };
  }, [clearSessionFeedback]);

  const showRecommendation =
    !dismissedRecommendationBySpace[spaceId || "unknown"];

  useEffect(() => {
    if (!showRecommendation) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedRecommendationBySpace((previousValue) => ({
        ...previousValue,
        [spaceId || "unknown"]: true,
      }));
    }, 7000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showRecommendation, spaceId]);

  const selectedSpace = useMemo(
    () => spaces.find((space) => space.id === spaceId) || null,
    [spaceId, spaces],
  );

  const videoUrl =
    selectedSpace?.video_url || activeSession?.space?.video_url || "";

  const isTeacher = userRole === USER_ROLES.TEACHER;
  const isCurrentActive = activeSession?.space_id === spaceId;
  const isBlockedByOtherActiveSession =
    Boolean(activeSession) && !isCurrentActive;

  const elapsedSeconds = useMemo(() => {
    if (!activeSession?.started_at || !isCurrentActive) {
      return 0;
    }

    const startedAt = new Date(String(activeSession.started_at));
    return Math.max(0, Math.floor((elapsedNow - startedAt.getTime()) / 1000));
  }, [activeSession, elapsedNow, isCurrentActive]);

  const extractYouTubeId = (url) => {
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.hostname.includes("youtu.be")) {
        return parsedUrl.pathname.replace("/", "");
      }

      return parsedUrl.searchParams.get("v") || "";
    } catch {
      return "";
    }
  };

  const videoId = extractYouTubeId(videoUrl);

  const iframeSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=${
        isCurrentActive && sessionStartedInView && !showMoodFeedbackPrompt
          ? 1
          : 0
      }&controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1&fs=0`
    : "";

  const handleStartSession = async () => {
    clearSessionFeedback();
    const result = await startSession(spaceId);

    if (result?.ok) {
      setSessionStartedInView(true);
    }
  };

  const handleOpenStopFlow = () => {
    // Al abrir EVA de cierre pausamos reproducción para enfocar la autoevaluación.
    setSessionStartedInView(false);
    setSelectedMoodScore(null);
    setShowMoodFeedbackPrompt(true);
  };

  const handleSelectMoodAndFinish = async (score) => {
    if (!Number.isInteger(score) || isEndingSession || isStartingSession) {
      return;
    }

    setSelectedMoodScore(score);

    clearSessionFeedback();
    const result = await endSession({
      sessionId: activeSession?.session_id,
      moodScore: score,
    });

    if (result?.ok) {
      setShowMoodFeedbackPrompt(false);
      setSelectedMoodScore(null);
      navigate("/dashboard/espacios", { replace: true });
    }
  };

  if (!isTeacher) {
    return (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1700,
          bgcolor: "rgba(8, 18, 20, 0.96)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Alert severity="info">
          Este modo inmersivo está disponible para docentes.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1700,
        bgcolor: "#050b0d",
        color: "#ffffff",
      }}
    >
      {isLoadingSpaces && !selectedSpace ? (
        <Stack
          sx={{ height: "100%" }}
          alignItems="center"
          justifyContent="center"
          spacing={1.2}
        >
          <CircularProgress />
          <Typography color="rgba(255,255,255,0.8)">
            Cargando espacio...
          </Typography>
        </Stack>
      ) : null}

      {!isLoadingSpaces && !selectedSpace ? (
        <Stack
          sx={{ height: "100%", p: 3 }}
          alignItems="center"
          justifyContent="center"
          spacing={1.2}
        >
          <Alert severity="error">No encontramos el espacio solicitado.</Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/dashboard/espacios", { replace: true })}
          >
            Volver al catálogo
          </Button>
        </Stack>
      ) : null}

      {selectedSpace ? (
        <>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.45)",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {videoId ? (
              <iframe
                key={iframeSrc}
                title={`Espacio ${selectedSpace.name}`}
                src={iframeSrc}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen={false}
                style={{
                  border: "none",
                  width: "100vw",
                  height: "100vh",
                  pointerEvents: isCurrentActive ? "auto" : "none",
                }}
              />
            ) : (
              <Stack
                spacing={1.2}
                alignItems="center"
                sx={{ p: 3 }}
              >
                <Alert severity="warning">
                  Este espacio aún no tiene video configurado.
                </Alert>
              </Stack>
            )}
          </Box>

          {!isCurrentActive ? (
            <Stack
              sx={{
                position: "absolute",
                inset: 0,
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayCircleRoundedIcon />}
                onClick={() => void handleStartSession()}
                disabled={
                  isStartingSession ||
                  isEndingSession ||
                  isBlockedByOtherActiveSession ||
                  !videoId
                }
                sx={{
                  minWidth: 280,
                  minHeight: 56,
                  fontSize: "1.03rem",
                  pointerEvents: "auto",
                }}
              >
                {isStartingSession ? "Iniciando..." : "Iniciar sesión"}
              </Button>
            </Stack>
          ) : null}

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{
              position: "absolute",
              top: 20,
              left: 20,
              right: 20,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
            >
              <Chip
                label={selectedSpace.name}
                color="primary"
                sx={{
                  bgcolor: "rgba(10, 83, 83, 0.84)",
                  color: "#fff",
                }}
              />
              {isCurrentActive ? (
                <Chip
                  icon={<TimerRoundedIcon />}
                  label={`Tiempo: ${formatDurationLabel(elapsedSeconds)}`}
                  sx={{
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "#fff",
                  }}
                />
              ) : null}
            </Stack>

            <Button
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate("/dashboard/espacios")}
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.65)",
                bgcolor: "rgba(0,0,0,0.32)",
              }}
            >
              Salir
            </Button>
          </Stack>

          <Stack
            spacing={1.2}
            sx={{
              position: "absolute",
              left: 20,
              right: 20,
              bottom: 20,
            }}
          >
            {sessionActionError ? (
              <Alert severity="error">{sessionActionError}</Alert>
            ) : null}

            {showRecommendation ? (
              <Alert
                icon={<HeadphonesRoundedIcon fontSize="inherit" />}
                severity="info"
                action={
                  <IconButton
                    size="small"
                    onClick={() =>
                      setDismissedRecommendationBySpace((previousValue) => ({
                        ...previousValue,
                        [spaceId || "unknown"]: true,
                      }))
                    }
                    sx={{ color: "#fff" }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                }
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.62)",
                  color: "#fff",
                  "& .MuiAlert-icon": {
                    color: "#fff",
                  },
                }}
              >
                Recomendación: use audífonos, busque un espacio tranquilo y
                evite notificaciones para enfocarse al 100% en su bienestar.
              </Alert>
            ) : null}

            {isCurrentActive ? (
              <Stack spacing={1.2}>
                {showMoodFeedbackPrompt ? (
                  <Paper
                    sx={{
                      p: 1.2,
                      bgcolor: "rgba(0,0,0,0.6)",
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">
                        ¿Cómo se sintió durante y al finalizar esta sesión?
                      </Typography>
                      <Typography
                        variant="caption"
                        color="rgba(255,255,255,0.75)"
                      >
                        Seleccione el emoji que mejor describe su estado.
                        Guardaremos automáticamente su progreso al elegir una
                        opción EVA (1-10).
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.8}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        {moodOptions.map((option) => (
                          <Button
                            key={option.score}
                            size="small"
                            variant={
                              selectedMoodScore === option.score
                                ? "contained"
                                : "outlined"
                            }
                            onClick={() =>
                              void handleSelectMoodAndFinish(option.score)
                            }
                            sx={{
                              minWidth: 88,
                              color: "#fff",
                              borderColor: "rgba(255,255,255,0.4)",
                            }}
                          >
                            {option.emoji} {option.score}
                          </Button>
                        ))}
                      </Stack>

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={0.8}
                        justifyContent="flex-end"
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setShowMoodFeedbackPrompt(false);
                            setSelectedMoodScore(null);
                            setSessionStartedInView(true);
                          }}
                          sx={{
                            color: "#fff",
                            borderColor: "rgba(255,255,255,0.5)",
                          }}
                        >
                          Cancelar
                        </Button>
                      </Stack>

                      {isEndingSession ? (
                        <Typography
                          variant="caption"
                          color="rgba(255,255,255,0.8)"
                        >
                          Guardando cierre de sesión...
                        </Typography>
                      ) : null}
                    </Stack>
                  </Paper>
                ) : null}

                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                >
                  <Button
                    variant="contained"
                    size="large"
                    color="error"
                    startIcon={<StopCircleRoundedIcon />}
                    onClick={handleOpenStopFlow}
                    disabled={isEndingSession || isStartingSession}
                    sx={{ minWidth: 240 }}
                  >
                    {isEndingSession ? "Deteniendo..." : "Detener sesión"}
                  </Button>
                </Stack>
              </Stack>
            ) : null}

            {isBlockedByOtherActiveSession ? (
              <Alert severity="warning">
                Ya tienes una sesión activa en otro espacio. Finalízala para
                iniciar esta sesión inmersiva.
              </Alert>
            ) : null}
          </Stack>
        </>
      ) : null}
    </Box>
  );
}

export default DashboardSpaceImmersivePage;
