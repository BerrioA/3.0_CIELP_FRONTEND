import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import SelfImprovementRoundedIcon from "@mui/icons-material/SelfImprovementRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import { useEffect, useMemo, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { Link as RouterLink } from "react-router-dom";
import DashboardSectionCard from "../components/DashboardSectionCard";
import { useAuthStore } from "../../auth/store/auth.store";
import { USER_ROLES } from "../config/roles";
import { useDashboardMbiStore } from "../store/dashboard-mbi.store";
import { useDashboardSpacesStore } from "../store/dashboard-spaces.store";
import {
  getMyBurnoutAlertsApi,
  markBurnoutAlertAsReadApi,
} from "../services/mbi-alerts.service";
import {
  GLOBAL_ANALYTICS_PERIODS,
  useDashboardAnalyticsStore,
} from "../store/dashboard-analytics.store";

const ROLE_CONTENT = {
  [USER_ROLES.PSYCHOLOGIST]: {
    heading: "Panel de acompañamiento",
    cards: [
      {
        title: "Casos prioritarios",
        description:
          "Identificación de docentes con señales de riesgo para intervención clínica oportuna.",
      },
      {
        title: "Evolución emocional",
        description:
          "Comparativo de progreso por periodos para evaluar impacto del acompañamiento.",
      },
      {
        title: "Plan de intervención",
        description:
          "Agenda sugerida de seguimiento individual y estrategias de cuidado.",
      },
    ],
  },
  [USER_ROLES.TEACHER]: {
    heading: "Tu panel de bienestar",
    cards: [
      {
        title: "Estado personal",
        description:
          "Resumen de tu progreso y resultados recientes en evaluaciones de bienestar.",
      },
      {
        title: "Rutina de autocuidado",
        description:
          "Accesos directos a ejercicios guiados y espacios digitales recomendados.",
      },
      {
        title: "Próximos pasos",
        description:
          "Sugerencias personalizadas para mantener equilibrio y prevenir desgaste.",
      },
    ],
  },
  [USER_ROLES.DEVELOPER]: {
    heading: "Panel técnico",
    cards: [
      {
        title: "Salud del sistema",
        description:
          "Monitoreo de endpoints críticos, sesiones activas y comportamiento general de la API.",
      },
      {
        title: "Integraciones activas",
        description:
          "Estado de autenticación, notificaciones y flujos clave en producción.",
      },
      {
        title: "Observabilidad",
        description:
          "Puntos de mejora para rendimiento, seguridad y experiencia de usuario.",
      },
    ],
  },
};

const PERIOD_OPTIONS = [
  { value: GLOBAL_ANALYTICS_PERIODS.TODAY, label: "Hoy" },
  { value: GLOBAL_ANALYTICS_PERIODS.WEEK, label: "Semana" },
  { value: GLOBAL_ANALYTICS_PERIODS.MONTH, label: "Mes" },
];

const getTrafficLightChipColor = (trafficLightColor) => {
  if (trafficLightColor === "error") {
    return "error";
  }

  if (trafficLightColor === "warning") {
    return "warning";
  }

  return "success";
};

const getTeacherDiagnosisChipColor = (diagnosis = "") => {
  const normalized = String(diagnosis).toLowerCase();

  if (normalized.includes("severo") || normalized.includes("alto")) {
    return "error";
  }

  if (normalized.includes("moderado")) {
    return "warning";
  }

  if (normalized.includes("saludable") || normalized.includes("bajo")) {
    return "success";
  }

  return "default";
};

const getClinicalZoneByDimension = (dimension, value) => {
  const numericValue = Number(value) || 0;

  if (dimension === "ce") {
    if (numericValue >= 27) {
      return { label: "CE alto", color: "error", threshold: "Alto >= 27" };
    }
    if (numericValue >= 19) {
      return {
        label: "CE moderado",
        color: "warning",
        threshold: "Moderado 19-26",
      };
    }
    return { label: "CE bajo", color: "success", threshold: "Bajo <= 18" };
  }

  if (dimension === "dp") {
    if (numericValue >= 10) {
      return { label: "DP alto", color: "error", threshold: "Alto >= 10" };
    }
    if (numericValue >= 6) {
      return {
        label: "DP moderado",
        color: "warning",
        threshold: "Moderado 6-9",
      };
    }
    return { label: "DP bajo", color: "success", threshold: "Bajo <= 5" };
  }

  if (numericValue < 34) {
    return { label: "RP en riesgo", color: "error", threshold: "Riesgo < 34" };
  }

  if (numericValue < 40) {
    return {
      label: "RP intermedio",
      color: "warning",
      threshold: "Intermedio 34-39",
    };
  }

  return {
    label: "RP protector",
    color: "success",
    threshold: "Protector >= 40",
  };
};

const formatDateLabel = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDayMonthLabel = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
  });
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

const buildExecutiveReportCode = ({ date, periodLabel }) => {
  const pad = (value) => String(value).padStart(2, "0");
  const ymd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const hm = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  const periodTag = String(periodLabel || "PERIODO")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();

  return `EJEC-${ymd}-${hm}-${periodTag || "PERIODO"}`;
};

const buildDigitalSignature = ({ reportCode, issuedAt }) => {
  const seed = `${reportCode}|${issuedAt.toISOString()}|CIELP`;
  const encoded = btoa(unescape(encodeURIComponent(seed)));
  return `CIELP-SIGN-${encoded.replace(/=+$/g, "").slice(0, 24)}`;
};

