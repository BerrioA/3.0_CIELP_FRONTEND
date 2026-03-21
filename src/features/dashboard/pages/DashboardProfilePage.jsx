import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import DashboardSectionCard from "../components/DashboardSectionCard";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  changePasswordDefaultValues,
  changePasswordSchema,
} from "../schemas/change-password.schema";
import { changeMyPasswordService } from "../../auth/services/auth.service";
import { useDashboardPreferencesStore } from "../store/dashboard-preferences.store";
import { formatRoleLabel } from "../../../shared/lib/roleFormatter";
import {
  additionalInformationDefaultValues,
  additionalInformationSchema,
} from "../schemas/additional-information.schema";
import { useDashboardUsersStore } from "../store/dashboard-users.store";
import LogoutConfirmDialog from "../components/LogoutConfirmDialog";

const ROLE_PROFILE_HINTS = {
  superAdmin:
    "Puedes administrar políticas globales y supervisar toda la plataforma.",
  admin: "Gestionas operación, usuarios y seguimiento general de procesos.",
  psychologist:
    "Tienes acceso orientado a acompañamiento y análisis de bienestar.",
  teacher: "Tu panel está orientado a seguimiento personal y autocuidado.",
  developer:
    "Tu enfoque está en observabilidad técnica e integraciones del sistema.",
};

const SETTINGS_SECTIONS = [
  {
    id: "cuenta",
    label: "Cuenta",
    icon: PersonRoundedIcon,
    caption: "Perfil e información personal",
  },
  {
    id: "seguridad",
    label: "Seguridad",
    icon: SecurityRoundedIcon,
    caption: "Contraseña y protección de acceso",
  },
  {
    id: "preferencias",
    label: "Preferencias",
    icon: TuneRoundedIcon,
    caption: "Experiencia y notificaciones",
  },
  {
    id: "sesion",
    label: "Sesión",
    icon: LogoutRoundedIcon,
    caption: "Control de acceso en este dispositivo",
  },
];

