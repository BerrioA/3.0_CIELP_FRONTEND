import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fade,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import DashboardSectionCard from "../components/DashboardSectionCard";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/store/auth.store";
import { USER_ROLES } from "../config/roles";
import { useDashboardMbiStore } from "../store/dashboard-mbi.store";
import { useDashboardSpacesStore } from "../store/dashboard-spaces.store";
import { getTeacherMbiHistoryApi } from "../services/mbi.service";

const ROLE_MBI_CONTENT = {
  [USER_ROLES.SUPER_ADMIN]: {
    heading: "MBI institucional",
    title: "Gobernanza de evaluaciones",
    description:
      "Consolidado global de pruebas, tendencias y cumplimiento por sedes o dependencias.",
  },
  [USER_ROLES.ADMIN]: {
    heading: "MBI administrativo",
    title: "Operación de evaluaciones",
    description:
      "Control de convocatorias, resultados y trazabilidad de ejecución del instrumento.",
  },
  [USER_ROLES.PSYCHOLOGIST]: {
    heading: "MBI clínico",
    title: "Análisis de riesgo",
    description:
      "Interpretación de resultados para priorizar intervenciones y seguimiento individual.",
  },
  [USER_ROLES.TEACHER]: {
    heading: "Mi experiencia MBI",
    title: "Mis evaluaciones",
    description:
      "Consulta tus históricos, progreso personal y próximas acciones recomendadas.",
  },
  [USER_ROLES.DEVELOPER]: {
    heading: "MBI técnico",
    title: "Integridad del flujo MBI",
    description:
      "Supervisión de integraciones, contratos API y consistencia de datos del módulo.",
  },
};

const MBI_SCORE_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

const MBI_SCORE_LABELS = {
  0: "Nunca",
  1: "Pocas veces al año",
  2: "Una vez al mes",
  3: "Unas pocas veces al mes",
  4: "Una vez por semana",
  5: "Pocas veces por semana",
  6: "Todos los días",
};

const getSessionDateObject = (input) => {
  const rawValue =
    typeof input === "object" && input !== null
      ? (input.date ?? input.created_at ?? input.createdAt ?? null)
      : input;

  if (!rawValue) {
    return null;
  }

  const dateObject =
    rawValue instanceof Date ? rawValue : new Date(String(rawValue));

  if (Number.isNaN(dateObject.getTime())) {
    return null;
  }

  return dateObject;
};

const getRiskChipColor = (diagnosis = "") => {
  const normalized = diagnosis.toLowerCase();

  if (normalized.includes("severo") || normalized.includes("alto")) {
    return "error";
  }

  if (normalized.includes("moderado")) {
    return "warning";
  }

  if (normalized.includes("saludable")) {
    return "success";
  }

  return "default";
};

const formatDateLabel = (value) => {
  const dateObject = getSessionDateObject(value);

  if (!dateObject) {
    return "-";
  }

  return dateObject.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatDateOnlyLabel = (value) => {
  const dateObject = getSessionDateObject(value);

  if (!dateObject) {
    return "-";
  }

  return dateObject.toLocaleDateString("es-CO", {
    dateStyle: "medium",
  });
};

const getTrendSeries = (history = []) => {
  const getSessionTimestamp = (session) => {
    const dateObject = getSessionDateObject(session);
    return dateObject ? dateObject.getTime() : Number.POSITIVE_INFINITY;
  };

  const sortedHistory = [...history].sort(
    (a, b) => getSessionTimestamp(a) - getSessionTimestamp(b),
  );

  return {
    labels: sortedHistory.map((session, index) => {
      const dateObject = getSessionDateObject(session);

      if (!dateObject) {
        return `Sesión ${index + 1}`;
      }

      return dateObject.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
      });
    }),
    ce: sortedHistory.map(
      (session) => Number(session.scores?.cansancio_emocional) || 0,
    ),
    dp: sortedHistory.map(
      (session) => Number(session.scores?.despersonalizacion) || 0,
    ),
    rp: sortedHistory.map(
      (session) => Number(session.scores?.realizacion_personal) || 0,
    ),
  };
};

const normalizeTextForMatch = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getRiskBand = (diagnosis = "") => {
  const normalized = String(diagnosis).toLowerCase();

  if (normalized.includes("severo") || normalized.includes("alto")) {
    return "high";
  }

  if (normalized.includes("moderado")) {
    return "moderate";
  }

  if (normalized.includes("saludable") || normalized.includes("bajo")) {
    return "low";
  }

  return "unknown";
};

const loadInstitutionalLogoDataUrl = async () => {
  try {
    const response = await fetch("/CIELP.png");
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error("No fue posible leer el logo institucional."));
      reader.readAsDataURL(blob);
    });

    return typeof dataUrl === "string" ? dataUrl : null;
  } catch {
    return null;
  }
};

const buildReportCode = ({ prefix, date, subject }) => {
  const pad = (value) => String(value).padStart(2, "0");
  const ymd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const hm = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  const subjectTag = String(subject || "DOC")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();

  return `${prefix}-${ymd}-${hm}-${subjectTag || "DOC"}`;
};

const buildDigitalSignature = ({ reportCode, issuedAt }) => {
  const seed = `${reportCode}|${issuedAt.toISOString()}|CIELP`;
  const encoded = btoa(unescape(encodeURIComponent(seed)));
  return `CIELP-SIGN-${encoded.replace(/=+$/g, "").slice(0, 24)}`;
};

