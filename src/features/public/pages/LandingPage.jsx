import { useEffect } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LockPersonRoundedIcon from "@mui/icons-material/LockPersonRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { Link as RouterLink, useLocation } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";

const trustBadges = [
  "Evaluación basada en evidencia",
  "Panel con indicadores accionables",
];

const roleBenefits = [
  {
    role: "Docentes",
    points: [
      "Tamizaje guiado en minutos",
      "Ruta de orientación personalizada",
      "Seguimiento de progreso y bienestar",
    ],
  },
  {
    role: "Coordinación académica",
    points: [
      "Visión consolidada del riesgo institucional",
      "Alertas tempranas para priorizar intervenciones",
      "Historial para evaluar impacto de acciones",
    ],
  },
  {
    role: "Gestión directiva",
    points: [
      "Métrica clara para decisiones estratégicas",
      "Reportes de apoyo para auditoría interna",
      "Trazabilidad en procesos de bienestar",
    ],
  },
];

const steps = [
  {
    title: "1. Activación institucional",
    detail:
      "Definimos objetivos, equipos responsables y alcance para iniciar con una implementación ordenada.",
    icon: Groups2RoundedIcon,
  },
  {
    title: "2. Tamizaje y analítica",
    detail:
      "Los docentes completan el proceso y la plataforma genera hallazgos por niveles de riesgo y prioridades.",
    icon: InsightsRoundedIcon,
  },
  {
    title: "3. Ruta de acompañamiento",
    detail:
      "Se activa un plan de acción con orientación, seguimiento y mejora continua para la institución.",
    icon: SupportAgentRoundedIcon,
  },
];

const faqs = [
  {
    question: "¿Cuánto tarda una institución en comenzar?",
    answer:
      "En la mayoría de los casos, la puesta en marcha operativa puede iniciar en pocos días, dependiendo del alcance y la disponibilidad del equipo institucional.",
  },
  {
    question: "¿La información es confidencial y segura?",
    answer:
      "Sí. CIELP aplica controles de seguridad, acceso por roles y buenas prácticas de tratamiento de datos para proteger la información sensible.",
  },
  {
    question: "¿Se adapta a distintos contextos educativos?",
    answer:
      "Sí. El flujo se ajusta a la realidad de cada institución para facilitar adopción sin fricción y con resultados medibles.",
  },
  {
    question: "¿Qué soporte recibimos después de implementarlo?",
    answer:
      "Incluye acompañamiento para adopción, recomendaciones de uso y apoyo para interpretar hallazgos y priorizar acciones.",
  },
];

