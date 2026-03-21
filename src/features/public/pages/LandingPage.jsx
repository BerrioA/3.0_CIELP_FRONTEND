import { useEffect } from "react";
import { Box, Button, Container, Link, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Link as RouterLink, useLocation } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";

function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#quienes-somos") {
      return;
    }

    let attempts = 0;
    const maxAttempts = 12;

    const scrollToTarget = () => {
      const section = document.getElementById("quienes-somos");

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
          maxWidth="md"
          sx={{
            position: "relative",
            zIndex: 1,
            minHeight: "calc(100dvh - 72px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            pb: { xs: 16, md: 18 },
          }}
        >
          <Stack
            spacing={2}
            alignItems="center"
            sx={{ mt: { xs: 3, md: 1 } }}
          >
            <Box
              component="img"
              src="/CIELP.png"
              alt="Logo CIELP"
              sx={{
                width: { xs: 94, md: 124 },
                height: "auto",
                filter: "drop-shadow(0 10px 24px rgba(13, 54, 73, 0.28))",
              }}
            />

            <Typography
              component="h1"
              sx={{
                mt: 0.2,
                fontSize: { xs: "2.52rem", md: "4.02rem" },
                fontWeight: 700,
                lineHeight: 1.04,
                letterSpacing: "0.01em",
                textShadow: "0 6px 24px rgba(16, 52, 70, 0.22)",
              }}
            >
              ¡Bienvenido a CIELP!
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "1.30rem", md: "2.26rem" },
                fontWeight: 680,
                maxWidth: 900,
                lineHeight: { xs: 1.3, md: 1.28 },
              }}
            >
              Estamos aquí para acompañarle en la prevención y abordaje del
              burnout docente.
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "0.96rem", md: "1.25rem" },
                color: "rgba(255,255,255,0.9)",
                maxWidth: 840,
                lineHeight: 1.55,
              }}
            >
              Responda unas preguntas breves para identificar su nivel de riesgo
              y recomendarle una ruta de acompañamiento para el bienestar
              docente.
            </Typography>

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

            <Button
              component={RouterLink}
              to="/registro-profesor"
              variant="contained"
              size="large"
              sx={(theme) => ({
                mt: 0.55,
                textTransform: "none",
                borderRadius: 999,
                px: { xs: 3.4, md: 5.2 },
                py: { xs: 1.2, md: 1.35 },
                fontSize: { xs: "1rem", md: "1.22rem" },
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
              ¿Qué apoyo necesita hoy? Inicie su tamizaje
            </Button>
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
            zIndex: 1,
            lineHeight: 0,
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
        }}
      >
        <Container maxWidth="md">
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
              CIELP integra evaluación temprana, rutas de orientación y
              seguimiento institucional para prevenir y abordar el síndrome de
              burnout en docentes, con una experiencia clara, ética y segura.
            </Typography>
            <Link
              component={RouterLink}
              to="/login"
              underline="hover"
              sx={{
                mt: 1,
                alignSelf: "center",
                color: "primary.dark",
                fontWeight: 600,
              }}
            >
              Ingresar a la plataforma
            </Link>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;
