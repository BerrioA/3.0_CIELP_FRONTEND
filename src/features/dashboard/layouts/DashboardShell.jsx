import {
  AppBar,
  Avatar,
  Badge,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  CircularProgress,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import { useEffect, useMemo, useState } from "react";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  getDashboardNavigationByRole,
  getDefaultDashboardPathByRole,
} from "../config/dashboard-navigation";
import { USER_ROLES } from "../config/roles";
import { useAuthStore } from "../../auth/store/auth.store";
import { useDashboardPreferencesStore } from "../store/dashboard-preferences.store";
import { formatRoleLabel } from "../../../shared/lib/roleFormatter";
import AdditionalInformationOnboardingModal from "../components/AdditionalInformationOnboardingModal";
import LogoutConfirmDialog from "../components/LogoutConfirmDialog";
import {
  getMyBurnoutAlertsApi,
  markBurnoutAlertAsReadApi,
} from "../services/mbi-alerts.service";

const DRAWER_WIDTH = {
  regular: 268,
  compact: 88,
};

function DashboardShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isSmallPhone = useMediaQuery("(max-width:430px)");
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = user?.role;
  const fetchPreferences = useDashboardPreferencesStore(
    (state) => state.fetchPreferences,
  );
  const compactModeEnabled = useDashboardPreferencesStore(
    (state) => state.preferences.compact_dashboard_mode_enabled,
  );
  const [dismissedPromptByUser, setDismissedPromptByUser] = useState({});
  const [pendingAlertsCount, setPendingAlertsCount] = useState(0);
  const [headerAlerts, setHeaderAlerts] = useState([]);
  const [isLoadingHeaderAlerts, setIsLoadingHeaderAlerts] = useState(false);
  const [alertsMenuAnchorEl, setAlertsMenuAnchorEl] = useState(null);
  const [markingAlertId, setMarkingAlertId] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const [currentDateTimeLabel, setCurrentDateTimeLabel] = useState("");
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const formatCurrentDateTime = () =>
      new Intl.DateTimeFormat("es-CO", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date());

    setCurrentDateTimeLabel(formatCurrentDateTime());

    const intervalId = window.setInterval(() => {
      setCurrentDateTimeLabel(formatCurrentDateTime());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      return;
    }

    void fetchPreferences({ userUid: user.uid });
  }, [fetchPreferences, isAuthenticated, user?.uid]);

  useEffect(() => {
    if (!isAuthenticated || userRole !== USER_ROLES.PSYCHOLOGIST) {
      setHeaderAlerts([]);
      return;
    }

    let isMounted = true;

    const fetchPendingAlerts = async () => {
      setIsLoadingHeaderAlerts(true);

      try {
        const response = await getMyBurnoutAlertsApi();
        const alerts = Array.isArray(response?.data) ? response.data : [];
        const activeAlerts = alerts.filter(
          (alert) =>
            !alert?.is_read &&
            ["high", "critical"].includes(String(alert?.risk_level || "")),
        );

        if (isMounted) {
          setPendingAlertsCount(activeAlerts.length);
          setHeaderAlerts(activeAlerts.slice(0, 8));
        }
      } catch {
        if (isMounted) {
          setPendingAlertsCount(0);
          setHeaderAlerts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingHeaderAlerts(false);
        }
      }
    };

    void fetchPendingAlerts();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, userRole, location.pathname]);

  const drawerWidth = compactModeEnabled
    ? DRAWER_WIDTH.compact
    : DRAWER_WIDTH.regular;

  const roleNavigation = useMemo(
    () => getDashboardNavigationByRole(userRole),
    [userRole],
  );

  const selectedPath =
    roleNavigation.find((item) => location.pathname.startsWith(item.path))
      ?.path || getDefaultDashboardPathByRole(userRole);

  const notificationCount =
    userRole === USER_ROLES.PSYCHOLOGIST ? pendingAlertsCount : 0;
  const isAlertsMenuOpen = Boolean(alertsMenuAnchorEl);
  const isMobileMoreMenuOpen = Boolean(mobileMoreAnchorEl);
  const maxPrimaryMobileActions = 3;
  const useCollapsedMobileNavigation =
    !isDesktop &&
    isSmallPhone &&
    roleNavigation.length > maxPrimaryMobileActions;
  const primaryMobileNavigation = useCollapsedMobileNavigation
    ? roleNavigation.slice(0, maxPrimaryMobileActions)
    : roleNavigation;
  const overflowMobileNavigation = useCollapsedMobileNavigation
    ? roleNavigation.slice(maxPrimaryMobileActions)
    : [];
  const selectedInOverflow = overflowMobileNavigation.some(
    (item) => item.path === selectedPath,
  );
  const mobileBottomValue =
    useCollapsedMobileNavigation && selectedInOverflow
      ? "__more__"
      : selectedPath;

  const formatAlertDate = (value) => {
    if (!value) {
      return "Sin fecha";
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return "Sin fecha";
    }

    return parsed.toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const openAlertsMenu = (event) => {
    if (userRole !== USER_ROLES.PSYCHOLOGIST) {
      return;
    }

    setAlertsMenuAnchorEl(event.currentTarget);
  };

  const closeAlertsMenu = () => {
    setAlertsMenuAnchorEl(null);
  };

  const openMobileMoreMenu = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const closeMobileMoreMenu = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMarkAlertAsRead = async (alertId) => {
    if (!alertId || markingAlertId) {
      return;
    }

    setMarkingAlertId(alertId);

    try {
      await markBurnoutAlertAsReadApi(alertId);

      setHeaderAlerts((previousAlerts) =>
        previousAlerts.filter((alert) => alert.id !== alertId),
      );

      setPendingAlertsCount((previousCount) => Math.max(0, previousCount - 1));
    } catch {
      // En el header priorizamos no bloquear UX por errores de red puntuales.
    } finally {
      setMarkingAlertId(null);
    }
  };

  const handleRequestLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleCloseLogoutDialog = () => {
    if (isLoggingOut) {
      return;
    }

    setIsLogoutDialogOpen(false);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
      setIsLogoutDialogOpen(false);
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isCompactDesktop = isDesktop && compactModeEnabled;
  const shouldPromptAdditionalInformation =
    isAuthenticated &&
    userRole === USER_ROLES.TEACHER &&
    user?.has_additional_information === false;

  const renderNavList = () => (
    <List sx={{ px: 1.3, pt: 0.8 }}>
      {roleNavigation.map((item) => {
        const Icon = item.icon;
        const selected =
          item.path === "/dashboard"
            ? location.pathname === "/dashboard"
            : location.pathname.startsWith(item.path);

        const navButton = (
          <ListItemButton
            key={item.path}
            component={RouterLink}
            to={item.path}
            selected={selected}
            sx={{
              mb: 0.8,
              borderRadius: 1.25,
              py: 1,
              px: isCompactDesktop ? 1 : 1.6,
              justifyContent: isCompactDesktop ? "center" : "flex-start",
              "&.Mui-selected": {
                bgcolor: alpha(theme.palette.primary.main, 0.13),
                color: "primary.dark",
                "& .MuiListItemIcon-root": {
                  color: "primary.dark",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: isCompactDesktop ? 0 : 38,
                mr: isCompactDesktop ? 0 : 1,
                justifyContent: "center",
              }}
            >
              <Icon fontSize="small" />
            </ListItemIcon>
            {!isCompactDesktop ? <ListItemText primary={item.label} /> : null}
          </ListItemButton>
        );

        if (!isCompactDesktop) {
          return navButton;
        }

        return (
          <Tooltip
            key={item.path}
            title={item.label}
            placement="right"
            arrow
          >
            {navButton}
          </Tooltip>
        );
      })}
    </List>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        bgcolor: "background.default",
      }}
    >
      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            },
          }}
        >
          <Box sx={{ p: 2.3 }}>
            {isCompactDesktop ? (
              <Typography
                variant="h6"
                sx={{ textAlign: "center", fontWeight: 700 }}
              >
                C
              </Typography>
            ) : (
              <>
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: "0.12em" }}
                >
                  CIELP DASHBOARD
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ mt: 0.5 }}
                >
                  Panel principal
                </Typography>
              </>
            )}
          </Box>
          <Divider />
          {renderNavList()}
          <Box sx={{ mt: "auto", p: 1.3 }}>
            {isCompactDesktop ? (
              <Tooltip
                title="Cerrar sesión"
                placement="right"
                arrow
              >
                <ListItemButton
                  onClick={handleRequestLogout}
                  sx={{
                    borderRadius: 1.25,
                    px: 1,
                    justifyContent: "center",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: "center",
                    }}
                  >
                    <LogoutRoundedIcon fontSize="small" />
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            ) : (
              <ListItemButton
                onClick={handleRequestLogout}
                sx={{
                  borderRadius: 1.25,
                  px: 1.6,
                  justifyContent: "flex-start",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    mr: 1,
                    justifyContent: "center",
                  }}
                >
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Cerrar sesión" />
              </ListItemButton>
            )}
          </Box>
        </Drawer>
      ) : null}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          pb: { xs: 9, md: 0 },
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          color="transparent"
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: "blur(12px)",
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
              sx={{ flexGrow: 1 }}
            >
              <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }}>
                {(user?.given_name || "U")[0]?.toUpperCase()}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.1 }}
                >
                  Bienvenido
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    lineHeight: 1.2,
                    maxWidth: { xs: 170, md: "100%" },
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {isDesktop
                    ? currentDateTimeLabel
                    : user?.given_name
                      ? `${user.given_name} ${user.surname || ""}`
                      : "Usuario"}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ ml: 1 }}
            >
              <Tooltip
                title={
                  notificationCount > 0
                    ? `${notificationCount} notificacion(es) pendiente(s)`
                    : "Sin notificaciones pendientes"
                }
                arrow
              >
                <IconButton
                  size="small"
                  onClick={openAlertsMenu}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Badge
                    color="error"
                    badgeContent={notificationCount}
                    max={99}
                  >
                    <NotificationsNoneRoundedIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              {isDesktop ? (
                <Stack
                  direction="row"
                  spacing={0.8}
                  alignItems="center"
                  sx={{
                    pl: 1,
                    py: 0.5,
                    pr: 0.6,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 99,
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      maxWidth: 190,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user?.given_name
                      ? `${user.given_name} ${user.surname || ""}`
                      : "Usuario"}
                  </Typography>
                  <Chip
                    size="small"
                    label={formatRoleLabel(userRole)}
                    variant="outlined"
                  />
                </Stack>
              ) : null}
            </Stack>
          </Toolbar>

          <Menu
            anchorEl={alertsMenuAnchorEl}
            open={isAlertsMenuOpen}
            onClose={closeAlertsMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                width: 360,
                maxWidth: "92vw",
                p: 1,
                borderRadius: 1.4,
              },
            }}
          >
            <Box sx={{ px: 1, pt: 0.5, pb: 1 }}>
              <Typography variant="subtitle2">
                Notificaciones clínicas
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {notificationCount > 0
                  ? `${notificationCount} notificacion(es) pendientes de revision`
                  : "No tienes notificaciones pendientes"}
              </Typography>
            </Box>

            <Divider sx={{ mb: 0.8 }} />

            {isLoadingHeaderAlerts ? (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ px: 1.4, py: 1.2 }}
              >
                <CircularProgress size={16} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Cargando alertas...
                </Typography>
              </Stack>
            ) : null}

            {!isLoadingHeaderAlerts && headerAlerts.length === 0 ? (
              <Box sx={{ px: 1.4, py: 1.1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Sin novedades por ahora.
                </Typography>
              </Box>
            ) : null}

            {!isLoadingHeaderAlerts
              ? headerAlerts.map((alert) => {
                  const teacherName =
                    `${alert?.teacher?.given_name || ""} ${alert?.teacher?.surname || ""}`.trim() ||
                    "Docente";

                  return (
                    <MenuItem
                      key={alert.id}
                      disableRipple
                      sx={{
                        alignItems: "flex-start",
                        whiteSpace: "normal",
                        py: 0.8,
                        px: 1,
                      }}
                    >
                      <Stack
                        spacing={0.7}
                        sx={{ width: "100%" }}
                      >
                        <ListItemText
                          primary={`${teacherName} · ${
                            alert?.risk_level === "critical"
                              ? "Riesgo critico"
                              : "Riesgo alto"
                          }`}
                          secondary={`Espacio sugerido: ${alert?.recommended_space_name || "N/A"} · ${formatAlertDate(alert?.created_at)}`}
                        />

                        <Stack
                          direction="row"
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            variant="text"
                            disabled={markingAlertId === alert.id}
                            onClick={() => void handleMarkAlertAsRead(alert.id)}
                          >
                            {markingAlertId === alert.id
                              ? "Guardando..."
                              : "Marcar leida"}
                          </Button>
                        </Stack>
                      </Stack>
                    </MenuItem>
                  );
                })
              : null}

            <Divider sx={{ mt: 0.8 }} />

            <Box
              sx={{
                px: 1,
                py: 0.8,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Button
                size="small"
                onClick={() => {
                  closeAlertsMenu();
                  navigate("/dashboard");
                }}
              >
                Ver panel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={closeAlertsMenu}
              >
                Cerrar
              </Button>
            </Box>
          </Menu>
        </AppBar>

        <Box
          sx={{
            px: { xs: 2, sm: compactModeEnabled ? 2 : 3 },
            py: {
              xs: compactModeEnabled ? 1.5 : 2,
              md: compactModeEnabled ? 2 : 3,
            },
            flexGrow: 1,
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {!isDesktop ? (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            zIndex: theme.zIndex.appBar,
          }}
        >
          <BottomNavigation
            value={mobileBottomValue}
            onChange={(_, nextPath) => {
              if (nextPath === "__more__") {
                return;
              }

              if (nextPath === "__logout__") {
                handleRequestLogout();
                return;
              }
              navigate(nextPath);
            }}
            showLabels
          >
            {primaryMobileNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <BottomNavigationAction
                  key={item.path}
                  value={item.path}
                  label={item.label}
                  icon={<Icon />}
                />
              );
            })}

            {useCollapsedMobileNavigation ? (
              <BottomNavigationAction
                value="__more__"
                label="Mas"
                icon={<MoreHorizRoundedIcon />}
                onClick={openMobileMoreMenu}
              />
            ) : (
              <BottomNavigationAction
                value="__logout__"
                label="Salir"
                icon={<LogoutRoundedIcon />}
              />
            )}
          </BottomNavigation>

          {useCollapsedMobileNavigation ? (
            <Menu
              anchorEl={mobileMoreAnchorEl}
              open={isMobileMoreMenuOpen}
              onClose={closeMobileMoreMenu}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
              transformOrigin={{ vertical: "bottom", horizontal: "center" }}
              PaperProps={{
                sx: {
                  mb: 1,
                  minWidth: 220,
                  borderRadius: 1.4,
                },
              }}
            >
              {overflowMobileNavigation.map((item) => {
                const Icon = item.icon;
                const isSelected = item.path === selectedPath;

                return (
                  <MenuItem
                    key={item.path}
                    selected={isSelected}
                    onClick={() => {
                      closeMobileMoreMenu();
                      navigate(item.path);
                    }}
                  >
                    <ListItemIcon>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </MenuItem>
                );
              })}

              <Divider sx={{ my: 0.5 }} />

              <MenuItem
                onClick={() => {
                  closeMobileMoreMenu();
                  handleRequestLogout();
                }}
              >
                <ListItemIcon>
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Salir" />
              </MenuItem>
            </Menu>
          ) : null}
        </Box>
      ) : null}

      <AdditionalInformationOnboardingModal
        open={
          shouldPromptAdditionalInformation &&
          !dismissedPromptByUser[user?.uid || "anonymous"]
        }
        onClose={() => {
          setDismissedPromptByUser((previousValue) => ({
            ...previousValue,
            [user?.uid || "anonymous"]: true,
          }));
        }}
      />

      <LogoutConfirmDialog
        open={isLogoutDialogOpen}
        onClose={handleCloseLogoutDialog}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </Box>
  );
}

export default DashboardShell;
