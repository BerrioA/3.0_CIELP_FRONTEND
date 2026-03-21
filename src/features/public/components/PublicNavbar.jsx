import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { id: "home", item: "Inicio", href: "/" },
  { id: "about", item: "Quienes Somos", href: "/#quienes-somos" },
  { id: "login", item: "Iniciar Sesión", href: "/login" },
];

function PublicNavbar() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [openPath, setOpenPath] = useState(null);

  const currentRouteKey = `${location.pathname}${location.hash}`;
  const isOpen = openPath === currentRouteKey;

  const isRegisterRoute = location.pathname === "/registro-profesor";
  const isLoginRoute = location.pathname === "/login";
  const isHomeRoute =
    location.pathname === "/" || location.pathname === "/index";
  const isAtLandingTop =
    isHomeRoute && (location.hash === "" || location.hash === "#");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHomeClick = (event) => {
    event.preventDefault();
    handleCloseMenu();

    if (isHomeRoute) {
      window.history.replaceState(null, "", "/");
      scrollToTop();
      return;
    }

    navigate("/");
  };

  const scrollToAboutSection = () => {
    const section = document.getElementById("quienes-somos");

    if (!section) {
      return;
    }

    const navbarOffset = 84;
    const top =
      section.getBoundingClientRect().top + window.scrollY - navbarOffset;

    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleAboutClick = (event) => {
    event.preventDefault();
    handleCloseMenu();

    if (isHomeRoute) {
      window.history.replaceState(null, "", "/#quienes-somos");
      scrollToAboutSection();
      return;
    }

    navigate({ pathname: "/", hash: "#quienes-somos" });
  };

  const shouldHideItem = (itemId) => {
    if (itemId === "home" && isAtLandingTop) {
      return true;
    }

    if (itemId === "login" && isLoginRoute) {
      return true;
    }

    return false;
  };

  const visibleItems = navItems.filter((item) => !shouldHideItem(item.id));

  const handleToggleMenu = () => {
    setOpenPath((prev) => (prev === currentRouteKey ? null : currentRouteKey));
  };

  const handleCloseMenu = () => {
    setOpenPath(null);
  };

  return (
    <Box
      component="header"
      sx={{
        width: "100%",
        position: "fixed",
        top: 0,
        zIndex: 1400,
        bgcolor: "primary.main",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        component="nav"
        sx={{
          mx: "auto",
          maxWidth: 1280,
          px: { xs: 2, sm: 3 },
          py: 1.4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "primary.contrastText" }}
        >
          cielpcontacto@gmail.com
        </Typography>

        <Stack
          direction="row"
          spacing={1.2}
          alignItems="center"
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          {visibleItems.map((item) => (
            <Button
              key={item.id}
              component={RouterLink}
              to={item.href}
              onClick={
                item.id === "about"
                  ? handleAboutClick
                  : item.id === "home"
                    ? handleHomeClick
                    : undefined
              }
              color="inherit"
              size="small"
              sx={{
                textTransform: "none",
                color: "primary.contrastText",
                fontWeight: 500,
                opacity: 0.92,
                "&:hover": { opacity: 1 },
              }}
            >
              {item.item}
            </Button>
          ))}

          {!isRegisterRoute ? (
            <Button
              component={RouterLink}
              to="/registro-profesor"
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                px: 2.4,
                bgcolor: "primary.dark",
                color: "primary.contrastText",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                  boxShadow: "none",
                },
              }}
            >
              Registrarse
            </Button>
          ) : null}
        </Stack>

        <IconButton
          onClick={handleToggleMenu}
          aria-label="Abrir o cerrar menú"
          sx={{
            display: { xs: "inline-flex", md: "none" },
            color: "primary.contrastText",
          }}
        >
          {isOpen ? <KeyboardArrowUpRoundedIcon /> : <MenuRoundedIcon />}
        </IconButton>
      </Box>

      {isOpen ? (
        <Box
          sx={{
            display: { xs: "block", md: "none" },
            minHeight: "calc(100dvh - 64px)",
            px: 2,
            py: 3,
            backdropFilter: "blur(10px)",
            bgcolor: "rgba(7, 78, 78, 0.94)",
          }}
        >
          <Stack
            spacing={1}
            alignItems="stretch"
          >
            {visibleItems.map((item) => (
              <Button
                key={item.id}
                component={RouterLink}
                to={item.href}
                onClick={
                  item.id === "about"
                    ? handleAboutClick
                    : item.id === "home"
                      ? handleHomeClick
                      : handleCloseMenu
                }
                sx={{
                  justifyContent: "center",
                  textTransform: "none",
                  color: "primary.contrastText",
                  py: 1.2,
                }}
              >
                {item.item}
              </Button>
            ))}

            {!isRegisterRoute ? (
              <Button
                component={RouterLink}
                to="/registro-profesor"
                onClick={handleCloseMenu}
                variant="contained"
                sx={{
                  mt: 1.2,
                  textTransform: "none",
                  borderRadius: 999,
                  bgcolor: "secondary.light",
                  color: "secondary.contrastText",
                  "&:hover": { bgcolor: "secondary.main" },
                }}
              >
                Registrarse
              </Button>
            ) : null}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}

export default PublicNavbar;