function DashboardProfilePage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const markAdditionalInformationCompleted = useAuthStore(
    (state) => state.markAdditionalInformationCompleted,
  );
  const roleHint =
    ROLE_PROFILE_HINTS[user?.role] || "Perfil de usuario activo.";
  const [activeSection, setActiveSection] = useState("cuenta");
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const preferences = useDashboardPreferencesStore(
    (state) => state.preferences,
  );
  const hasLoadedPreferences = useDashboardPreferencesStore(
    (state) => state.hasLoadedPreferences,
  );
  const isLoadingPreferences = useDashboardPreferencesStore(
    (state) => state.isLoadingPreferences,
  );
  const isSavingPreferences = useDashboardPreferencesStore(
    (state) => state.isSavingPreferences,
  );
  const preferencesError = useDashboardPreferencesStore(
    (state) => state.preferencesError,
  );
  const preferencesSuccessMessage = useDashboardPreferencesStore(
    (state) => state.preferencesSuccessMessage,
  );
  const fetchPreferences = useDashboardPreferencesStore(
    (state) => state.fetchPreferences,
  );
  const savePreferences = useDashboardPreferencesStore(
    (state) => state.savePreferences,
  );
  const setLocalPreference = useDashboardPreferencesStore(
    (state) => state.setLocalPreference,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: changePasswordDefaultValues,
    mode: "onChange",
  });

  const {
    register: registerAdditionalInfo,
    handleSubmit: handleSubmitAdditionalInfo,
    reset: resetAdditionalInfo,
    formState: {
      errors: additionalInfoErrors,
      isValid: isAdditionalInfoValid,
      isSubmitting: isSubmittingAdditionalInfo,
    },
  } = useForm({
    resolver: zodResolver(additionalInformationSchema),
    defaultValues: additionalInformationDefaultValues,
    mode: "onChange",
  });

  const registerAdditionalInformation = useDashboardUsersStore(
    (state) => state.registerAdditionalInformation,
  );
  const isRegisteringAdditionalInformation = useDashboardUsersStore(
    (state) => state.isRegisteringAdditionalInformation,
  );
  const registerAdditionalInformationError = useDashboardUsersStore(
    (state) => state.registerAdditionalInformationError,
  );
  const registerAdditionalInformationSuccessMessage = useDashboardUsersStore(
    (state) => state.registerAdditionalInformationSuccessMessage,
  );
  const clearAdditionalInformationStatus = useDashboardUsersStore(
    (state) => state.clearAdditionalInformationStatus,
  );
  const fetchMyAdditionalInformation = useDashboardUsersStore(
    (state) => state.fetchMyAdditionalInformation,
  );
  const myAdditionalInformation = useDashboardUsersStore(
    (state) => state.myAdditionalInformation,
  );
  const isLoadingMyAdditionalInformation = useDashboardUsersStore(
    (state) => state.isLoadingMyAdditionalInformation,
  );
  const myAdditionalInformationError = useDashboardUsersStore(
    (state) => state.myAdditionalInformationError,
  );
  const hasLoadedMyAdditionalInformation = useDashboardUsersStore(
    (state) => state.hasLoadedMyAdditionalInformation,
  );

  const onSubmitPassword = async (values) => {
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const response = await changeMyPasswordService({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      setPasswordSuccess(
        response?.message || "Contraseña actualizada correctamente.",
      );
      reset(changePasswordDefaultValues);
    } catch (error) {
      setPasswordError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "No fue posible actualizar la contraseña.",
      );
    }
  };

  const userInitial = (user?.given_name || "U")[0]?.toUpperCase() || "U";

  useEffect(() => {
    if (hasLoadedPreferences) {
      return;
    }

    void fetchPreferences();
  }, [fetchPreferences, hasLoadedPreferences]);

  useEffect(() => {
    if (hasLoadedMyAdditionalInformation) {
      return;
    }

    void fetchMyAdditionalInformation();
  }, [fetchMyAdditionalInformation, hasLoadedMyAdditionalInformation]);

  useEffect(() => {
    if (!myAdditionalInformation) {
      return;
    }

    resetAdditionalInfo({
      document_number: myAdditionalInformation.document_number || "",
      phone: myAdditionalInformation.phone || "",
      date_of_birth: myAdditionalInformation.date_of_birth
        ? String(myAdditionalInformation.date_of_birth).slice(0, 10)
        : "",
      sex: myAdditionalInformation.sex || "",
      address: myAdditionalInformation.address || "",
    });
  }, [myAdditionalInformation, resetAdditionalInfo]);

  const handleTogglePreference = (key) => async (event) => {
    if (isSavingPreferences || isLoadingPreferences) {
      return;
    }

    setLocalPreference(key, event.target.checked);
    await savePreferences();
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

  const renderAccountSection = () => (
    <DashboardSectionCard
      title="Cuenta"
      description="Identidad de acceso e información adicional institucional en un solo flujo."
    >
      <Grid
        container
        spacing={2}
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            variant="outlined"
            sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 1.6, height: "100%" }}
          >
            <Stack spacing={1.3}>
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="center"
              >
                <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
                  {userInitial}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ lineHeight: 1.1 }}
                    noWrap
                  >
                    {user?.given_name || "Usuario"} {user?.surname || ""}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                  >
                    {user?.email || "-"}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip
                  label={formatRoleLabel(user?.role, "-")}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={user?.status || "Activo"}
                  variant="outlined"
                />
                <Chip
                  label={
                    user?.has_additional_information
                      ? "Perfil completo"
                      : "Perfil parcial"
                  }
                  color={
                    user?.has_additional_information ? "success" : "warning"
                  }
                  variant="outlined"
                />
              </Stack>

              <Divider />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {roleHint}
              </Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            variant="outlined"
            sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 1.6, height: "100%" }}
          >
            <Stack spacing={1.3}>
              <Typography variant="subtitle2">Información adicional</Typography>

              {isLoadingMyAdditionalInformation ? (
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
                    Cargando información registrada...
                  </Typography>
                </Stack>
              ) : null}

              {myAdditionalInformationError ? (
                <Alert severity="error">{myAdditionalInformationError}</Alert>
              ) : null}

              {!isLoadingMyAdditionalInformation && !myAdditionalInformation ? (
                <Alert severity="info">
                  Aún no has registrado tu información adicional.
                </Alert>
              ) : null}

              {registerAdditionalInformationError ? (
                <Alert severity="error">
                  {registerAdditionalInformationError}
                </Alert>
              ) : null}

              {registerAdditionalInformationSuccessMessage ? (
                <Alert severity="success">
                  {registerAdditionalInformationSuccessMessage}
                </Alert>
              ) : null}

              <Box
                component="form"
                noValidate
                onSubmit={handleSubmitAdditionalInfo(
                  onSubmitAdditionalInformation,
                )}
              >
                <Grid
                  container
                  spacing={1.4}
                >
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required
                      label="Número de documento"
                      error={Boolean(additionalInfoErrors.document_number)}
                      helperText={additionalInfoErrors.document_number?.message}
                      {...registerAdditionalInfo("document_number")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required
                      label="Teléfono"
                      error={Boolean(additionalInfoErrors.phone)}
                      helperText={additionalInfoErrors.phone?.message}
                      {...registerAdditionalInfo("phone")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required
                      label="Fecha de nacimiento"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={Boolean(additionalInfoErrors.date_of_birth)}
                      helperText={additionalInfoErrors.date_of_birth?.message}
                      {...registerAdditionalInfo("date_of_birth")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required
                      select
                      label="Género"
                      error={Boolean(additionalInfoErrors.sex)}
                      helperText={additionalInfoErrors.sex?.message}
                      defaultValue=""
                      {...registerAdditionalInfo("sex")}
                    >
                      <MenuItem value="F">Femenino</MenuItem>
                      <MenuItem value="M">Masculino</MenuItem>
                      <MenuItem value="other">Otro</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Dirección"
                      error={Boolean(additionalInfoErrors.address)}
                      helperText={additionalInfoErrors.address?.message}
                      {...registerAdditionalInfo("address")}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={
                    !isAdditionalInfoValid ||
                    isSubmittingAdditionalInfo ||
                    isRegisteringAdditionalInformation
                  }
                  sx={{ mt: 1.6, minWidth: 230 }}
                >
                  {isRegisteringAdditionalInformation
                    ? "Guardando..."
                    : myAdditionalInformation
                      ? "Actualizar información"
                      : "Guardar información"}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </DashboardSectionCard>
  );

  const renderSecuritySection = () => (
    <DashboardSectionCard
      title="Seguridad de cuenta"
      description="Actualiza tu contraseña para mantener tu cuenta protegida."
    >
      {passwordError ? <Alert severity="error">{passwordError}</Alert> : null}
      {passwordSuccess ? (
        <Alert severity="success">{passwordSuccess}</Alert>
      ) : null}

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmitPassword)}
      >
        <Stack spacing={1.8}>
          <TextField
            required
            type="password"
            label="Contraseña actual"
            autoComplete="current-password"
            error={Boolean(errors.oldPassword)}
            helperText={errors.oldPassword?.message}
            {...register("oldPassword")}
          />

          <TextField
            required
            type="password"
            label="Nueva contraseña"
            autoComplete="new-password"
            error={Boolean(errors.newPassword)}
            helperText={errors.newPassword?.message}
            {...register("newPassword")}
          />

          <TextField
            required
            type="password"
            label="Confirmar nueva contraseña"
            autoComplete="new-password"
            error={Boolean(errors.confirmNewPassword)}
            helperText={errors.confirmNewPassword?.message}
            {...register("confirmNewPassword")}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!isValid || isSubmitting}
            sx={{ alignSelf: "flex-start", minWidth: 230 }}
          >
            {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </Stack>
      </Box>
    </DashboardSectionCard>
  );

  const onSubmitAdditionalInformation = async (values) => {
    clearAdditionalInformationStatus();

    const result = await registerAdditionalInformation({
      document_number: values.document_number,
      phone: values.phone,
      date_of_birth: values.date_of_birth,
      sex: values.sex,
      address: values.address,
    });

    if (!result?.ok) {
      return;
    }

    markAdditionalInformationCompleted();
    await fetchMyAdditionalInformation({ force: true });
  };

  const renderPreferencesSection = () => (
    <DashboardSectionCard
      title="Preferencias"
      description="Configura tu experiencia de uso y notificaciones de la cuenta."
    >
      {preferencesError ? (
        <Alert severity="error">{preferencesError}</Alert>
      ) : null}

      {preferencesSuccessMessage ? (
        <Alert severity="success">{preferencesSuccessMessage}</Alert>
      ) : null}

      {isLoadingPreferences ? (
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
            Cargando preferencias...
          </Typography>
        </Stack>
      ) : null}

      <Stack spacing={0.5}>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.email_notifications_enabled}
              disabled={isSavingPreferences || isLoadingPreferences}
              onChange={handleTogglePreference("email_notifications_enabled")}
            />
          }
          label="Recibir notificaciones generales por correo"
        />

        <FormControlLabel
          control={
            <Switch
              checked={preferences.security_events_notifications_enabled}
              disabled={isSavingPreferences || isLoadingPreferences}
              onChange={handleTogglePreference(
                "security_events_notifications_enabled",
              )}
            />
          }
          label="Notificar eventos de seguridad"
        />

        <FormControlLabel
          control={
            <Switch
              checked={preferences.compact_dashboard_mode_enabled}
              disabled={isSavingPreferences || isLoadingPreferences}
              onChange={handleTogglePreference(
                "compact_dashboard_mode_enabled",
              )}
            />
          }
          label="Usar modo compacto en dashboard"
        />

        <FormControlLabel
          control={
            <Switch
              checked={preferences.dark_mode_enabled}
              disabled={isSavingPreferences || isLoadingPreferences}
              onChange={handleTogglePreference("dark_mode_enabled")}
            />
          }
          label="Activar modo oscuro"
        />
      </Stack>

      {isSavingPreferences ? (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Guardando cambios de preferencias...
        </Typography>
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Los cambios se guardan automáticamente.
        </Typography>
      )}
    </DashboardSectionCard>
  );

  const renderSessionSection = () => (
    <DashboardSectionCard
      title="Sesión"
      description="Controla tu sesión activa en este dispositivo."
    >
      <Paper
        variant="outlined"
        sx={{ p: 1.6, borderRadius: 1.4 }}
      >
        <Stack spacing={1.1}>
          <Typography variant="subtitle2">
            Cerrar sesión de forma segura
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Esta acción cerrará tu sesión actual y te redirigirá al login.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutRoundedIcon />}
            sx={{ alignSelf: "flex-start", minWidth: 190 }}
            onClick={handleRequestLogout}
          >
            Cerrar sesión
          </Button>
        </Stack>
      </Paper>
    </DashboardSectionCard>
  );

  const renderSectionContent = () => {
    if (activeSection === "seguridad") {
      return renderSecuritySection();
    }

    if (activeSection === "preferencias") {
      return renderPreferencesSection();
    }

    if (activeSection === "sesion") {
      return renderSessionSection();
    }

    return renderAccountSection();
  };

  return (
    <Stack spacing={2.2}>
      <Typography
        variant="h4"
        sx={{ fontSize: { xs: "1.45rem", md: "1.95rem" } }}
      >
        Configuración de cuenta
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
      >
        Gestiona tu cuenta desde un panel modular: identidad, seguridad y
        experiencia de uso.
      </Typography>

      {isDesktop ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              sm: "280px minmax(0, 1fr)",
              lg: "300px minmax(0, 1fr)",
            },
            gap: 2.2,
            alignItems: "start",
            width: "100%",
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 1.6,
              p: 1.3,
              position: "sticky",
              top: 92,
              width: "100%",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ px: 1.2, py: 0.8, fontWeight: 600 }}
            >
              Menú de ajustes
            </Typography>
            <List sx={{ pt: 0.5 }}>
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = section.icon;

                return (
                  <ListItemButton
                    key={section.id}
                    selected={activeSection === section.id}
                    onClick={() => setActiveSection(section.id)}
                    sx={{ borderRadius: 1, mb: 0.6 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={section.label}
                      secondary={section.caption}
                      secondaryTypographyProps={{
                        sx: { fontSize: "0.72rem", lineHeight: 1.3 },
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>

          <Stack
            spacing={1.2}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                minHeight: { sm: 620, lg: 650 },
                display: "flex",
                width: "100%",
              }}
            >
              {renderSectionContent()}
            </Box>
          </Stack>
        </Box>
      ) : (
        <Stack spacing={1.6}>
          <Paper
            variant="outlined"
            sx={{ borderRadius: 1.6 }}
          >
            <Tabs
              value={activeSection}
              onChange={(_, value) => setActiveSection(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <Tab
                    key={section.id}
                    value={section.id}
                    icon={<Icon fontSize="small" />}
                    iconPosition="start"
                    label={section.label}
                  />
                );
              })}
            </Tabs>
          </Paper>
          {renderSectionContent()}
        </Stack>
      )}

      <LogoutConfirmDialog
        open={isLogoutDialogOpen}
        onClose={handleCloseLogoutDialog}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </Stack>
  );
}

export default DashboardProfilePage;