const exportMbiReportPdf = async ({ session, subjectLabel }) => {
  if (!session) {
    return;
  }

  const { jsPDF } = await import("jspdf");

  const resolveSessionDate = () =>
    getSessionDateObject(session?.date) || new Date();
  const reportDate = resolveSessionDate();
  const generatedAt = new Date();
  const logoDataUrl = await loadInstitutionalLogoDataUrl();
  const reportCode = buildReportCode({
    prefix: "MBI",
    date: generatedAt,
    subject: subjectLabel,
  });
  const digitalSignature = buildDigitalSignature({
    reportCode,
    issuedAt: generatedAt,
  });

  const formatDateTime = (dateValue) => {
    if (!dateValue || Number.isNaN(dateValue.getTime())) {
      return "-";
    }

    const formatted = dateValue.toLocaleString("es-CO", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz ? `${formatted} (${tz})` : formatted;
  };

  const createFileTimestamp = (dateValue) => {
    const pad = (value) => String(value).padStart(2, "0");
    return `${dateValue.getFullYear()}${pad(dateValue.getMonth() + 1)}${pad(
      dateValue.getDate(),
    )}_${pad(dateValue.getHours())}${pad(dateValue.getMinutes())}`;
  };

  const normalizedDiagnosis = String(session?.diagnostico || "").toLowerCase();
  const riskLevelLabel = normalizedDiagnosis.includes("severo")
    ? "Severo"
    : normalizedDiagnosis.includes("alto")
      ? "Alto"
      : normalizedDiagnosis.includes("moderado")
        ? "Moderado"
        : normalizedDiagnosis.includes("saludable")
          ? "Saludable"
          : "No concluyente";

  const ce = Number(session?.scores?.cansancio_emocional) || 0;
  const dp = Number(session?.scores?.despersonalizacion) || 0;
  const rp = Number(session?.scores?.realizacion_personal) || 0;

  const burnoutPressureIndex = ce + dp;
  const personalAchievementGuard = rp;

  const prioritizedFindings = [
    `Carga de desgaste (CE+DP): ${burnoutPressureIndex} puntos.`,
    `Reserva de realización personal (RP): ${personalAchievementGuard} puntos.`,
    `Clasificación global estimada: ${riskLevelLabel}.`,
  ];

  const recommendations = Array.isArray(session?.recomendaciones)
    ? session.recomendaciones
    : [];

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setProperties({
    title: "Informe Clinico MBI - CIELP",
    subject: "Analisis de riesgo de Burnout basado en MBI",
    author: "CIELP Plataforma de Bienestar",
    creator: "CIELP Dashboard",
    keywords: "MBI, burnout, bienestar, analisis clinico",
  });

  const marginX = 14;
  const maxWidth = 182;
  let cursorY = 18;

  const ensureSpace = (neededHeight = 10) => {
    if (cursorY + neededHeight > 282) {
      doc.addPage();
      cursorY = 16;
    }
  };

  const writeSectionTitle = (title) => {
    ensureSpace(8);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(title, marginX, cursorY);
    doc.setFont(undefined, "normal");
    cursorY += 6;
  };

  const writeParagraph = (text, size = 10.5, gap = 4) => {
    const lines = doc.splitTextToSize(String(text || ""), maxWidth);
    ensureSpace(lines.length * 4.6 + 1);
    doc.setFontSize(size);
    doc.text(lines, marginX, cursorY);
    cursorY += lines.length * 4.6 + gap;
  };

  const renderFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let index = 1; index <= pageCount; index += 1) {
      doc.setPage(index);
      doc.setFontSize(9);
      doc.setTextColor(110);
      doc.text(
        `CIELP · Informe MBI · Pagina ${index} de ${pageCount}`,
        marginX,
        292,
      );
      doc.setTextColor(0);
    }
  };

  const renderSimpleTable = ({ headers, rows, startY }) => {
    let tableY = startY;
    const tableWidth = maxWidth;
    const colWidth = tableWidth / Math.max(headers.length, 1);

    const drawRow = (cells, isHeader = false) => {
      ensureSpace(8);
      if (isHeader) {
        doc.setFillColor(239, 243, 246);
        doc.rect(marginX, tableY - 4.5, tableWidth, 7, "F");
      }

      cells.forEach((cell, index) => {
        const cellX = marginX + index * colWidth + 1.5;
        const text = String(cell || "-");
        const lines = doc.splitTextToSize(text, colWidth - 3);
        doc.setFontSize(isHeader ? 10 : 9.6);
        doc.setFont(undefined, isHeader ? "bold" : "normal");
        doc.text(lines.slice(0, 2), cellX, tableY);
        doc.setFont(undefined, "normal");
      });

      doc.setDrawColor(210);
      doc.line(marginX, tableY + 2.5, marginX + tableWidth, tableY + 2.5);
      tableY += 7;
    };

    drawRow(headers, true);
    rows.forEach((row) => drawRow(row, false));

    return tableY + 2;
  };

  // Portada institucional
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", marginX, cursorY - 4, 26, 26);
  }

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("CIELP · Informe Clinico MBI", marginX + 30, cursorY + 6);
  doc.setFont(undefined, "normal");

  cursorY += 18;
  doc.setFontSize(11);
  doc.text(`Codigo de informe: ${reportCode}`, marginX, cursorY);
  cursorY += 6;
  doc.text(
    `Docente evaluado: ${subjectLabel || "No disponible"}`,
    marginX,
    cursorY,
  );
  cursorY += 6;
  doc.text(
    `Fecha de evaluacion: ${formatDateTime(reportDate)}`,
    marginX,
    cursorY,
  );
  cursorY += 6;
  doc.text(
    `Fecha de emision: ${formatDateTime(generatedAt)}`,
    marginX,
    cursorY,
  );

  cursorY += 12;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Firma digital de emision", marginX, cursorY);
  doc.setFont(undefined, "normal");
  cursorY += 7;
  doc.setFontSize(10.5);
  doc.text(digitalSignature, marginX, cursorY);

  cursorY += 18;
  doc.setDrawColor(220);
  doc.line(marginX, cursorY, marginX + maxWidth, cursorY);
  cursorY += 7;
  doc.setFontSize(10.5);
  doc.text(
    "Documento de uso profesional para analisis y seguimiento de riesgo psicosocial.",
    marginX,
    cursorY,
  );

  doc.addPage();
  cursorY = 18;

  doc.setFontSize(17);
  doc.setFont(undefined, "bold");
  doc.text("Informe Clinico MBI", marginX, cursorY);
  doc.setFont(undefined, "normal");

  cursorY += 8;
  doc.setFontSize(10.5);
  doc.text(
    `Docente evaluado: ${subjectLabel || "No disponible"}`,
    marginX,
    cursorY,
  );

  cursorY += 5;
  doc.text(
    `Fecha de evaluacion: ${formatDateTime(reportDate)}`,
    marginX,
    cursorY,
  );

  cursorY += 5;
  doc.text(
    `Fecha de generacion: ${formatDateTime(generatedAt)}`,
    marginX,
    cursorY,
  );

  cursorY += 3;
  doc.line(marginX, cursorY, marginX + maxWidth, cursorY);
  cursorY += 6;

  writeSectionTitle("1. Resumen ejecutivo");
  writeParagraph(
    `El resultado presenta una clasificacion de riesgo ${riskLevelLabel}. Este informe integra puntajes por dimension, hallazgos prioritarios y recomendaciones orientadas a la toma de decisiones de autocuidado y seguimiento.`,
  );

  writeSectionTitle("2. Puntajes por dimension");
  writeParagraph(`Cansancio emocional (CE): ${ce} puntos.`);
  writeParagraph(`Despersonalizacion (DP): ${dp} puntos.`);
  writeParagraph(`Realizacion personal (RP): ${rp} puntos.`);

  writeSectionTitle("3. Hallazgos clave");
  prioritizedFindings.forEach((finding, index) => {
    writeParagraph(`${index + 1}. ${finding}`);
  });

  writeSectionTitle("4. Interpretacion clinica");
  writeParagraph(session.diagnostico || "Sin diagnostico disponible.");

  writeSectionTitle("5. Recomendaciones y plan de accion");

  if (!recommendations.length) {
    writeParagraph("No hay recomendaciones registradas para esta sesion.");
  } else {
    recommendations.forEach((recommendation, index) => {
      const symptom =
        recommendation?.sintoma_detectado || "Sintoma no especificado";
      const space =
        recommendation?.espacio_sugerido || "Espacio sugerido no disponible";
      const reason =
        recommendation?.motivo || "Sin justificacion clinica registrada.";

      writeParagraph(
        `${index + 1}. Prioridad ${index + 1}: ${symptom}. Intervencion sugerida: ${space}.`,
      );
      writeParagraph(`Justificacion: ${reason}`, 10, 5);
    });
  }

  writeSectionTitle("6. Nota metodologica");
  writeParagraph(
    "Instrumento de referencia: Maslach Burnout Inventory (MBI). Este reporte es un insumo de seguimiento y no reemplaza criterio clinico profesional integral.",
    10,
    3,
  );

  writeSectionTitle("7. Anexo tecnico - Evidencia por docente");
  const dimensionRows = [
    [
      "Cansancio emocional (CE)",
      String(ce),
      ce >= 27 ? "Alto" : ce >= 19 ? "Moderado" : "Bajo",
    ],
    [
      "Despersonalizacion (DP)",
      String(dp),
      dp >= 10 ? "Alto" : dp >= 6 ? "Moderado" : "Bajo",
    ],
    [
      "Realizacion personal (RP)",
      String(rp),
      rp < 34 ? "Riesgo" : rp < 40 ? "Intermedio" : "Protector",
    ],
  ];

  cursorY = renderSimpleTable({
    headers: ["Dimension", "Puntaje", "Zona"],
    rows: dimensionRows,
    startY: cursorY + 2,
  });

  writeSectionTitle("8. Anexo tecnico - Evidencia de recomendaciones");
  const recommendationRows = (
    recommendations.length
      ? recommendations
      : [
          {
            sintoma_detectado: "-",
            espacio_sugerido: "-",
            motivo: "Sin recomendaciones",
          },
        ]
  ).map((item) => [
    item?.sintoma_detectado || "-",
    item?.espacio_sugerido || "-",
    item?.motivo || "-",
  ]);

  cursorY = renderSimpleTable({
    headers: ["Sintoma detectado", "Intervencion", "Evidencia/justificacion"],
    rows: recommendationRows,
    startY: cursorY + 2,
  });

  renderFooter();

  const dateTag = createFileTimestamp(reportDate);
  const safeSubject = (subjectLabel || "docente")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();

  doc.save(`informe_mbi_analitico_${safeSubject}_${dateTag}.pdf`);
};

function DashboardMbiPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const userRole = useAuthStore((state) => state.user?.role);
  const authUser = useAuthStore((state) => state.user);
  const isTeacher = userRole === USER_ROLES.TEACHER;
  const canReviewTeacherHistory =
    userRole === USER_ROLES.SUPER_ADMIN ||
    userRole === USER_ROLES.ADMIN ||
    userRole === USER_ROLES.PSYCHOLOGIST;

  const questions = useDashboardMbiStore((state) => state.questions);
  const isLoadingQuestions = useDashboardMbiStore(
    (state) => state.isLoadingQuestions,
  );
  const questionsError = useDashboardMbiStore((state) => state.questionsError);
  const fetchQuestions = useDashboardMbiStore((state) => state.fetchQuestions);

  const myHistory = useDashboardMbiStore((state) => state.myHistory);
  const isLoadingMyHistory = useDashboardMbiStore(
    (state) => state.isLoadingMyHistory,
  );
  const myHistoryError = useDashboardMbiStore((state) => state.myHistoryError);
  const fetchMyHistory = useDashboardMbiStore((state) => state.fetchMyHistory);
  const mbiRetestStatus = useDashboardMbiStore(
    (state) => state.mbiRetestStatus,
  );
  const isLoadingMbiRetestStatus = useDashboardMbiStore(
    (state) => state.isLoadingMbiRetestStatus,
  );
  const mbiRetestStatusError = useDashboardMbiStore(
    (state) => state.mbiRetestStatusError,
  );
  const fetchMbiRetestStatus = useDashboardMbiStore(
    (state) => state.fetchMbiRetestStatus,
  );

  const spaces = useDashboardSpacesStore((state) => state.spaces);
  const fetchSpaces = useDashboardSpacesStore((state) => state.fetchSpaces);

  const teachers = useDashboardMbiStore((state) => state.teachers);
  const isLoadingTeachers = useDashboardMbiStore(
    (state) => state.isLoadingTeachers,
  );
  const teachersError = useDashboardMbiStore((state) => state.teachersError);
  const fetchTeachers = useDashboardMbiStore((state) => state.fetchTeachers);

  const selectedTeacherId = useDashboardMbiStore(
    (state) => state.selectedTeacherId,
  );
  const setSelectedTeacherId = useDashboardMbiStore(
    (state) => state.setSelectedTeacherId,
  );
  const selectedTeacherProfile = useDashboardMbiStore(
    (state) => state.selectedTeacherProfile,
  );
  const selectedTeacherHistory = useDashboardMbiStore(
    (state) => state.selectedTeacherHistory,
  );
  const isLoadingSelectedTeacherProfile = useDashboardMbiStore(
    (state) => state.isLoadingSelectedTeacherProfile,
  );
  const isLoadingSelectedTeacherHistory = useDashboardMbiStore(
    (state) => state.isLoadingSelectedTeacherHistory,
  );
  const selectedTeacherProfileError = useDashboardMbiStore(
    (state) => state.selectedTeacherProfileError,
  );
  const selectedTeacherHistoryError = useDashboardMbiStore(
    (state) => state.selectedTeacherHistoryError,
  );
  const fetchSelectedTeacherProfile = useDashboardMbiStore(
    (state) => state.fetchSelectedTeacherProfile,
  );
  const fetchSelectedTeacherHistory = useDashboardMbiStore(
    (state) => state.fetchSelectedTeacherHistory,
  );

  const isSubmittingMbiTest = useDashboardMbiStore(
    (state) => state.isSubmittingMbiTest,
  );
  const submitMbiTestError = useDashboardMbiStore(
    (state) => state.submitMbiTestError,
  );
  const submitMbiTestSuccessMessage = useDashboardMbiStore(
    (state) => state.submitMbiTestSuccessMessage,
  );
  const lastMbiResult = useDashboardMbiStore((state) => state.lastMbiResult);
  const submitMbiTest = useDashboardMbiStore((state) => state.submitMbiTest);
  const clearSubmissionStatus = useDashboardMbiStore(
    (state) => state.clearSubmissionStatus,
  );

  const [activeTab, setActiveTab] = useState("overview");
  const [answersByQuestion, setAnswersByQuestion] = useState({});
  const [isExportingMyReport, setIsExportingMyReport] = useState(false);
  const [
    isExportingSelectedTeacherReport,
    setIsExportingSelectedTeacherReport,
  ] = useState(false);
  const [pdfExportError, setPdfExportError] = useState("");
  const [hasAcceptedMbiIntro, setHasAcceptedMbiIntro] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionFlowError, setQuestionFlowError] = useState("");
  const [institutionalSummary, setInstitutionalSummary] = useState({
    totalTeachers: 0,
    teachersWithHistory: 0,
    teachersWithoutHistory: 0,
    totalEvaluations: 0,
    recentEvaluations30d: 0,
    evaluationTimestamps: [],
    teacherLatestCases: [],
    riskCounts: {
      high: 0,
      moderate: 0,
      low: 0,
      unknown: 0,
    },
    highestPriorityTeachers: [],
  });
  const [isLoadingInstitutionalSummary, setIsLoadingInstitutionalSummary] =
    useState(false);
  const [institutionalSummaryError, setInstitutionalSummaryError] =
    useState("");
  const [institutionalWindowDays, setInstitutionalWindowDays] = useState("all");
  const [institutionalRiskFilter, setInstitutionalRiskFilter] = useState("all");

  const content =
    ROLE_MBI_CONTENT[userRole] || ROLE_MBI_CONTENT[USER_ROLES.TEACHER];

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (!isTeacher) {
      return;
    }

    void fetchMyHistory();
    void fetchMbiRetestStatus();
    void fetchSpaces();
  }, [fetchMbiRetestStatus, fetchMyHistory, fetchSpaces, isTeacher]);

  const isMbiRetestLocked =
    isTeacher &&
    Boolean(mbiRetestStatus?.last_test_date) &&
    !mbiRetestStatus?.should_retake;

  const mbiDaysRemaining = Number(mbiRetestStatus?.days_remaining || 0);

  useEffect(() => {
    if (!isMbiRetestLocked) {
      return;
    }

    setHasAcceptedMbiIntro(false);
    setCurrentQuestionIndex(0);
  }, [isMbiRetestLocked]);

  useEffect(() => {
    if (!canReviewTeacherHistory) {
      return;
    }

    void fetchTeachers();
  }, [canReviewTeacherHistory, fetchTeachers]);

  const buildInstitutionalSummary = useCallback(async () => {
    if (!canReviewTeacherHistory) {
      return;
    }

    if (!teachers.length) {
      setInstitutionalSummary({
        totalTeachers: 0,
        teachersWithHistory: 0,
        teachersWithoutHistory: 0,
        totalEvaluations: 0,
        recentEvaluations30d: 0,
        evaluationTimestamps: [],
        teacherLatestCases: [],
        riskCounts: {
          high: 0,
          moderate: 0,
          low: 0,
          unknown: 0,
        },
        highestPriorityTeachers: [],
      });
      return;
    }

    setIsLoadingInstitutionalSummary(true);
    setInstitutionalSummaryError("");

    try {
      const perTeacherHistories = await Promise.all(
        teachers.map(async (teacher) => {
          try {
            const response = await getTeacherMbiHistoryApi(teacher.id);
            const history = Array.isArray(response?.data) ? response.data : [];

            return {
              teacher,
              history,
            };
          } catch {
            return {
              teacher,
              history: [],
            };
          }
        }),
      );

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const riskCounts = {
        high: 0,
        moderate: 0,
        low: 0,
        unknown: 0,
      };
      const teacherLatestCases = [];
      const evaluationTimestamps = [];

      const highestPriorityTeachers = [];

      const teachersWithHistory = perTeacherHistories.filter(
        (entry) => entry.history.length > 0,
      );

      let totalEvaluations = 0;
      let recentEvaluations30d = 0;

      perTeacherHistories.forEach((entry) => {
        totalEvaluations += entry.history.length;

        entry.history.forEach((session) => {
          const sessionDate = getSessionDateObject(session);
          if (sessionDate && sessionDate.getTime() >= thirtyDaysAgo) {
            recentEvaluations30d += 1;
          }
          if (sessionDate) {
            evaluationTimestamps.push(sessionDate.getTime());
          }
        });

        if (!entry.history.length) {
          return;
        }

        const latestSession = [...entry.history].sort(
          (leftSession, rightSession) => {
            const leftTime = getSessionDateObject(leftSession)?.getTime() || 0;
            const rightTime =
              getSessionDateObject(rightSession)?.getTime() || 0;
            return rightTime - leftTime;
          },
        )[0];

        const diagnosis = latestSession?.diagnostico || "";
        const riskBand = getRiskBand(diagnosis);
        riskCounts[riskBand] += 1;

        const teacherCase = {
          id: entry.teacher.id,
          fullName:
            `${entry.teacher?.given_name || ""} ${entry.teacher?.surname || ""}`.trim() ||
            entry.teacher?.email ||
            "Docente",
          diagnosis,
          date: latestSession?.date || latestSession?.created_at || null,
          riskBand,
        };

        teacherLatestCases.push(teacherCase);

        if (riskBand === "high") {
          highestPriorityTeachers.push(teacherCase);
        }
      });

      highestPriorityTeachers.sort((leftTeacher, rightTeacher) => {
        const leftTime =
          getSessionDateObject(leftTeacher?.date)?.getTime() || 0;
        const rightTime =
          getSessionDateObject(rightTeacher?.date)?.getTime() || 0;
        return rightTime - leftTime;
      });

      setInstitutionalSummary({
        totalTeachers: teachers.length,
        teachersWithHistory: teachersWithHistory.length,
        teachersWithoutHistory: Math.max(
          0,
          teachers.length - teachersWithHistory.length,
        ),
        totalEvaluations,
        recentEvaluations30d,
        evaluationTimestamps,
        teacherLatestCases,
        riskCounts,
        highestPriorityTeachers: highestPriorityTeachers.slice(0, 6),
      });
    } catch {
      setInstitutionalSummaryError(
        "No fue posible consolidar el panel institucional MBI en este momento.",
      );
    } finally {
      setIsLoadingInstitutionalSummary(false);
    }
  }, [canReviewTeacherHistory, teachers]);

  useEffect(() => {
    if (!canReviewTeacherHistory || !teachers.length) {
      return;
    }

    void buildInstitutionalSummary();
  }, [buildInstitutionalSummary, canReviewTeacherHistory, teachers.length]);

  const answeredCount = useMemo(
    () =>
      Object.values(answersByQuestion).filter((value) =>
        Number.isInteger(value),
      ).length,
    [answersByQuestion],
  );

  const canSubmitTest =
    isTeacher &&
    questions.length > 0 &&
    answeredCount === questions.length &&
    !isMbiRetestLocked &&
    !isSubmittingMbiTest;

  const selectedTeacherLabel = useMemo(() => {
    const selectedTeacher = teachers.find(
      (teacher) => teacher.id === selectedTeacherId,
    );

    if (!selectedTeacher) {
      return "";
    }

    return `${selectedTeacher.given_name || ""} ${selectedTeacher.surname || ""}`.trim();
  }, [selectedTeacherId, teachers]);

  const latestMyHistorySession = myHistory[0] || null;
  const latestMyRecommendation =
    latestMyHistorySession?.recomendaciones?.[0] || null;
  const matchedRecommendedSpace = useMemo(() => {
    const recommendedName = normalizeTextForMatch(
      latestMyRecommendation?.espacio_sugerido,
    );

    if (!recommendedName) {
      return null;
    }

    return (
      spaces.find((space) => {
        const normalizedSpaceName = normalizeTextForMatch(space?.name);

        return (
          normalizedSpaceName === recommendedName ||
          normalizedSpaceName.includes(recommendedName) ||
          recommendedName.includes(normalizedSpaceName)
        );
      }) || null
    );
  }, [latestMyRecommendation?.espacio_sugerido, spaces]);

  const latestSelectedTeacherSession = selectedTeacherHistory[0] || null;

  const isInstitutionalAllWindow = institutionalWindowDays === "all";

  const institutionalCasesInWindow = useMemo(() => {
    const cases = institutionalSummary.teacherLatestCases || [];

    if (!cases.length) {
      return [];
    }

    if (isInstitutionalAllWindow) {
      return cases;
    }

    const days = Number(institutionalWindowDays) || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return cases.filter((teacherCase) => {
      const caseTime = getSessionDateObject(teacherCase?.date)?.getTime();
      return Number.isFinite(caseTime) && caseTime >= cutoff;
    });
  }, [
    institutionalSummary.teacherLatestCases,
    institutionalWindowDays,
    isInstitutionalAllWindow,
  ]);

  const institutionalRiskCountsForWindow = useMemo(() => {
    const baseCounts = {
      high: 0,
      moderate: 0,
      low: 0,
      unknown: 0,
    };

    institutionalCasesInWindow.forEach((teacherCase) => {
      const riskBand = teacherCase?.riskBand || "unknown";
      if (riskBand in baseCounts) {
        baseCounts[riskBand] += 1;
      } else {
        baseCounts.unknown += 1;
      }
    });

    return baseCounts;
  }, [institutionalCasesInWindow]);

  const institutionalEvaluationsInWindow = useMemo(() => {
    if (isInstitutionalAllWindow) {
      return Number(institutionalSummary.totalEvaluations) || 0;
    }

    const days = Number(institutionalWindowDays) || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return (institutionalSummary.evaluationTimestamps || []).filter(
      (timestamp) => Number.isFinite(timestamp) && timestamp >= cutoff,
    ).length;
  }, [
    institutionalSummary.evaluationTimestamps,
    institutionalSummary.totalEvaluations,
    institutionalWindowDays,
    isInstitutionalAllWindow,
  ]);

  const filteredInstitutionalPriorityCases = useMemo(() => {
    const severityOrder = {
      high: 0,
      moderate: 1,
      low: 2,
      unknown: 3,
    };

    const byRisk = institutionalCasesInWindow.filter((teacherCase) => {
      if (institutionalRiskFilter === "all") {
        return true;
      }

      return (teacherCase?.riskBand || "unknown") === institutionalRiskFilter;
    });

    return [...byRisk]
      .sort((leftCase, rightCase) => {
        const leftSeverity = severityOrder[leftCase?.riskBand] ?? 99;
        const rightSeverity = severityOrder[rightCase?.riskBand] ?? 99;

        if (leftSeverity !== rightSeverity) {
          return leftSeverity - rightSeverity;
        }

        const leftTime = getSessionDateObject(leftCase?.date)?.getTime() || 0;
        const rightTime = getSessionDateObject(rightCase?.date)?.getTime() || 0;
        return rightTime - leftTime;
      })
      .slice(0, 10);
  }, [institutionalCasesInWindow, institutionalRiskFilter]);

  const institutionalRiskFilterLabel = useMemo(() => {
    if (institutionalRiskFilter === "high") {
      return "Riesgo alto/severo";
    }

    if (institutionalRiskFilter === "moderate") {
      return "Riesgo moderado";
    }

    if (institutionalRiskFilter === "low") {
      return "Riesgo bajo/saludable";
    }

    if (institutionalRiskFilter === "unknown") {
      return "Sin clasificar";
    }

    return "Todos los riesgos";
  }, [institutionalRiskFilter]);

  const myTrendSeries = useMemo(() => getTrendSeries(myHistory), [myHistory]);
  const selectedTeacherTrendSeries = useMemo(
    () => getTrendSeries(selectedTeacherHistory),
    [selectedTeacherHistory],
  );

  const currentQuestion =
    questions.length > 0 && currentQuestionIndex < questions.length
      ? questions[currentQuestionIndex]
      : null;
  const isReviewStep =
    hasAcceptedMbiIntro &&
    questions.length > 0 &&
    currentQuestionIndex === questions.length;
  const isLastQuestion =
    questions.length > 0 && currentQuestionIndex === questions.length - 1;
  const flowProgressPct =
    questions.length > 0
      ? Math.round(
          (Math.min(currentQuestionIndex + 1, questions.length) /
            questions.length) *
            100,
        )
      : 0;

  const handleAnswerChange = (questionId, score) => {
    clearSubmissionStatus();
    setQuestionFlowError("");
    setAnswersByQuestion((current) => ({
      ...current,
      [questionId]: score,
    }));
  };

  const handleSubmitTest = async () => {
    const payload = questions.map((question) => ({
      question_id: question.id,
      score: Number(answersByQuestion[question.id]),
    }));

    const result = await submitMbiTest({ answers: payload });

    if (!result.ok) {
      return;
    }

    setAnswersByQuestion({});
    setHasAcceptedMbiIntro(false);
    setCurrentQuestionIndex(0);
    setQuestionFlowError("");
    setActiveTab("history");
  };

  const handleStartTeacherTestFlow = () => {
    clearSubmissionStatus();
    setQuestionFlowError("");
    setCurrentQuestionIndex(0);
    setHasAcceptedMbiIntro(true);
  };

  const handleGoToNextQuestion = () => {
    if (!currentQuestion) {
      return;
    }

    const currentAnswer = answersByQuestion[currentQuestion.id];
    if (!Number.isInteger(currentAnswer)) {
      setQuestionFlowError(
        "Selecciona una opcion para continuar con la siguiente pregunta.",
      );
      return;
    }

    setQuestionFlowError("");
    setCurrentQuestionIndex((previousValue) =>
      Math.min(previousValue + 1, questions.length),
    );
  };

  const handleGoToPreviousQuestion = () => {
    setQuestionFlowError("");
    setCurrentQuestionIndex((previousValue) => Math.max(previousValue - 1, 0));
  };

  const handleExportMyLatestReport = async () => {
    if (!latestMyHistorySession || isExportingMyReport) {
      return;
    }

    try {
      setPdfExportError("");
      setIsExportingMyReport(true);
      await exportMbiReportPdf({
        session: latestMyHistorySession,
        subjectLabel:
          `${authUser?.given_name || ""} ${authUser?.surname || ""}`.trim(),
      });
    } catch {
      setPdfExportError("No fue posible exportar el informe PDF.");
    } finally {
      setIsExportingMyReport(false);
    }
  };

  const handleExportSelectedTeacherLatestReport = async () => {
    if (!latestSelectedTeacherSession || isExportingSelectedTeacherReport) {
      return;
    }

    try {
      setPdfExportError("");
      setIsExportingSelectedTeacherReport(true);
      await exportMbiReportPdf({
        session: latestSelectedTeacherSession,
        subjectLabel: selectedTeacherLabel,
      });
    } catch {
      setPdfExportError("No fue posible exportar el informe PDF.");
    } finally {
      setIsExportingSelectedTeacherReport(false);
    }
  };

  const handleOpenTeacherMbiCase = (teacherId) => {
    if (!teacherId) {
      return;
    }

    setSelectedTeacherId(teacherId);
    void fetchSelectedTeacherProfile(teacherId);
    void fetchSelectedTeacherHistory(teacherId);
  };

  const renderQuestionCatalog = () => (
    <DashboardSectionCard
      title="Catálogo oficial MBI"
      description="Este catálogo se consume desde el endpoint institucional de preguntas MBI."
    >
      {questionsError ? <Alert severity="error">{questionsError}</Alert> : null}

      {isLoadingQuestions ? (
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
            Cargando preguntas MBI...
          </Typography>
        </Stack>
      ) : null}

      {!isLoadingQuestions && questions.length > 0 ? (
        <Stack spacing={0.6}>
          {questions.map((question) => (
            <Typography
              key={question.id}
              variant="body2"
              color="text.secondary"
            >
              {question.question_number}. {question.statement}
            </Typography>
          ))}
        </Stack>
      ) : null}
    </DashboardSectionCard>
  );

  const renderTeacherTest = () => (
    <DashboardSectionCard
      title="Resolver evaluación MBI"
      description="Espacio guiado para responder el inventario de forma gradual, clara y sin sobrecarga visual."
    >
      {submitMbiTestError ? (
        <Alert severity="error">{submitMbiTestError}</Alert>
      ) : null}

      {mbiRetestStatusError ? (
        <Alert severity="error">{mbiRetestStatusError}</Alert>
      ) : null}

      {isMbiRetestLocked ? (
        <Alert severity="info">
          Aún está en su proceso de mejora. Su próxima evaluación MBI estará
          disponible en {mbiDaysRemaining} día(s).
        </Alert>
      ) : null}

      {submitMbiTestSuccessMessage ? (
        <Alert severity="success">{submitMbiTestSuccessMessage}</Alert>
      ) : null}

      {pdfExportError ? <Alert severity="error">{pdfExportError}</Alert> : null}

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
      >
        <Chip label={`Preguntas: ${questions.length}`} />
        <Chip
          label={`Respondidas: ${answeredCount}`}
          color="primary"
        />
        {hasAcceptedMbiIntro ? (
          <Chip label={`Avance: ${flowProgressPct}%`} />
        ) : null}
      </Stack>

      {!hasAcceptedMbiIntro ? (
        <Paper
          variant="outlined"
          sx={{ p: { xs: 1.8, md: 2.2 }, borderRadius: 1.2 }}
        >
          <Stack spacing={1.4}>
            <Typography variant="h6">Antes de comenzar</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Este cuestionario contiene 22 ítems y está diseñado para conocer
              cómo se ha sentido en su labor docente. No hay respuestas buenas
              ni malas.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Le recomendamos responder con calma y sinceridad, según su
              experiencia real de las últimas semanas.
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 1.2, borderRadius: 1 }}
            >
              <Stack spacing={0.8}>
                <Typography variant="subtitle2">Escala de respuesta</Typography>
                {MBI_SCORE_OPTIONS.map((score) => (
                  <Box
                    key={`scale-guide-${score}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      px: 1,
                      py: 0.7,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 24,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        bgcolor: "action.hover",
                        color: "text.primary",
                        flexShrink: 0,
                      }}
                    >
                      {score}
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.2,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {MBI_SCORE_LABELS[score]}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Tiempo estimado: 6 a 10 minutos.
              </Typography>

              <Button
                variant="contained"
                size="large"
                onClick={handleStartTeacherTestFlow}
                disabled={
                  isLoadingQuestions ||
                  isLoadingMbiRetestStatus ||
                  questions.length === 0 ||
                  isMbiRetestLocked
                }
                sx={{ minWidth: 220 }}
              >
                {isMbiRetestLocked
                  ? `Disponible en ${mbiDaysRemaining} día(s)`
                  : "Iniciar evaluación guiada"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {hasAcceptedMbiIntro && currentQuestion ? (
        <Paper
          variant="outlined"
          sx={{ p: { xs: 1.8, md: 2.2 }, borderRadius: 1.2 }}
        >
          <Fade
            in
            timeout={260}
            key={`question-step-${currentQuestion.id}`}
          >
            <Stack spacing={1.5}>
              <Stack spacing={0.8}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="subtitle2">
                    Pregunta {currentQuestionIndex + 1} de {questions.length}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {flowProgressPct}% completado
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={flowProgressPct}
                />
              </Stack>

              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1.02rem", md: "1.15rem" } }}
              >
                {currentQuestion.question_number}. {currentQuestion.statement}
              </Typography>

              <Grid
                container
                spacing={1}
              >
                {MBI_SCORE_OPTIONS.map((score) => {
                  const isSelected =
                    answersByQuestion[currentQuestion.id] === score;

                  return (
                    <Grid
                      key={`${currentQuestion.id}-${score}`}
                      item
                      xs={12}
                      sm={6}
                      md={4}
                    >
                      <Button
                        fullWidth
                        variant={isSelected ? "contained" : "outlined"}
                        color={isSelected ? "primary" : "inherit"}
                        onClick={() =>
                          handleAnswerChange(currentQuestion.id, score)
                        }
                        sx={{
                          justifyContent: "flex-start",
                          alignItems: "center",
                          textTransform: "none",
                          py: 1.1,
                          px: 1.3,
                          gap: 1.1,
                          borderRadius: 1.2,
                        }}
                      >
                        <Box
                          sx={{
                            minWidth: 28,
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            bgcolor: isSelected
                              ? "rgba(255,255,255,0.22)"
                              : "action.hover",
                            color: isSelected ? "inherit" : "text.primary",
                            flexShrink: 0,
                          }}
                        >
                          {score}
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{
                            textAlign: "left",
                            fontWeight: isSelected ? 700 : 600,
                            lineHeight: 1.25,
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                          }}
                        >
                          {MBI_SCORE_LABELS[score]}
                        </Typography>
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>

              {questionFlowError ? (
                <Alert severity="warning">{questionFlowError}</Alert>
              ) : null}

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
              >
                <Button
                  variant="outlined"
                  disabled={currentQuestionIndex === 0}
                  onClick={handleGoToPreviousQuestion}
                >
                  Anterior
                </Button>

                <Button
                  variant="contained"
                  onClick={handleGoToNextQuestion}
                >
                  {isLastQuestion ? "Ir al resumen" : "Siguiente"}
                </Button>
              </Stack>
            </Stack>
          </Fade>
        </Paper>
      ) : null}

      {isReviewStep ? (
        <Paper
          variant="outlined"
          sx={{ p: { xs: 1.8, md: 2.2 }, borderRadius: 1.2 }}
        >
          <Fade
            in
            timeout={260}
            key="review-step"
          >
            <Stack spacing={1.4}>
              <Typography variant="h6">Resumen antes de enviar</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Revise este resumen final. Si todo está correcto, envíe su
                evaluación para generar el resultado institucional.
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip
                  color="primary"
                  label={`Respondidas: ${answeredCount}/${questions.length}`}
                />
                <Chip label="Estado: listo para enviar" />
              </Stack>

              {!canSubmitTest ? (
                <Alert severity="warning">
                  Aún faltan respuestas por registrar. Puede volver a revisar
                  sus respuestas antes del envío final.
                </Alert>
              ) : null}

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
              >
                <Button
                  variant="outlined"
                  onClick={handleGoToPreviousQuestion}
                >
                  Revisar respuestas
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmitTest}
                  disabled={!canSubmitTest || isSubmittingMbiTest}
                >
                  {isSubmittingMbiTest
                    ? "Enviando evaluación..."
                    : isMbiRetestLocked
                      ? `Disponible en ${mbiDaysRemaining} dia(s)`
                      : "Confirmar y enviar"}
                </Button>
              </Stack>
            </Stack>
          </Fade>
        </Paper>
      ) : null}
    </DashboardSectionCard>
  );

  const renderHistoryCards = (history) => {
    if (!history?.length) {
      return (
        <Alert severity="info">Aún no existen evaluaciones registradas.</Alert>
      );
    }

    return (
      <Stack spacing={1.2}>
        {history.map((session) => (
          <Paper
            key={session.session_id}
            variant="outlined"
            sx={{ p: 1.8, borderRadius: 1.25 }}
          >
            <Stack spacing={1}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Typography variant="subtitle2">
                  Fecha: {formatDateLabel(session.date)}
                </Typography>
                <Chip
                  size="small"
                  color={getRiskChipColor(session.diagnostico)}
                  label="Resultado evaluado"
                />
              </Stack>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {session.diagnostico}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip
                  label={`CE: ${session.scores?.cansancio_emocional ?? 0}`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`DP: ${session.scores?.despersonalizacion ?? 0}`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`RP: ${session.scores?.realizacion_personal ?? 0}`}
                  variant="outlined"
                  size="small"
                />
              </Stack>

              <List
                dense
                sx={{ py: 0 }}
              >
                {(session.recomendaciones || []).map(
                  (recommendation, index) => (
                    <ListItem
                      key={`${session.session_id}-rec-${index}`}
                      disableGutters
                    >
                      <ListItemText
                        primary={`${recommendation.sintoma_detectado}: ${recommendation.espacio_sugerido}`}
                        secondary={recommendation.motivo}
                      />
                    </ListItem>
                  ),
                )}
              </List>
            </Stack>
          </Paper>
        ))}
      </Stack>
    );
  };

  const renderTeacherHistory = () => (
    <DashboardSectionCard
      title="Mi historial MBI"
      description="Consulta tus evaluaciones previas y recomendaciones clínicas emitidas por el motor MBI."
    >
      {myHistoryError ? <Alert severity="error">{myHistoryError}</Alert> : null}

      {isLoadingMyHistory ? (
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
            Cargando historial...
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={1.2}>
          {myHistory.length > 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 1.8, borderRadius: 1.25 }}
            >
              <Stack spacing={1.1}>
                <Typography variant="h6">Siguiente paso recomendado</Typography>

                {latestMyRecommendation ? (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Con base en su última evaluación MBI, el espacio sugerido
                      para continuar su plan de bienestar es
                      <strong>
                        {" "}
                        {latestMyRecommendation.espacio_sugerido}
                      </strong>
                      .
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Motivo clínico:{" "}
                      {latestMyRecommendation.motivo || "Sin detalle"}
                    </Typography>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", sm: "center" }}
                    >
                      <Button
                        variant="contained"
                        onClick={() => {
                          if (matchedRecommendedSpace?.id) {
                            navigate(
                              `/dashboard/espacios/${matchedRecommendedSpace.id}/inmersion`,
                            );
                            return;
                          }

                          navigate("/dashboard/espacios");
                        }}
                      >
                        {matchedRecommendedSpace?.id
                          ? "Iniciar espacio recomendado"
                          : "Ver espacios sugeridos"}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          navigate("/dashboard/espacios/historial")
                        }
                      >
                        Ver historial de espacios
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Aún no hay recomendación de espacio en su resultado más
                      reciente. Puede revisar su historial o ir a espacios para
                      iniciar una práctica guiada.
                    </Typography>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", sm: "center" }}
                    >
                      <Button
                        variant="contained"
                        onClick={() => navigate("/dashboard/espacios")}
                      >
                        Ir a Mis espacios digitales
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          navigate("/dashboard/espacios/historial")
                        }
                      >
                        Ver historial de espacios
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>
          ) : null}

          {myHistory.length > 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 1.8, borderRadius: 1.25 }}
            >
              <Stack spacing={1.2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Typography variant="subtitle2">
                    Tendencia por dimensión
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadRoundedIcon />}
                    onClick={handleExportMyLatestReport}
                    disabled={!latestMyHistorySession || isExportingMyReport}
                  >
                    {isExportingMyReport
                      ? "Exportando..."
                      : "Exportar último informe (PDF)"}
                  </Button>
                </Stack>

                <Box sx={{ overflowX: "auto" }}>
                  <LineChart
                    width={isDesktop ? 760 : 320}
                    height={280}
                    xAxis={[
                      {
                        scaleType: "point",
                        data: myTrendSeries.labels,
                      },
                    ]}
                    series={[
                      {
                        id: "ce",
                        label: "CE",
                        data: myTrendSeries.ce,
                        color: "#e53935",
                      },
                      {
                        id: "dp",
                        label: "DP",
                        data: myTrendSeries.dp,
                        color: "#fb8c00",
                      },
                      {
                        id: "rp",
                        label: "RP",
                        data: myTrendSeries.rp,
                        color: "#00897b",
                      },
                    ]}
                    margin={{ left: 50, right: 20, top: 20, bottom: 40 }}
                  />
                </Box>
              </Stack>
            </Paper>
          ) : null}

          {renderHistoryCards(myHistory)}
        </Stack>
      )}
    </DashboardSectionCard>
  );

  const renderLastResult = () => {
    if (!lastMbiResult) {
      return null;
    }

    return (
      <DashboardSectionCard
        title="Último resultado registrado"
        description="Resumen de la última evaluación enviada exitosamente."
      >
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {lastMbiResult.diagnostico}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          <Chip
            label={`CE: ${lastMbiResult.scores?.cansancio_emocional ?? 0}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`DP: ${lastMbiResult.scores?.despersonalizacion ?? 0}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`RP: ${lastMbiResult.scores?.realizacion_personal ?? 0}`}
            size="small"
            variant="outlined"
          />
        </Stack>
      </DashboardSectionCard>
    );
  };

  const renderTeacherHistoryReview = () => (
    <DashboardSectionCard
      title="Historial MBI por docente"
      description="Consulta historiales individuales para seguimiento clínico y administrativo."
    >
      {teachersError ? <Alert severity="error">{teachersError}</Alert> : null}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.2}
      >
        <FormControl sx={{ minWidth: { xs: "100%", md: 360 } }}>
          <InputLabel id="teacher-mbi-history-label">Docente</InputLabel>
          <Select
            labelId="teacher-mbi-history-label"
            value={selectedTeacherId}
            label="Docente"
            onChange={(event) => setSelectedTeacherId(event.target.value)}
            disabled={isLoadingTeachers}
          >
            {teachers.map((teacher) => (
              <MenuItem
                key={teacher.id}
                value={teacher.id}
              >
                {`${teacher.given_name || ""} ${teacher.surname || ""}`.trim() ||
                  "Docente"}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<RefreshRoundedIcon />}
          disabled={
            !selectedTeacherId ||
            isLoadingSelectedTeacherHistory ||
            isLoadingSelectedTeacherProfile
          }
          onClick={() => {
            void fetchSelectedTeacherProfile(selectedTeacherId);
            void fetchSelectedTeacherHistory(selectedTeacherId);
          }}
        >
          Consultar historial
        </Button>
      </Stack>

      {selectedTeacherProfileError ? (
        <Alert severity="error">{selectedTeacherProfileError}</Alert>
      ) : null}

      {selectedTeacherHistoryError ? (
        <Alert severity="error">{selectedTeacherHistoryError}</Alert>
      ) : null}

      {pdfExportError ? <Alert severity="error">{pdfExportError}</Alert> : null}

      {isLoadingSelectedTeacherHistory ? (
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
            Cargando historial del docente...
          </Typography>
        </Stack>
      ) : selectedTeacherId ? (
        <Stack spacing={1}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
          >
            Docente seleccionado: {selectedTeacherLabel || "-"}
          </Typography>

          {isLoadingSelectedTeacherProfile ? (
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
                Cargando ficha del docente...
              </Typography>
            </Stack>
          ) : selectedTeacherProfile ? (
            <Paper
              variant="outlined"
              sx={{ p: 1.6, borderRadius: 1 }}
            >
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip
                  size="small"
                  label={`Correo: ${selectedTeacherProfile.email || "-"}`}
                />
                <Chip
                  size="small"
                  label={`Teléfono: ${selectedTeacherProfile.phone || "-"}`}
                />
                <Chip
                  size="small"
                  label={`Sexo: ${selectedTeacherProfile.sex || "-"}`}
                />
                <Chip
                  size="small"
                  label={`Nacimiento: ${formatDateOnlyLabel(selectedTeacherProfile.date_of_birth)}`}
                />
              </Stack>
            </Paper>
          ) : null}

          {selectedTeacherHistory.length > 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 1.8, borderRadius: 1.25 }}
            >
              <Stack spacing={1.2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Typography variant="subtitle2">
                    Tendencia por dimensión del docente
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadRoundedIcon />}
                    onClick={handleExportSelectedTeacherLatestReport}
                    disabled={
                      !latestSelectedTeacherSession ||
                      isExportingSelectedTeacherReport
                    }
                  >
                    {isExportingSelectedTeacherReport
                      ? "Exportando..."
                      : "Exportar último informe (PDF)"}
                  </Button>
                </Stack>

                <Box sx={{ overflowX: "auto" }}>
                  <LineChart
                    width={isDesktop ? 760 : 320}
                    height={280}
                    xAxis={[
                      {
                        scaleType: "point",
                        data: selectedTeacherTrendSeries.labels,
                      },
                    ]}
                    series={[
                      {
                        id: "selected-ce",
                        label: "CE",
                        data: selectedTeacherTrendSeries.ce,
                        color: "#e53935",
                      },
                      {
                        id: "selected-dp",
                        label: "DP",
                        data: selectedTeacherTrendSeries.dp,
                        color: "#fb8c00",
                      },
                      {
                        id: "selected-rp",
                        label: "RP",
                        data: selectedTeacherTrendSeries.rp,
                        color: "#00897b",
                      },
                    ]}
                    margin={{ left: 50, right: 20, top: 20, bottom: 40 }}
                  />
                </Box>
              </Stack>
            </Paper>
          ) : null}

          {renderHistoryCards(selectedTeacherHistory)}
        </Stack>
      ) : (
        <Alert severity="info">
          Selecciona un docente para consultar su historial MBI.
        </Alert>
      )}
    </DashboardSectionCard>
  );

  const renderInstitutionalOverview = () => (
    <DashboardSectionCard
      title="Vista institucional MBI"
      description="Consolidado operativo para priorización clínica y seguimiento administrativo de docentes."
    >
      {teachersError ? <Alert severity="error">{teachersError}</Alert> : null}
      {institutionalSummaryError ? (
        <Alert severity="error">{institutionalSummaryError}</Alert>
      ) : null}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          <Chip label={`Docentes: ${institutionalSummary.totalTeachers}`} />
          <Chip
            color="success"
            label={`Con historial: ${institutionalSummary.teachersWithHistory}`}
          />
          <Chip
            color="default"
            label={`Sin historial: ${institutionalSummary.teachersWithoutHistory}`}
          />
          <Chip
            color="primary"
            label={`Evaluaciones: ${institutionalSummary.totalEvaluations}`}
          />
          <Chip
            label={
              isInstitutionalAllWindow
                ? `Todo el historial: ${institutionalEvaluationsInWindow}`
                : `Últimos ${institutionalWindowDays} días: ${institutionalEvaluationsInWindow}`
            }
          />
        </Stack>

        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          onClick={async () => {
            await fetchTeachers({ force: true });
            await buildInstitutionalSummary();
          }}
          disabled={isLoadingTeachers || isLoadingInstitutionalSummary}
        >
          {isLoadingInstitutionalSummary
            ? "Actualizando consolidado..."
            : "Actualizar consolidado"}
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        sx={{ p: 1.4, borderRadius: 1.2 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
        >
          <FormControl sx={{ minWidth: { xs: "100%", md: 220 } }}>
            <InputLabel id="mbi-window-filter-label">Ventana</InputLabel>
            <Select
              labelId="mbi-window-filter-label"
              value={institutionalWindowDays}
              label="Ventana"
              onChange={(event) => {
                const value = String(event.target.value);
                setInstitutionalWindowDays(
                  value === "all" ? "all" : String(Number(value) || 30),
                );
              }}
            >
              <MenuItem value="all">Todo el historial</MenuItem>
              <MenuItem value={7}>Últimos 7 días</MenuItem>
              <MenuItem value={30}>Últimos 30 días</MenuItem>
              <MenuItem value={90}>Últimos 90 días</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: { xs: "100%", md: 260 } }}>
            <InputLabel id="mbi-risk-filter-label">Nivel de riesgo</InputLabel>
            <Select
              labelId="mbi-risk-filter-label"
              value={institutionalRiskFilter}
              label="Nivel de riesgo"
              onChange={(event) =>
                setInstitutionalRiskFilter(String(event.target.value))
              }
            >
              <MenuItem value="all">Todos los riesgos</MenuItem>
              <MenuItem value="high">Riesgo alto/severo</MenuItem>
              <MenuItem value="moderate">Riesgo moderado</MenuItem>
              <MenuItem value="low">Riesgo bajo/saludable</MenuItem>
              <MenuItem value="unknown">Sin clasificar</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{ p: 1.4, borderRadius: 1.2 }}
      >
        <Stack spacing={1}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
          >
            Distribución de riesgo según última evaluación por docente
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
          >
            <Chip
              color="error"
              label={`Riesgo alto/severo: ${institutionalRiskCountsForWindow.high}`}
            />
            <Chip
              color="warning"
              label={`Riesgo moderado: ${institutionalRiskCountsForWindow.moderate}`}
            />
            <Chip
              color="success"
              label={`Riesgo bajo/saludable: ${institutionalRiskCountsForWindow.low}`}
            />
            <Chip
              label={`Sin clasificar: ${institutionalRiskCountsForWindow.unknown}`}
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{ p: 1.4, borderRadius: 1.2 }}
      >
        <Stack spacing={1}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
          >
            Casos para revisión clínica ({institutionalRiskFilterLabel})
          </Typography>

          {filteredInstitutionalPriorityCases.length === 0 ? (
            <Alert severity="info">
              {isInstitutionalAllWindow
                ? "No se encontraron casos para el filtro seleccionado en todo el historial disponible."
                : `No se encontraron casos para el filtro seleccionado en los últimos ${institutionalWindowDays} días.`}
            </Alert>
          ) : (
            <Stack spacing={0.9}>
              {filteredInstitutionalPriorityCases.map((teacherCase) => (
                <Paper
                  key={`mbi-priority-${teacherCase.id}`}
                  variant="outlined"
                  sx={{ p: 1.2, borderRadius: 1 }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    <Box>
                      <Typography variant="subtitle2">
                        {teacherCase.fullName}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {teacherCase.diagnosis || "Sin diagnóstico"} | Última
                        evaluación: {formatDateLabel(teacherCase.date)}
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenTeacherMbiCase(teacherCase.id)}
                    >
                      Abrir historial del docente
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </DashboardSectionCard>
  );

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

      {isTeacher ? (
        <>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
          >
            <Tab
              value="overview"
              label="Catálogo"
            />
            <Tab
              value="test"
              label="Resolver test"
            />
            <Tab
              value="history"
              label="Mi historial"
            />
          </Tabs>

          {activeTab === "overview" ? renderQuestionCatalog() : null}
          {activeTab === "test" ? renderTeacherTest() : null}
          {activeTab === "history" ? renderTeacherHistory() : null}
          {renderLastResult()}
        </>
      ) : null}

      {!isTeacher ? renderQuestionCatalog() : null}
      {canReviewTeacherHistory ? renderInstitutionalOverview() : null}
      {canReviewTeacherHistory ? renderTeacherHistoryReview() : null}

      {!isTeacher && !canReviewTeacherHistory ? (
        <DashboardSectionCard
          title={content.title}
          description="Para tu rol este módulo funciona en modo consulta del catálogo MBI."
        />
      ) : null}
    </Stack>
  );
}

export default DashboardMbiPage;