function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const sectionId = location.hash.replace("#", "");

    let attempts = 0;
    const maxAttempts = 12;

    const scrollToTarget = () => {
      const section = document.getElementById(sectionId);

      if (!section && attempts < maxAttempts) {
        attempts += 1;
        window.requestAnimationFrame(scrollToTarget);
        return;
      }

      if (!section) {
        return;
      }

      const navbarOffset = 84;
      const top =
        section.getBoundingClientRect().top + window.scrollY - navbarOffset;

      window.scrollTo({ top, behavior: "smooth" });
    };

    window.requestAnimationFrame(scrollToTarget);
  }, [location.hash]);

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <PublicNavbar />

      <Box
        component="section"
        sx={(theme) => ({
          minHeight: "100dvh",
          pt: { xs: 8, md: 9 },
          position: "relative",
          overflow: "hidden",
          color: theme.palette.primary.contrastText,
          background: `linear-gradient(180deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 52%, ${theme.palette.primary.dark} 100%)`,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 12% 8%, ${alpha(
              theme.palette.common.white,
              0.16,
            )}, transparent 34%), radial-gradient(circle at 86% 92%, ${alpha(
              theme.palette.primary.dark,
              0.38,
            )}, transparent 42%)`,
          },
        })}
      >
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            minHeight: "calc(100dvh - 72px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            pb: { xs: 16, md: 18 },
          }}
        >
          <Stack
            spacing={1.4}
            alignItems="center"
            sx={{ mt: { xs: 3, md: 1 } }}
          >
            <Box
              component="img"
              src="/CIELP.png"
              alt="Logo CIELP"
              width="112"
              height="112"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              sx={{
                width: { xs: 88, md: 112 },
                height: "auto",
                filter: "drop-shadow(0 10px 24px rgba(13, 54, 73, 0.28))",
              }}
            />

            <Typography
              component="h1"
              sx={{
                mt: 0.2,
                fontSize: { xs: "2.12rem", md: "3.55rem" },
                fontWeight: 700,
                lineHeight: 1.04,
                letterSpacing: "0.01em",
                textShadow: "0 6px 24px rgba(16, 52, 70, 0.22)",
              }}
            >
              Bienestar docente con evidencia accionable
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "1rem", md: "1.3rem" },
                fontWeight: 550,
                maxWidth: 760,
                lineHeight: 1.5,
              }}
            >
              CIELP ayuda a prevenir y abordar el burnout docente con evaluación
              temprana, analítica accionable y rutas de acompañamiento claras.
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              justifyContent="center"
              sx={{ mt: 0.5 }}
            >
              {trustBadges.map((badge) => (
                <Chip
                  key={badge}
                  label={badge}
                  sx={{
                    bgcolor: alpha("#ffffff", 0.16),
                    color: "primary.contrastText",
                    border: "1px solid",
                    borderColor: alpha("#ffffff", 0.24),
                  }}
                />
              ))}
            </Stack>

            <KeyboardArrowDownRoundedIcon
              sx={{
                fontSize: 30,
                mt: 0.35,
                animation: "landing-bounce 1.8s ease-in-out infinite",
                "@keyframes landing-bounce": {
                  "0%, 100%": { transform: "translateY(0)", opacity: 0.8 },
                  "50%": { transform: "translateY(8px)", opacity: 1 },
                },
              }}
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.4}
              sx={{ mt: 0.55 }}
            >
              <Button
                component={RouterLink}
                to="/registro-profesor"
                variant="contained"
                size="large"
                sx={(theme) => ({
                  textTransform: "none",
                  borderRadius: 999,
                  px: { xs: 3.4, md: 5.2 },
                  py: { xs: 1.2, md: 1.35 },
                  fontSize: { xs: "1rem", md: "1.1rem" },
                  fontWeight: 650,
                  color: theme.palette.secondary.contrastText,
                  bgcolor: theme.palette.secondary.light,
                  boxShadow: "0 10px 28px rgba(20, 58, 80, 0.26)",
                  "&:hover": {
                    bgcolor: theme.palette.secondary.main,
                    boxShadow: "0 12px 30px rgba(20, 58, 80, 0.3)",
                  },
                })}
              >
                Comenzar tamizaje
              </Button>

              <Button
                component={RouterLink}
                to="/#contacto"
                variant="outlined"
                size="large"
                sx={{
                  borderRadius: 999,
                  px: { xs: 3.4, md: 4.8 },
                  py: { xs: 1.2, md: 1.35 },
                  borderColor: alpha("#ffffff", 0.58),
                  color: "primary.contrastText",
                  fontSize: { xs: "1rem", md: "1.1rem" },
                  "&:hover": {
                    borderColor: "#ffffff",
                    backgroundColor: alpha("#ffffff", 0.12),
                  },
                }}
              >
                Solicitar demo institucional
              </Button>
            </Stack>
          </Stack>
        </Container>

        <Box
          aria-hidden
          sx={{
            color: "background.default",
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -2,
            zIndex: 0,
            lineHeight: 0,
            pointerEvents: "none",
          }}
        >
          <svg
            viewBox="0 0 1440 320"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            style={{ height: "250px", display: "block" }}
          >
            <path
              fill="currentColor"
              d="M0,192C120,234,240,256,360,248C480,240,600,202,720,184C840,166,960,170,1080,205.3C1200,240,1320,304,1440,293.3L1440,320L0,320Z"
            />
          </svg>
        </Box>
      </Box>

      <Box
        id="quienes-somos"
        component="section"
        sx={{
          color: "text.primary",
          position: "relative",
          zIndex: 2,
          py: { xs: 7, md: 10 },
          mt: { xs: -6, md: -4 },
          scrollMarginTop: "92px",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            spacing={1.4}
            textAlign="center"
          >
            <Typography
              variant="overline"
              sx={{ letterSpacing: "0.12em", color: "primary.main" }}
            >
              QUIÉNES SOMOS
            </Typography>
            <Typography
              variant="h4"
              sx={{ color: "text.primary", fontWeight: 700 }}
            >
              Acompañamiento profesional con enfoque humano
            </Typography>
            <Typography sx={{ color: "text.secondary", lineHeight: 1.75 }}>
              CIELP integra evaluación temprana, orientación y seguimiento para
              prevenir y abordar el burnout docente con una experiencia clara,
              ética y segura.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Box
        id="beneficios"
        component="section"
        sx={{ py: { xs: 6, md: 10 }, scrollMarginTop: "92px" }}
      >
        <Container maxWidth="lg">
          <Stack
            spacing={1.2}
            sx={{ mb: 3.4 }}
          >
            <Typography
              variant="overline"
              sx={{ letterSpacing: "0.12em", color: "primary.main" }}
            >
              BENEFICIOS POR ROL
            </Typography>
            <Typography
              variant="h4"
              sx={{ color: "text.primary" }}
            >
              Valor concreto para cada actor de la comunidad educativa
            </Typography>
          </Stack>

          <Grid
            container
            spacing={2.2}
          >
            {roleBenefits.map((role) => (
              <Grid
                key={role.role}
                size={{ xs: 12, md: 4 }}
              >
                <Paper sx={{ p: 2.4, height: "100%" }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 1.2 }}
                  >
                    {role.role}
                  </Typography>
                  <Stack spacing={1.1}>
                    {role.points.map((point) => (
                      <Stack
                        key={point}
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <CheckCircleRoundedIcon
                          sx={{ color: "primary.main", mt: "3px" }}
                          fontSize="small"
                        />
                        <Typography sx={{ color: "text.secondary" }}>
                          {point}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box
        id="como-funciona"
        component="section"
        sx={{ py: { xs: 6, md: 10 }, scrollMarginTop: "92px" }}
      >
        <Container maxWidth="lg">
          <Stack
            spacing={1.2}
            sx={{ mb: 3.2 }}
          >
            <Typography
              variant="overline"
              sx={{ letterSpacing: "0.12em", color: "primary.main" }}
            >
              CÓMO FUNCIONA
            </Typography>
            <Typography variant="h4">Un proceso en tres pasos</Typography>
          </Stack>

          <Grid
            container
            spacing={2.2}
          >
            {steps.map((step) => {
              const StepIcon = step.icon;

              return (
                <Grid
                  key={step.title}
                  size={{ xs: 12, md: 4 }}
                >
                  <Paper sx={{ p: 2.6, height: "100%" }}>
                    <Stack spacing={1.2}>
                      <StepIcon
                        sx={{ color: "secondary.main", fontSize: 34 }}
                      />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700 }}
                      >
                        {step.title}
                      </Typography>
                      <Typography
                        sx={{ color: "text.secondary", lineHeight: 1.65 }}
                      >
                        {step.detail}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      <Box
        id="prueba-social"
        component="section"
        sx={{ py: { xs: 6, md: 8 }, scrollMarginTop: "92px" }}
      >
        <Container maxWidth="lg">
          <Paper
            sx={(theme) => ({
              p: { xs: 2.4, md: 3.5 },
              background: `linear-gradient(120deg, ${alpha(
                theme.palette.primary.light,
                0.2,
              )} 0%, ${alpha(theme.palette.secondary.light, 0.28)} 100%)`,
            })}
          >
            <Grid
              container
              spacing={2.2}
              alignItems="stretch"
            >
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={1}>
                  <Typography
                    variant="overline"
                    sx={{ letterSpacing: "0.12em", color: "primary.main" }}
                  >
                    EVIDENCIA CIENTIFICA
                  </Typography>
                  <Typography variant="h5">
                    "El inventario MBI-ES presenta adecuadas evidencias
                    psicométricas en población docente."
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }}>
                    Fuente: Aranguez Díaz y Vásquez Sempertegui (2021), estudio
                    en docentes de Lima Metropolitana.
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Chip
                    label="Muestra: 232 docentes"
                    color="primary"
                  />
                  <Chip
                    label="Estructura: 3 factores (MBI-ES)"
                    color="secondary"
                  />
                  <Chip label="Confiabilidad Omega adecuada" />
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      <Box
        id="seguridad"
        component="section"
        sx={{ py: { xs: 4.5, md: 6.5 }, scrollMarginTop: "92px" }}
      >
        <Container maxWidth="lg">
          <Paper sx={{ p: { xs: 2.3, md: 2.8 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <LockPersonRoundedIcon
                sx={{ color: "primary.main", fontSize: 34 }}
              />
              <Box>
                <Typography
                  variant="h6"
                  sx={{ mb: 0.4 }}
                >
                  Seguridad y privacidad desde el diseño
                </Typography>
                <Typography sx={{ color: "text.secondary", lineHeight: 1.65 }}>
                  Protegemos la información con buenas prácticas de seguridad,
                  acceso por roles y control de la trazabilidad para procesos
                  institucionales responsables.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Container>
      </Box>

      <Box
        id="faq"
        component="section"
        sx={{ py: { xs: 6, md: 10 }, scrollMarginTop: "92px" }}
      >
        <Container maxWidth="md">
          <Stack
            spacing={1.2}
            sx={{ mb: 2.2 }}
          >
            <Typography
              variant="overline"
              sx={{ letterSpacing: "0.12em", color: "primary.main" }}
            >
              FAQ
            </Typography>
            <Typography variant="h4">Preguntas frecuentes</Typography>
          </Stack>

          <Stack spacing={1.2}>
            {faqs.map((item) => (
              <Accordion key={item.question}>
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {item.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    sx={{ color: "text.secondary", lineHeight: 1.65 }}
                  >
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>

      <Box
        id="contacto"
        component="section"
        sx={{ py: { xs: 6, md: 10 }, scrollMarginTop: "92px" }}
      >
        <Container maxWidth="lg">
          <Grid
            container
            spacing={2.2}
          >
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: { xs: 2.4, md: 3.4 }, height: "100%" }}>
                <Stack spacing={1.2}>
                  <Typography
                    variant="overline"
                    sx={{ letterSpacing: "0.12em", color: "primary.main" }}
                  >
                    CONTACTO DIRECTO
                  </Typography>
                  <Typography variant="h4">
                    Conversemos sobre su contexto
                  </Typography>
                  <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                    Si desea implementar CIELP en su institución, podemos
                    coordinar una sesión de diagnóstico inicial para definir
                    alcance, tiempos y objetivos.
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.2}
                    sx={{ pt: 0.6 }}
                  >
                    <Button
                      href="mailto:cielpcontacto@gmail.com"
                      variant="contained"
                      size="large"
                    >
                      Escribir por correo
                    </Button>
                    <Button
                      href="https://wa.me/573004301256"
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      size="large"
                    >
                      Contactar por WhatsApp
                    </Button>
                  </Stack>

                  <Stack
                    spacing={0.5}
                    sx={{ pt: 0.4 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Correo: cielpcontacto@gmail.com
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      WhatsApp: +57 300 430 1256
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                sx={{
                  p: { xs: 2.4, md: 3.1 },
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Stack spacing={1.3}>
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <OndemandVideoRoundedIcon
                      sx={{ color: "secondary.main" }}
                    />
                    Demo recomendada
                  </Typography>
                  <Typography
                    sx={{ color: "text.secondary", lineHeight: 1.65 }}
                  >
                    Sesión de 30 minutos para conocer la plataforma, revisar
                    casos de uso y resolver dudas de implementación.
                  </Typography>
                  <Typography
                    sx={{ color: "text.secondary", lineHeight: 1.65 }}
                  >
                    Disponibilidad: lunes a viernes, 8:00 a.m. - 5:00 p.m.
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: { xs: 4, md: 5 },
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Container maxWidth="lg">
          <Grid
            container
            spacing={2}
            alignItems="center"
          >
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="center"
              >
                <Box
                  component="img"
                  src="/CIELP.png"
                  alt="Logo CIELP"
                  width="38"
                  height="38"
                  loading="lazy"
                  decoding="async"
                  sx={{ width: 38, height: "auto" }}
                />
                <Typography sx={{ fontWeight: 700 }}>CIELP</Typography>
              </Stack>
              <Typography sx={{ mt: 1, color: "text.secondary" }}>
                Plataforma para bienestar docente con enfoque preventivo,
                analítico y humano.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 1, sm: 2.4 }}
                justifyContent={{ md: "flex-end" }}
              >
                <Link
                  component={RouterLink}
                  to="/#quienes-somos"
                  underline="hover"
                >
                  Quiénes somos
                </Link>
                <Link
                  component={RouterLink}
                  to="/#beneficios"
                  underline="hover"
                >
                  Beneficios
                </Link>
                <Link
                  component={RouterLink}
                  to="/#faq"
                  underline="hover"
                >
                  FAQ
                </Link>
                <Link
                  href="mailto:cielpcontacto@gmail.com"
                  underline="hover"
                >
                  Contacto
                </Link>
                <Link
                  href="https://wa.me/573004301256"
                  target="_blank"
                  rel="noreferrer"
                  underline="hover"
                >
                  WhatsApp
                </Link>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.2 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={0.8}
            justifyContent="space-between"
          >
            <Typography
              variant="body2"
              sx={{ color: "text.secondary" }}
            >
              © {new Date().getFullYear()} CIELP. Todos los derechos reservados.
            </Typography>
            <Stack
              direction="row"
              spacing={0.8}
              alignItems="center"
              flexWrap="wrap"
            >
              <Link
                component={RouterLink}
                to="/politica-privacidad"
                underline="hover"
                variant="body2"
              >
                Politica de privacidad
              </Link>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary" }}
              >
                |
              </Typography>
              <Link
                component={RouterLink}
                to="/terminos-uso"
                underline="hover"
                variant="body2"
              >
                Terminos de uso
              </Link>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;