const buildExecutiveExportPdf = async ({
  periodLabel,
  generatedAt,
  semaforo,
  cobertura,
  cohortes,
  casosCriticos,
  recomendaciones,
  technicalEvidence,
}) => {
  const { jsPDF } = await import("jspdf");

  const reportGeneratedAt = generatedAt ? new Date(generatedAt) : new Date();
  const now = new Date();
  const logoDataUrl = await loadInstitutionalLogoDataUrl();
  const reportCode = buildExecutiveReportCode({ date: now, periodLabel });
  const digitalSignature = buildDigitalSignature({
    reportCode,
    issuedAt: now,
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

  const criticalCasesCount = Array.isArray(casosCriticos)
    ? casosCriticos.length
    : 0;
  const cohortAlertsCount = Array.isArray(cohortes) ? cohortes.length : 0;
  const recommendationList = Array.isArray(recomendaciones)
    ? recomendaciones
    : [];
  const cohortEvidence = Array.isArray(technicalEvidence?.cohortEvidence)
    ? technicalEvidence.cohortEvidence
    : [];
  const teacherEvidence = Array.isArray(technicalEvidence?.teacherEvidence)
    ? technicalEvidence.teacherEvidence
    : [];

  const riskSummary =
    semaforo?.label ||
    (criticalCasesCount > 0 ? "Atencion prioritaria" : "Estabilidad relativa");

  const operationalHeadline =
    criticalCasesCount > 0
      ? `Se identifican ${criticalCasesCount} casos criticos sin seguimiento oportuno.`
      : "No se observan casos criticos sin seguimiento en el periodo.";

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setProperties({
    title: "Informe Ejecutivo Institucional - CIELP",
    subject: "Analitica de bienestar institucional y priorizacion operativa",
    author: "CIELP Plataforma de Bienestar",
    creator: "CIELP Dashboard",
    keywords: "analitica institucional, bienestar, burnout, seguimiento",
  });

  const marginX = 14;
  const maxWidth = 182;
  let cursorY = 16;

  const ensureSpace = (neededHeight = 10) => {
    if (cursorY + neededHeight > 280) {
      doc.addPage();
      cursorY = 16;
    }
  };

  const writeParagraph = (text, size = 11, gap = 6) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth);
    ensureSpace(lines.length * 5 + 2);
    doc.text(lines, marginX, cursorY);
    cursorY += lines.length * 5 + gap;
  };

  const writeSectionTitle = (title) => {
    ensureSpace(8);
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text(title, marginX, cursorY);
    doc.setFont(undefined, "normal");
    cursorY += 6;
  };

  const renderFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let index = 1; index <= pageCount; index += 1) {
      doc.setPage(index);
      doc.setFontSize(9);
      doc.setTextColor(110);
      doc.text(
        `CIELP · Informe Ejecutivo Institucional · Pagina ${index} de ${pageCount}`,
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
        doc.setFontSize(isHeader ? 10 : 9.4);
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
  doc.text(
    "CIELP · Informe Ejecutivo Institucional",
    marginX + 30,
    cursorY + 6,
  );
  doc.setFont(undefined, "normal");
  cursorY += 18;

  writeParagraph(`Codigo de informe: ${reportCode}`, 11, 3);
  writeParagraph(
    `Periodo de analisis: ${periodLabel || "No especificado"}`,
    11,
    3,
  );
  writeParagraph(
    `Fecha de corte de datos: ${formatDateTime(reportGeneratedAt)}`,
    11,
    3,
  );
  writeParagraph(`Fecha de emision: ${formatDateTime(now)}`, 11, 10);

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Firma digital de emision", marginX, cursorY);
  doc.setFont(undefined, "normal");
  cursorY += 7;
  doc.setFontSize(10.5);
  doc.text(digitalSignature, marginX, cursorY);
  cursorY += 12;

  doc.setDrawColor(220);
  doc.line(marginX, cursorY, marginX + maxWidth, cursorY);
  cursorY += 7;
  doc.setFontSize(10.5);
  doc.text(
    "Documento institucional para comite de bienestar, priorizacion operativa y seguimiento clinico.",
    marginX,
    cursorY,
  );

  doc.addPage();
  cursorY = 16;

  doc.setFontSize(16.5);
  doc.setFont(undefined, "bold");
  doc.text("Informe Ejecutivo Institucional", marginX, cursorY);
  doc.setFont(undefined, "normal");
  cursorY += 8;

  writeParagraph(
    `Periodo de analisis: ${periodLabel || "No especificado"}`,
    11,
    3,
  );
  writeParagraph(
    `Fecha de corte de datos: ${formatDateTime(reportGeneratedAt)}`,
    11,
    3,
  );
  writeParagraph(`Fecha de emision del reporte: ${formatDateTime(now)}`, 11, 8);

  writeSectionTitle("1. Resumen ejecutivo");
  writeParagraph(`Estado general: ${riskSummary}.`, 11, 3);
  writeParagraph(operationalHeadline, 11, 6);

  writeSectionTitle("2. Semaforo institucional");
  writeParagraph(
    `Estado: ${semaforo?.label || "-"}. Promedio de riesgo: ${semaforo?.promedio_riesgo ?? 0}.`,
    11,
    3,
  );
  writeParagraph(
    `Tendencia: ${semaforo?.tendencia?.label || "-"} (${semaforo?.tendencia?.percent ?? 0}%). ${semaforo?.tendencia?.interpretation || ""}`,
    11,
    8,
  );

  writeSectionTitle("3. Cobertura y adherencia");

  writeParagraph(
    `Docentes totales: ${cobertura?.docentes_totales ?? 0}. Evaluados: ${cobertura?.docentes_evaluados ?? 0}. Cobertura: ${cobertura?.cobertura_pct ?? 0}%.`,
    11,
    3,
  );
  writeParagraph(
    `Adherencia: ${cobertura?.adherencia_pct ?? 0}%. Casos sin seguimiento: ${cobertura?.sin_seguimiento ?? 0}.`,
    11,
    8,
  );

  writeSectionTitle("4. Alertas por cohorte y concentracion de riesgo");

  writeParagraph(
    `Cohortes priorizadas en el periodo: ${cohortAlertsCount}.`,
    11,
    4,
  );

  if (!cohortes?.length) {
    writeParagraph("Sin alertas de cohorte para el periodo evaluado.", 11, 6);
  } else {
    cohortes.forEach((cohorte, index) => {
      writeParagraph(
        `${index + 1}. ${cohorte.label}: ${cohorte.alerta_alta_severa_pct}% en riesgo alto/severo (${cohorte.total_docentes} docentes).`,
        11,
        4,
      );
    });
    cursorY += 4;
  }

  writeSectionTitle("5. Casos criticos sin seguimiento");

  if (!casosCriticos?.length) {
    writeParagraph(
      "No se identificaron casos críticos sin seguimiento.",
      11,
      6,
    );
  } else {
    casosCriticos.slice(0, 8).forEach((caso, index) => {
      writeParagraph(
        `${index + 1}. ${caso.nombre} (${caso.riesgo}) - evaluado: ${formatDateLabel(caso.evaluado_en)}`,
        11,
        3,
      );
    });
    cursorY += 4;
  }

  writeSectionTitle("6. Recomendaciones ejecutivas");

  recommendationList.forEach((recommendation, index) => {
    writeParagraph(`${index + 1}. ${recommendation}`, 11, 3);
  });

  if (!recommendationList.length) {
    writeParagraph(
      "No se registraron recomendaciones ejecutivas para este periodo.",
      11,
      3,
    );
  }

  writeSectionTitle("7. Plan sugerido de seguimiento (30 dias)");
  writeParagraph(
    "Semana 1: Validar cobertura pendiente y priorizar casos sin seguimiento.",
    11,
    3,
  );
  writeParagraph(
    "Semana 2: Activar acompanamiento en cohortes con mayor alerta alta/severa.",
    11,
    3,
  );
  writeParagraph(
    "Semana 3: Revisar adherencia de intervenciones y ajustar carga operativa.",
    11,
    3,
  );
  writeParagraph(
    "Semana 4: Consolidar resultados y emitir cierre ejecutivo con lecciones aprendidas.",
    11,
    6,
  );

  writeSectionTitle("8. Nota metodologica");
  writeParagraph(
    "Este reporte resume indicadores institucionales de riesgo psicosocial y uso de intervenciones digitales. Debe complementarse con juicio profesional y protocolo clinico institucional.",
    10.5,
    4,
  );

  // Anexo técnico
  doc.addPage();
  cursorY = 16;
  doc.setFontSize(15);
  doc.setFont(undefined, "bold");
  doc.text("Anexo Tecnico · Evidencia completa", marginX, cursorY);
  doc.setFont(undefined, "normal");
  cursorY += 8;

  writeSectionTitle("A. Evidencia por cohorte");
  const cohortRows = (
    cohortEvidence.length ? cohortEvidence : cohortes || []
  ).map((item) => [
    item?.label || "Sin etiqueta",
    String(item?.total_docentes ?? 0),
    `${Number(item?.alerta_alta_severa_pct ?? 0)}%`,
    Number(item?.alerta_alta_severa_pct ?? 0) >= 30 ? "Alta" : "Media/Baja",
  ]);

  cursorY = renderSimpleTable({
    headers: ["Cohorte", "Docentes", "% alto/severo", "Prioridad"],
    rows: cohortRows.length ? cohortRows : [["Sin datos", "0", "0%", "-"]],
    startY: cursorY + 2,
  });

  writeSectionTitle("B. Evidencia por docente (casos criticos)");
  const teacherRows = (
    teacherEvidence.length ? teacherEvidence : casosCriticos || []
  ).map((item) => [
    item?.nombre || "Docente",
    item?.riesgo || "-",
    formatDateLabel(item?.evaluado_en),
    item?.estado_seguimiento || "Sin seguimiento",
  ]);

  cursorY = renderSimpleTable({
    headers: ["Docente", "Riesgo", "Ultima evaluacion", "Seguimiento"],
    rows: teacherRows.length ? teacherRows : [["Sin casos", "-", "-", "-"]],
    startY: cursorY + 2,
  });

  renderFooter();

  const fileTag = createFileTimestamp(now);

  doc.save(
    `cielp_informe_ejecutivo_${String(periodLabel || "periodo").toLowerCase()}_${fileTag}.pdf`,
  );
};

function DashboardHomePage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [isExportingExecutive, setIsExportingExecutive] = useState(false);
  const [executiveExportError, setExecutiveExportError] = useState(null);

  const userRole = useAuthStore((state) => state.user?.role);
  const isExecutiveRole =
    userRole === USER_ROLES.SUPER_ADMIN ||
    userRole === USER_ROLES.ADMIN ||
    userRole === USER_ROLES.PSYCHOLOGIST;
  const isPsychologistRole = userRole === USER_ROLES.PSYCHOLOGIST;
  const isTeacherRole = userRole === USER_ROLES.TEACHER;

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

  const mbiProgressComparison = useDashboardMbiStore(
    (state) => state.mbiProgressComparison,
  );
  const isLoadingMbiProgressComparison = useDashboardMbiStore(
    (state) => state.isLoadingMbiProgressComparison,
  );
  const mbiProgressComparisonError = useDashboardMbiStore(
    (state) => state.mbiProgressComparisonError,
  );
  const fetchMbiProgressComparison = useDashboardMbiStore(
    (state) => state.fetchMbiProgressComparison,
  );

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

  const [clinicalAlerts, setClinicalAlerts] = useState([]);
  const [isLoadingClinicalAlerts, setIsLoadingClinicalAlerts] = useState(false);
  const [clinicalAlertsError, setClinicalAlertsError] = useState(null);
  const [updatingAlertId, setUpdatingAlertId] = useState(null);

  const currentContent =
    ROLE_CONTENT[userRole] || ROLE_CONTENT[USER_ROLES.TEACHER];

  const fetchGlobalAnalytics = useDashboardAnalyticsStore(
    (state) => state.fetchGlobalAnalytics,
  );
  const selectedGlobalPeriod = useDashboardAnalyticsStore(
    (state) => state.selectedGlobalPeriod,
  );
  const setSelectedGlobalPeriod = useDashboardAnalyticsStore(
    (state) => state.setSelectedGlobalPeriod,
  );
  const isLoadingGlobalAnalytics = useDashboardAnalyticsStore(
    (state) => state.isLoadingGlobalAnalytics,
  );
  const globalAnalyticsError = useDashboardAnalyticsStore(
    (state) => state.globalAnalyticsError,
  );
  const executiveMvpAnalytics = useDashboardAnalyticsStore(
    (state) => state.executiveMvpAnalytics,
  );

  useEffect(() => {
    if (!isExecutiveRole) {
      return;
    }

    void fetchGlobalAnalytics({ period: selectedGlobalPeriod });
    void fetchMoodHistoryBySpace();
  }, [
    fetchGlobalAnalytics,
    fetchMoodHistoryBySpace,
    isExecutiveRole,
    selectedGlobalPeriod,
  ]);

  useEffect(() => {
    if (!isPsychologistRole) {
      return;
    }

    let isMounted = true;

    const fetchClinicalAlerts = async () => {
      setClinicalAlertsError(null);
      setIsLoadingClinicalAlerts(true);

      try {
        const response = await getMyBurnoutAlertsApi();

        if (!isMounted) {
          return;
        }

        setClinicalAlerts(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setClinicalAlertsError(
          error?.response?.data?.error ||
            "No fue posible cargar alertas clínicas.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingClinicalAlerts(false);
        }
      }
    };

    void fetchClinicalAlerts();

    return () => {
      isMounted = false;
    };
  }, [isPsychologistRole]);

  useEffect(() => {
    if (!isTeacherRole) {
      return;
    }

    void fetchMyHistory();
    void fetchTeacherStats();
    void fetchMbiRetestStatus();
    void fetchMbiProgressComparison();
  }, [
    fetchMbiProgressComparison,
    fetchMbiRetestStatus,
    fetchMyHistory,
    fetchTeacherStats,
    isTeacherRole,
  ]);

  const semaforo = executiveMvpAnalytics?.semaforo_institucional || null;
  const cohortes = useMemo(
    () => executiveMvpAnalytics?.riesgo_por_cohortes?.top_alertas || [],
    [executiveMvpAnalytics],
  );
  const cobertura = executiveMvpAnalytics?.cobertura_adherencia || null;
  const casosCriticos =
    executiveMvpAnalytics?.casos_criticos_sin_seguimiento || [];
  const resumenMensual =
    executiveMvpAnalytics?.resumen_ejecutivo_mensual || null;

  const periodLabel = useMemo(() => {
    const found = PERIOD_OPTIONS.find(
      (option) => option.value === selectedGlobalPeriod,
    );
    return found?.label || "Semana";
  }, [selectedGlobalPeriod]);

  const quickMetrics = useMemo(
    () => [
      {
        id: "estado",
        title: "Estado institucional",
        value: semaforo?.label || "Sin clasificación",
        helper: semaforo?.summary || "Sin resumen disponible.",
        color: getTrafficLightChipColor(semaforo?.color),
      },
      {
        id: "cobertura",
        title: "Cobertura",
        value: `${cobertura?.cobertura_pct ?? 0}%`,
        helper: `${cobertura?.docentes_evaluados ?? 0} de ${cobertura?.docentes_totales ?? 0} docentes evaluados.`,
        color: "primary",
      },
      {
        id: "adherencia",
        title: "Adherencia",
        value: `${cobertura?.adherencia_pct ?? 0}%`,
        helper: `${cobertura?.docentes_con_seguimiento ?? 0} docentes con seguimiento activo.`,
        color: "secondary",
      },
      {
        id: "criticos",
        title: "Casos críticos",
        value: `${casosCriticos.length}`,
        helper: "Docentes en alto/severo sin seguimiento posterior.",
        color: casosCriticos.length > 0 ? "error" : "success",
      },
    ],
    [casosCriticos.length, cobertura, semaforo],
  );

  const cohortChart = useMemo(() => {
    if (!cohortes.length) {
      return {
        labels: [],
        values: [],
      };
    }

    return {
      labels: cohortes.map((item) => item.label),
      values: cohortes.map((item) => Number(item.alerta_alta_severa_pct || 0)),
    };
  }, [cohortes]);

  const unreadClinicalAlerts = useMemo(
    () => clinicalAlerts.filter((alert) => !alert.is_read),
    [clinicalAlerts],
  );

  const actionableClinicalAlerts = useMemo(
    () =>
      unreadClinicalAlerts.filter((alert) =>
        ["high", "critical"].includes(String(alert?.risk_level || "")),
      ),
    [unreadClinicalAlerts],
  );

  const handleMarkAlertAsRead = async (alertId) => {
    if (!alertId || updatingAlertId) {
      return;
    }

    setUpdatingAlertId(alertId);

    try {
      await markBurnoutAlertAsReadApi(alertId);

      setClinicalAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : alert,
        ),
      );
    } catch {
      setClinicalAlertsError("No fue posible marcar la alerta como leída.");
    } finally {
      setUpdatingAlertId(null);
    }
  };

  const handleExportExecutiveMonthly = async () => {
    setExecutiveExportError(null);
    setIsExportingExecutive(true);

    try {
      const monthlyData = await fetchGlobalAnalytics({
        period: GLOBAL_ANALYTICS_PERIODS.MONTH,
        force: true,
      });

      const monthlyExecutive = monthlyData?.mvpEjecutivo;
      if (!monthlyExecutive) {
        setExecutiveExportError(
          "No hay datos suficientes para exportar el informe mensual.",
        );
        return;
      }

      await buildExecutiveExportPdf({
        periodLabel: "Mes",
        generatedAt: monthlyExecutive?.resumen_ejecutivo_mensual?.generado_en,
        semaforo: monthlyExecutive?.semaforo_institucional,
        cobertura: monthlyExecutive?.cobertura_adherencia,
        cohortes: monthlyExecutive?.riesgo_por_cohortes?.top_alertas,
        casosCriticos: monthlyExecutive?.casos_criticos_sin_seguimiento,
        recomendaciones:
          monthlyExecutive?.resumen_ejecutivo_mensual?.recomendaciones,
        technicalEvidence: {
          cohortEvidence: monthlyExecutive?.riesgo_por_cohortes?.top_alertas,
          teacherEvidence: monthlyExecutive?.casos_criticos_sin_seguimiento,
        },
      });
    } catch {
      setExecutiveExportError(
        "No fue posible exportar el informe ejecutivo mensual.",
      );
    } finally {
      setIsExportingExecutive(false);
    }
  };

  const latestTeacherSession = useMemo(() => {
    if (!Array.isArray(myHistory) || myHistory.length === 0) {
      return null;
    }

    const sorted = [...myHistory].sort((a, b) => {
      const aTime = a?.date ? new Date(a.date).getTime() : 0;
      const bTime = b?.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });

    return sorted[0] || null;
  }, [myHistory]);

  const highlightedRecommendation =
    latestTeacherSession?.recomendaciones?.[0] || null;
  const secondaryRecommendation =
    latestTeacherSession?.recomendaciones?.[1] || null;

  const teacherClinicalComparisonMessage = useMemo(() => {
    if (!mbiProgressComparison?.has_enough_data) {
      return null;
    }

    const percentReduction = Math.abs(
      Number(
        mbiProgressComparison?.dimensions?.emotional_exhaustion
          ?.percent_change || 0,
      ),
    );
    const minutes =
      Number(teacherStats?.overview?.total_minutes_meditated) || 0;

    if (mbiProgressComparison.global_status === "positive") {
      return `Felicidades. Tu carga de agotamiento emocional muestra una reducción de ${percentReduction}% y has acumulado ${minutes} minutos de práctica de autocuidado.`;
    }

    if (mbiProgressComparison.global_status === "mixed") {
      return `Se observan avances parciales en tu comparación clínica. Mantienes ${minutes} minutos de práctica y conviene reforzar continuidad semanal.`;
    }

    return `Tu comparación clínica aún no muestra mejoría global. Has acumulado ${minutes} minutos de práctica; te recomendamos sostener acompañamiento y repetir MBI en ventana sugerida.`;
  }, [mbiProgressComparison, teacherStats]);

  const monthlyMbiTrend = useMemo(() => {
    const last30DaysTimestamp = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const lastMonthSessions = (Array.isArray(myHistory) ? myHistory : [])
      .filter((session) => {
        const timestamp = session?.date ? new Date(session.date).getTime() : 0;
        return timestamp >= last30DaysTimestamp;
      })
      .sort((a, b) => {
        const aTime = a?.date ? new Date(a.date).getTime() : 0;
        const bTime = b?.date ? new Date(b.date).getTime() : 0;
        return aTime - bTime;
      });

    return {
      labels: lastMonthSessions.map((session) =>
        formatDayMonthLabel(session?.date),
      ),
      values: lastMonthSessions.map((session) => {
        const ce = Number(session?.scores?.cansancio_emocional) || 0;
        const dp = Number(session?.scores?.despersonalizacion) || 0;
        return ce + dp;
      }),
    };
  }, [myHistory]);

  const dimensionComparisonChart = useMemo(() => {
    if (!mbiProgressComparison?.has_enough_data) {
      return null;
    }

    return {
      labels: ["CE", "DP", "RP"],
      baseline: [
        Number(mbiProgressComparison?.baseline?.emotional_exhaustion_score) ||
          0,
        Number(mbiProgressComparison?.baseline?.depersonalization_score) || 0,
        Number(
          mbiProgressComparison?.baseline?.personal_accomplishment_score,
        ) || 0,
      ],
      latest: [
        Number(mbiProgressComparison?.latest?.emotional_exhaustion_score) || 0,
        Number(mbiProgressComparison?.latest?.depersonalization_score) || 0,
        Number(mbiProgressComparison?.latest?.personal_accomplishment_score) ||
          0,
      ],
    };
  }, [mbiProgressComparison]);

  const latestClinicalZones = useMemo(() => {
    if (!dimensionComparisonChart) {
      return [];
    }

    return [
      getClinicalZoneByDimension("ce", dimensionComparisonChart.latest[0]),
      getClinicalZoneByDimension("dp", dimensionComparisonChart.latest[1]),
      getClinicalZoneByDimension("rp", dimensionComparisonChart.latest[2]),
    ];
  }, [dimensionComparisonChart]);

  const moodHistorySpaceChart = useMemo(() => {
    const summary = Array.isArray(moodHistoryBySpace?.summary)
      ? moodHistoryBySpace.summary
      : [];

    return {
      labels: summary.slice(0, 6).map((item) => item.space_name),
      values: summary
        .slice(0, 6)
        .map((item) => Number(item.average_mood_score) || 0),
    };
  }, [moodHistoryBySpace]);

  const moodHistoryWeeklyChart = useMemo(() => {
    const trend = Array.isArray(moodHistoryBySpace?.weekly_mood_trend)
      ? moodHistoryBySpace.weekly_mood_trend
      : [];

    return {
      labels: trend.map((item) => item.week_label || "Semana"),
      values: trend.map((item) => Number(item.average_mood_score) || 0),
    };
  }, [moodHistoryBySpace]);

  const isMbiRetestLocked =
    isTeacherRole &&
    Boolean(mbiRetestStatus?.last_test_date) &&
    !mbiRetestStatus?.should_retake;
  const mbiDaysRemaining = Number(mbiRetestStatus?.days_remaining || 0);

  const renderTeacherWellnessPanel = () => (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={1.2}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" } }}
          >
            Tu panel de bienestar
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Seguimiento clínico-personal de tamizaje MBI y adherencia a
            estrategias de autocuidado para prevención de desgaste docente.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => {
              void fetchMyHistory({ force: true });
              void fetchTeacherStats({ force: true });
              void fetchMbiRetestStatus({ force: true });
              void fetchMbiProgressComparison({ force: true });
            }}
            disabled={
              isLoadingMyHistory ||
              isLoadingTeacherStats ||
              isLoadingMbiRetestStatus ||
              isLoadingMbiProgressComparison
            }
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AssignmentTurnedInRoundedIcon />}
            component={isMbiRetestLocked ? "button" : RouterLink}
            to={isMbiRetestLocked ? undefined : "/dashboard/mbi"}
            disabled={isMbiRetestLocked}
          >
            {isMbiRetestLocked
              ? `MBI disponible en ${mbiDaysRemaining} día(s)`
              : "Resolver MBI"}
          </Button>
        </Stack>
      </Stack>

      {myHistoryError ? <Alert severity="error">{myHistoryError}</Alert> : null}
      {mbiRetestStatusError ? (
        <Alert severity="error">{mbiRetestStatusError}</Alert>
      ) : null}
      {mbiProgressComparisonError ? (
        <Alert severity="error">{mbiProgressComparisonError}</Alert>
      ) : null}
      {teacherStatsError ? (
        <Alert severity="error">{teacherStatsError}</Alert>
      ) : null}

      {mbiRetestStatus?.should_retake ? (
        <Alert severity="warning">
          {mbiRetestStatus?.banner_message ||
            "Es momento de chequear tu estado emocional. Haz el test de nuevo."}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          width: "100%",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(12, minmax(0, 1fr))",
          },
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            display: "flex",
            minWidth: 0,
            gridColumn: { xs: "1 / -1", md: "span 4" },
          }}
        >
          <DashboardSectionCard
            title="Estado personal"
            description="Lectura clínica de tu último tamizaje MBI y comportamiento de carga emocional reciente."
          >
            {isLoadingMyHistory ? (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <CircularProgress size={18} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Cargando estado actual...
                </Typography>
              </Stack>
            ) : latestTeacherSession ? (
              <Stack spacing={1}>
                <Chip
                  color={getTeacherDiagnosisChipColor(
                    latestTeacherSession.diagnostico,
                  )}
                  label={latestTeacherSession.diagnostico || "Sin diagnóstico"}
                  sx={{ width: "fit-content" }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Última evaluación:{" "}
                  {formatDateLabel(latestTeacherSession.date)}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                >
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`CE: ${latestTeacherSession?.scores?.cansancio_emocional ?? 0}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`DP: ${latestTeacherSession?.scores?.despersonalizacion ?? 0}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`RP: ${latestTeacherSession?.scores?.realizacion_personal ?? 0}`}
                  />
                </Stack>

                <Divider />

                <Typography
                  variant="subtitle2"
                  sx={{ mt: 0.2 }}
                >
                  Tendencia último mes (CE + DP)
                </Typography>

                {monthlyMbiTrend.values.length > 1 ? (
                  <Box sx={{ overflowX: "auto", pt: 0.4 }}>
                    <LineChart
                      height={140}
                      width={isDesktop ? 340 : 280}
                      xAxis={[
                        {
                          scaleType: "point",
                          data: monthlyMbiTrend.labels,
                        },
                      ]}
                      yAxis={[
                        {
                          min: 0,
                        },
                      ]}
                      series={[
                        {
                          data: monthlyMbiTrend.values,
                          label: "CE + DP",
                          color: theme.palette.primary.main,
                          showMark: true,
                        },
                      ]}
                      margin={{ top: 12, right: 12, bottom: 20, left: 24 }}
                    />
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Aún no hay suficientes mediciones en los últimos 30 días
                    para mostrar tendencia.
                  </Typography>
                )}

                {teacherClinicalComparisonMessage ? (
                  <Alert
                    severity={
                      mbiProgressComparison?.global_status === "positive"
                        ? "success"
                        : mbiProgressComparison?.global_status === "mixed"
                          ? "info"
                          : "warning"
                    }
                    sx={{ mt: 0.5 }}
                  >
                    {teacherClinicalComparisonMessage}
                  </Alert>
                ) : null}

                {dimensionComparisonChart ? (
                  <>
                    <Divider />

                    <Typography variant="subtitle2">
                      Comparación T1 vs última medición
                    </Typography>

                    <Box sx={{ overflowX: "auto", pt: 0.4 }}>
                      <BarChart
                        width={isDesktop ? 360 : 280}
                        height={200}
                        xAxis={[
                          {
                            scaleType: "band",
                            data: dimensionComparisonChart.labels,
                          },
                        ]}
                        series={[
                          {
                            data: dimensionComparisonChart.baseline,
                            label: "T1",
                            color: theme.palette.grey[500],
                          },
                          {
                            data: dimensionComparisonChart.latest,
                            label: "Actual",
                            color: theme.palette.primary.main,
                          },
                        ]}
                        margin={{ top: 24, right: 12, bottom: 20, left: 28 }}
                      />
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.8}
                      useFlexGap
                      flexWrap="wrap"
                    >
                      {latestClinicalZones.map((zone, index) => (
                        <Chip
                          key={`zone-${index}`}
                          size="small"
                          color={zone.color}
                          label={`${zone.label} (${zone.threshold})`}
                        />
                      ))}
                    </Stack>
                  </>
                ) : null}
              </Stack>
            ) : (
              <Alert severity="info">
                Aún no tienes resultados MBI. Inicia tu primera evaluación.
              </Alert>
            )}
          </DashboardSectionCard>
        </Box>

        <Box
          sx={{
            minWidth: 0,
            gridColumn: { xs: "1 / -1", md: "span 8" },
          }}
        >
          <Stack
            spacing={{ xs: 1.25, sm: 1.5, md: 1.75 }}
            sx={{ width: "100%" }}
          >
            <Box
              sx={{
                display: "flex",
                minWidth: 0,
              }}
            >
              <DashboardSectionCard
                title="Rutina de autocuidado"
                description="Indicadores de adherencia a intervenciones breves de regulación y recuperación psicoemocional."
              >
                {isLoadingTeacherStats ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <CircularProgress size={18} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Cargando actividad...
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <SelfImprovementRoundedIcon
                        color="primary"
                        fontSize="small"
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Sesiones completadas:{" "}
                        {teacherStats?.overview?.total_sessions ?? 0}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <FavoriteRoundedIcon
                        color="secondary"
                        fontSize="small"
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Minutos de cuidado:{" "}
                        {teacherStats?.overview?.total_minutes_meditated ?? 0}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Espacio favorito:{" "}
                      {teacherStats?.overview?.favorite_space ||
                        "Aún no hay datos"}
                    </Typography>
                  </Stack>
                )}
              </DashboardSectionCard>
            </Box>

            <Box
              sx={{
                display: "flex",
                minWidth: 0,
              }}
            >
              <DashboardSectionCard
                title="Próximo paso recomendado"
                description="Plan breve de acción sugerido según los hallazgos de tu evaluación MBI más reciente."
              >
                {highlightedRecommendation ? (
                  <Stack spacing={0.8}>
                    <Typography variant="subtitle2">
                      {highlightedRecommendation.sintoma_detectado}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Espacio sugerido 1:{" "}
                      {highlightedRecommendation.espacio_sugerido}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {highlightedRecommendation.motivo}
                    </Typography>
                    {secondaryRecommendation ? (
                      <>
                        <Divider />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Espacio sugerido 2:{" "}
                          {secondaryRecommendation.espacio_sugerido}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {secondaryRecommendation.motivo}
                        </Typography>
                      </>
                    ) : null}
                    <Button
                      component={RouterLink}
                      to="/dashboard/espacios"
                      variant="outlined"
                      size="small"
                      sx={{ width: "fit-content", mt: 0.4 }}
                    >
                      Ir a espacios recomendados
                    </Button>
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Completa o actualiza tu evaluación MBI para recibir una
                    recomendación personalizada.
                  </Typography>
                )}
              </DashboardSectionCard>
            </Box>

            <Box sx={{ display: "flex", minWidth: 0 }}>
              <DashboardSectionCard
                title="Acciones rápidas"
                description="Intervenciones recomendadas para sostener autocuidado, monitoreo y continuidad terapéutica preventiva."
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                >
                  <Button
                    component={isMbiRetestLocked ? "button" : RouterLink}
                    to={isMbiRetestLocked ? undefined : "/dashboard/mbi"}
                    variant="contained"
                    disabled={isMbiRetestLocked}
                  >
                    {isMbiRetestLocked
                      ? `Disponible en ${mbiDaysRemaining} día(s)`
                      : "Realizar evaluación MBI"}
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/dashboard/espacios"
                    variant="outlined"
                  >
                    Iniciar espacio digital
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/dashboard/configuracion"
                    variant="outlined"
                  >
                    Actualizar perfil
                  </Button>
                </Stack>
              </DashboardSectionCard>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Stack>
  );

  if (isTeacherRole) {
    return renderTeacherWellnessPanel();
  }

  if (!isExecutiveRole) {
    return (
      <Stack spacing={2.5}>
        <Typography
          variant="h4"
          sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" } }}
        >
          {currentContent.heading}
        </Typography>

        <Grid
          container
          spacing={2}
        >
          {currentContent.cards.map((card) => (
            <Grid
              key={card.title}
              item
              xs={12}
              md={4}
              sx={{ display: "flex" }}
            >
              <DashboardSectionCard
                title={card.title}
                description={card.description}
              />
            </Grid>
          ))}
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack
      spacing={2.5}
      sx={{ width: "100%" }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={1.2}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" } }}
          >
            Panel ejecutivo
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Lectura rápida para administrativos y psicólogo: estado, prioridades
            y acciones de seguimiento en una sola vista.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={selectedGlobalPeriod}
            onChange={(_, nextValue) => {
              if (!nextValue) {
                return;
              }
              setSelectedGlobalPeriod(nextValue);
            }}
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

          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            disabled={isLoadingGlobalAnalytics || isLoadingMoodHistoryBySpace}
            onClick={() => {
              void fetchGlobalAnalytics({
                period: selectedGlobalPeriod,
                force: true,
              });
              void fetchMoodHistoryBySpace({ force: true });
            }}
          >
            Actualizar
          </Button>

          <Button
            variant="contained"
            startIcon={<DownloadRoundedIcon />}
            onClick={() => void handleExportExecutiveMonthly()}
            disabled={isExportingExecutive || isLoadingGlobalAnalytics}
          >
            {isExportingExecutive ? "Exportando..." : "Export mensual"}
          </Button>
        </Stack>
      </Stack>

      {executiveExportError ? (
        <Alert severity="error">{executiveExportError}</Alert>
      ) : null}

      {moodHistoryBySpaceError ? (
        <Alert severity="error">{moodHistoryBySpaceError}</Alert>
      ) : null}

      {globalAnalyticsError ? (
        <Alert severity="error">{globalAnalyticsError}</Alert>
      ) : null}

      {isPsychologistRole && actionableClinicalAlerts.length > 0 ? (
        <DashboardSectionCard
          title="Alertas clínicas en tiempo real"
          description="Docentes con riesgo alto o crítico detectado en el último envío de prueba MBI."
        >
          <Stack spacing={1.2}>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
            >
              <Chip
                color="error"
                label={`Pendientes: ${actionableClinicalAlerts.length}`}
              />
              <Chip
                label={`Total activas: ${actionableClinicalAlerts.length}`}
              />
            </Stack>

            {clinicalAlertsError ? (
              <Alert severity="error">{clinicalAlertsError}</Alert>
            ) : null}

            {isLoadingClinicalAlerts ? (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <CircularProgress size={18} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Cargando alertas clínicas...
                </Typography>
              </Stack>
            ) : null}

            {!isLoadingClinicalAlerts && actionableClinicalAlerts.length > 0 ? (
              <List
                dense
                sx={{ py: 0 }}
              >
                {actionableClinicalAlerts.slice(0, 8).map((alert) => {
                  const teacherName =
                    `${alert?.teacher?.given_name || ""} ${alert?.teacher?.surname || ""}`.trim() ||
                    "Docente";

                  return (
                    <ListItem
                      key={alert.id}
                      disableGutters
                      sx={{ alignItems: "flex-start" }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                        sx={{ width: "100%" }}
                      >
                        <ListItemText
                          primary={`${teacherName} - ${alert.risk_level === "critical" ? "Riesgo crítico" : "Riesgo alto"}`}
                          secondary={`Espacio recomendado: ${alert.recommended_space_name} | Generada: ${formatDateLabel(alert.created_at)}`}
                        />

                        <Button
                          size="small"
                          variant={alert.is_read ? "outlined" : "contained"}
                          disabled={Boolean(updatingAlertId) || alert.is_read}
                          onClick={() => void handleMarkAlertAsRead(alert.id)}
                        >
                          {alert.is_read
                            ? "Leída"
                            : updatingAlertId === alert.id
                              ? "Guardando..."
                              : "Marcar leída"}
                        </Button>
                      </Stack>
                    </ListItem>
                  );
                })}
              </List>
            ) : null}
          </Stack>
        </DashboardSectionCard>
      ) : null}

      {isLoadingGlobalAnalytics && !executiveMvpAnalytics ? (
        <DashboardSectionCard
          title="Cargando panel ejecutivo"
          description="Estamos consolidando indicadores institucionales del periodo seleccionado."
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
              Procesando metricas...
            </Typography>
          </Stack>
        </DashboardSectionCard>
      ) : null}

      {executiveMvpAnalytics ? (
        <Box
          sx={{
            display: "grid",
            width: "100%",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(12, minmax(0, 1fr))",
            },
            alignItems: "stretch",
          }}
        >
          {quickMetrics.map((metric) => (
            <Box
              key={metric.id}
              sx={{
                display: "flex",
                minWidth: 0,
                gridColumn: {
                  xs: "1 / -1",
                  sm: "span 1",
                  md: "span 3",
                },
              }}
            >
              <DashboardSectionCard
                title={metric.title}
                description={metric.helper}
              >
                <Stack spacing={1}>
                  <Typography
                    variant="h4"
                    sx={{ fontSize: { xs: "1.5rem", md: "1.85rem" } }}
                  >
                    {metric.value}
                  </Typography>
                  <Chip
                    size="small"
                    color={metric.color}
                    label={`Periodo: ${periodLabel}`}
                    sx={{ width: "fit-content" }}
                  />
                </Stack>
              </DashboardSectionCard>
            </Box>
          ))}

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
            <DashboardSectionCard
              title="Riesgo por cohortes (top alertas)"
              description="Gráfica de concentración de riesgo alto/severo para priorizar intervenciones de forma inmediata."
            >
              {cohortChart.labels.length === 0 ? (
                <Alert severity="info">
                  Aún no hay datos suficientes para graficar cohortes.
                </Alert>
              ) : (
                <Box sx={{ overflowX: "auto", pt: 1 }}>
                  <BarChart
                    width={isDesktop ? 980 : 340}
                    height={300}
                    xAxis={[
                      {
                        scaleType: "band",
                        data: cohortChart.labels,
                      },
                    ]}
                    yAxis={[
                      {
                        min: 0,
                        max: 100,
                      },
                    ]}
                    series={[
                      {
                        data: cohortChart.values,
                        label: "% alto/severo",
                        color: theme.palette.primary.main,
                      },
                    ]}
                    margin={{ top: 20, right: 20, bottom: 45, left: 45 }}
                  />
                </Box>
              )}
            </DashboardSectionCard>
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
            <DashboardSectionCard
              title="Histórico de mood por espacio"
              description="Vista EVA por espacio para identificar recursos con mejor respuesta emocional percibida."
            >
              {isLoadingMoodHistoryBySpace ? (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <CircularProgress size={18} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Cargando histórico de mood...
                  </Typography>
                </Stack>
              ) : moodHistorySpaceChart.labels.length === 0 ? (
                <Alert severity="info">
                  Aún no hay suficientes registros EVA para este periodo.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  <Box sx={{ overflowX: "auto" }}>
                    <BarChart
                      width={isDesktop ? 430 : 320}
                      height={210}
                      xAxis={[
                        {
                          scaleType: "band",
                          data: moodHistorySpaceChart.labels,
                        },
                      ]}
                      yAxis={[
                        {
                          min: 0,
                          max: 10,
                        },
                      ]}
                      series={[
                        {
                          data: moodHistorySpaceChart.values,
                          label: "Mood promedio EVA",
                          color: theme.palette.secondary.main,
                        },
                      ]}
                      margin={{ top: 18, right: 12, bottom: 40, left: 30 }}
                    />
                  </Box>

                  {moodHistoryWeeklyChart.labels.length > 1 ? (
                    <Box sx={{ overflowX: "auto" }}>
                      <LineChart
                        width={isDesktop ? 430 : 320}
                        height={150}
                        xAxis={[
                          {
                            scaleType: "point",
                            data: moodHistoryWeeklyChart.labels,
                          },
                        ]}
                        yAxis={[
                          {
                            min: 0,
                            max: 10,
                          },
                        ]}
                        series={[
                          {
                            data: moodHistoryWeeklyChart.values,
                            label: "Mood semanal",
                            color: theme.palette.primary.main,
                            showMark: true,
                          },
                        ]}
                        margin={{ top: 10, right: 12, bottom: 20, left: 30 }}
                      />
                    </Box>
                  ) : null}
                </Stack>
              )}
            </DashboardSectionCard>
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
            <DashboardSectionCard
              title="Semáforo y tendencia"
              description="Lectura ejecutiva del nivel de riesgo y su comportamiento frente al periodo anterior."
            >
              <Stack spacing={1}>
                <Chip
                  color={getTrafficLightChipColor(semaforo?.color)}
                  label={semaforo?.label || "Sin clasificación"}
                  sx={{ width: "fit-content" }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {semaforo?.summary || "Sin resumen disponible."}
                </Typography>
                <Divider />
                <Typography variant="subtitle2">Tendencia</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {semaforo?.tendencia?.label || "Sin dato"} (
                  {semaforo?.tendencia?.percent ?? 0}%).
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {semaforo?.tendencia?.interpretation ||
                    "Sin comparativo disponible."}
                </Typography>
              </Stack>
            </DashboardSectionCard>
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
            <DashboardSectionCard
              title="Casos críticos sin seguimiento"
              description="Cola de acción priorizada para intervención de administrativos y psicólogo."
            >
              {casosCriticos.length === 0 ? (
                <Alert severity="success">
                  No se encontraron casos críticos sin seguimiento para este
                  periodo.
                </Alert>
              ) : (
                <List
                  dense
                  sx={{ py: 0 }}
                >
                  {casosCriticos.slice(0, 8).map((caseItem) => (
                    <ListItem
                      key={caseItem.user_id}
                      disableGutters
                    >
                      <ListItemText
                        primary={`${caseItem.nombre} - ${caseItem.riesgo}`}
                        secondary={`Evaluado: ${formatDateLabel(caseItem.evaluado_en)} | Contacto: ${caseItem.email || "Sin correo"}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </DashboardSectionCard>
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
            <DashboardSectionCard
              title="Resumen de decisión"
              description="Bloque de lectura corta para acción de comité y seguimiento semanal."
            >
              <Stack spacing={1.2}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <InsightsRoundedIcon
                    fontSize="small"
                    color="primary"
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Variación cobertura:{" "}
                    {cobertura?.cobertura_delta?.absolute ?? 0} pts (
                    {cobertura?.cobertura_delta?.percent ?? 0}%).
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <WarningAmberRoundedIcon
                    fontSize="small"
                    color={casosCriticos.length > 0 ? "error" : "success"}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Casos sin seguimiento: {cobertura?.sin_seguimiento ?? 0}.
                  </Typography>
                </Stack>

                <Divider />

                <Typography variant="subtitle2">Acciones sugeridas</Typography>
                {(resumenMensual?.recomendaciones || [])
                  .slice(0, 3)
                  .map((item, index) => (
                    <Typography
                      key={`accion-sugerida-${index}`}
                      variant="body2"
                      color="text.secondary"
                    >
                      {index + 1}. {item}
                    </Typography>
                  ))}
              </Stack>
            </DashboardSectionCard>
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
            <DashboardSectionCard
              title="Resumen ejecutivo mensual"
              description="Bloque listo para comité directivo y trazabilidad de decisiones."
            >
              <Stack spacing={0.8}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Generado en: {formatDateLabel(resumenMensual?.generado_en)}
                </Typography>
                {(resumenMensual?.recomendaciones || []).map((item, index) => (
                  <Typography
                    key={`recomendacion-${index}`}
                    variant="body2"
                    color="text.secondary"
                  >
                    {index + 1}. {item}
                  </Typography>
                ))}
              </Stack>
            </DashboardSectionCard>
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}

export default DashboardHomePage;
