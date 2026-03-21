import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import DashboardSectionCard from "../components/DashboardSectionCard";
import { USER_ROLES } from "../config/roles";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  registerTeacherDefaultValues,
  registerTeacherSchema,
} from "../../auth/schemas/register-teacher.schema";
import { useDashboardTeachersStore } from "../store/dashboard-teachers.store";

const ROLE_TEACHERS_CONTENT = {
  [USER_ROLES.SUPER_ADMIN]: {
    heading: "Gestión de docentes",
    description:
      "Administra el ciclo de vida de docentes: registro, listado y consulta detallada.",
  },
  [USER_ROLES.ADMIN]: {
    heading: "Docentes institucionales",
    description:
      "Consulta el listado y perfil de docentes registrados en la plataforma.",
  },
  [USER_ROLES.PSYCHOLOGIST]: {
    heading: "Docentes en seguimiento",
    description:
      "Consulta información de docentes para contexto clínico y acompañamiento.",
  },
};

const formatDateLabel = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("es-CO", {
    dateStyle: "medium",
  });
};

function DashboardTeachersPage() {
  const userRole = useAuthStore((state) => state.user?.role);
  const canManageTeacherLifecycle =
    userRole === USER_ROLES.SUPER_ADMIN || userRole === USER_ROLES.ADMIN;

  const teachers = useDashboardTeachersStore((state) => state.teachers);
  const isLoadingTeachers = useDashboardTeachersStore(
    (state) => state.isLoadingTeachers,
  );
  const teachersError = useDashboardTeachersStore(
    (state) => state.teachersError,
  );
  const hasLoadedTeachers = useDashboardTeachersStore(
    (state) => state.hasLoadedTeachers,
  );
  const fetchTeachers = useDashboardTeachersStore(
    (state) => state.fetchTeachers,
  );

  const selectedTeacherId = useDashboardTeachersStore(
    (state) => state.selectedTeacherId,
  );
  const selectedTeacherProfile = useDashboardTeachersStore(
    (state) => state.selectedTeacherProfile,
  );
  const isLoadingSelectedTeacherProfile = useDashboardTeachersStore(
    (state) => state.isLoadingSelectedTeacherProfile,
  );
  const selectedTeacherProfileError = useDashboardTeachersStore(
    (state) => state.selectedTeacherProfileError,
  );
  const setSelectedTeacherId = useDashboardTeachersStore(
    (state) => state.setSelectedTeacherId,
  );
  const fetchTeacherById = useDashboardTeachersStore(
    (state) => state.fetchTeacherById,
  );

  const isRegisteringTeacher = useDashboardTeachersStore(
    (state) => state.isRegisteringTeacher,
  );
  const registerTeacherError = useDashboardTeachersStore(
    (state) => state.registerTeacherError,
  );
  const registerTeacherSuccessMessage = useDashboardTeachersStore(
    (state) => state.registerTeacherSuccessMessage,
  );
  const registerTeacherFromDashboard = useDashboardTeachersStore(
    (state) => state.registerTeacherFromDashboard,
  );
  const clearRegisterTeacherStatus = useDashboardTeachersStore(
    (state) => state.clearRegisterTeacherStatus,
  );
  const isDeletingTeacher = useDashboardTeachersStore(
    (state) => state.isDeletingTeacher,
  );
  const deleteTeacherError = useDashboardTeachersStore(
    (state) => state.deleteTeacherError,
  );
  const deleteTeacherSuccessMessage = useDashboardTeachersStore(
    (state) => state.deleteTeacherSuccessMessage,
  );
  const softDeleteTeacherById = useDashboardTeachersStore(
    (state) => state.softDeleteTeacherById,
  );

  const [activeTab, setActiveTab] = useState("list");
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerTeacherSchema),
    defaultValues: registerTeacherDefaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (hasLoadedTeachers) {
      return;
    }

    void fetchTeachers();
  }, [fetchTeachers, hasLoadedTeachers]);

  const content =
    ROLE_TEACHERS_CONTENT[userRole] || ROLE_TEACHERS_CONTENT[USER_ROLES.ADMIN];

  const selectedTeacherLabel = useMemo(() => {
    const selectedTeacher = teachers.find(
      (teacher) => teacher.id === selectedTeacherId,
    );

    if (!selectedTeacher) {
      return "";
    }

    return `${selectedTeacher.given_name || ""} ${selectedTeacher.surname || ""}`.trim();
  }, [selectedTeacherId, teachers]);

  const onSubmit = async (values) => {
    clearRegisterTeacherStatus();

    const payload = {
      given_name: values.given_name,
      surname: values.surname,
      email: values.email,
      password: values.password,
      data_privacy_consent: values.data_privacy_consent,
    };

    const result = await registerTeacherFromDashboard(payload);

    if (!result.ok) {
      return;
    }

    reset(registerTeacherDefaultValues);
  };

  const handleOpenDetail = async (teacherId) => {
    setSelectedTeacherId(teacherId);
    setIsDetailDialogOpen(true);
    await fetchTeacherById(teacherId);
  };

  const handleCloseDetail = () => {
    setIsDetailDialogOpen(false);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete?.id) {
      return;
    }

    const result = await softDeleteTeacherById(teacherToDelete.id);
    if (result?.ok) {
      setTeacherToDelete(null);
      if (selectedTeacherId === teacherToDelete.id) {
        setIsDetailDialogOpen(false);
      }
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.2}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
      >
        <Box>
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
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => void fetchTeachers({ force: true })}
          disabled={isLoadingTeachers}
        >
          Actualizar
        </Button>
      </Stack>

      <Chip label={`Docentes registrados: ${teachers.length}`} />

      <Stack
        direction="row"
        spacing={1}
      >
        <Button
          variant={activeTab === "list" ? "contained" : "outlined"}
          onClick={() => setActiveTab("list")}
        >
          Listado y detalle
        </Button>
        <Button
          variant={activeTab === "register" ? "contained" : "outlined"}
          onClick={() => setActiveTab("register")}
        >
          Registrar docente
        </Button>
      </Stack>

      {activeTab === "list" ? (
        <DashboardSectionCard
          title="Listado de docentes"
          description="Consulta docentes activos y abre su ficha individual usando el endpoint de detalle."
        >
          {teachersError ? (
            <Alert severity="error">{teachersError}</Alert>
          ) : null}
          {selectedTeacherProfileError ? (
            <Alert severity="error">{selectedTeacherProfileError}</Alert>
          ) : null}
          {deleteTeacherError ? (
            <Alert severity="error">{deleteTeacherError}</Alert>
          ) : null}
          {deleteTeacherSuccessMessage ? (
            <Alert severity="success">{deleteTeacherSuccessMessage}</Alert>
          ) : null}

          {isLoadingTeachers ? (
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
                Cargando docentes...
              </Typography>
            </Stack>
          ) : null}

          {!isLoadingTeachers && teachers.length === 0 ? (
            <Alert severity="info">No hay docentes para mostrar.</Alert>
          ) : null}

          {teachers.length > 0 ? (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 1.25 }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Registro</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow
                      key={teacher.id}
                      hover
                    >
                      <TableCell>
                        {teacher.given_name || ""} {teacher.surname || ""}
                      </TableCell>
                      <TableCell>{teacher.email || "-"}</TableCell>
                      <TableCell>{teacher.phone || "-"}</TableCell>
                      <TableCell>
                        {formatDateLabel(teacher.created_at)}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.6}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            startIcon={<VisibilityRoundedIcon />}
                            onClick={() => void handleOpenDetail(teacher.id)}
                            disabled={isLoadingSelectedTeacherProfile}
                          >
                            Ver detalle
                          </Button>

                          {canManageTeacherLifecycle ? (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteOutlineRoundedIcon />}
                              onClick={() => setTeacherToDelete(teacher)}
                              disabled={isDeletingTeacher}
                            >
                              Eliminar
                            </Button>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </DashboardSectionCard>
      ) : (
        <DashboardSectionCard
          title="Registrar nuevo docente"
          description="Alta de docentes usando el endpoint de registro y envío de verificación por correo."
        >
          {registerTeacherError ? (
            <Alert severity="error">{registerTeacherError}</Alert>
          ) : null}

          {registerTeacherSuccessMessage ? (
            <Alert severity="success">{registerTeacherSuccessMessage}</Alert>
          ) : null}

          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <Stack spacing={1.8}>
              <TextField
                required
                label="Nombre"
                error={Boolean(errors.given_name)}
                helperText={errors.given_name?.message}
                {...register("given_name")}
              />

              <TextField
                required
                label="Apellido"
                error={Boolean(errors.surname)}
                helperText={errors.surname?.message}
                {...register("surname")}
              />

              <TextField
                required
                label="Correo"
                type="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register("email")}
              />

              <TextField
                required
                label="Contraseña"
                type="password"
                autoComplete="new-password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                {...register("password")}
              />

              <TextField
                required
                label="Confirmar contraseña"
                type="password"
                autoComplete="new-password"
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Controller
                name="data_privacy_consent"
                control={control}
                render={({ field }) => (
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(event) =>
                            field.onChange(event.target.checked)
                          }
                          inputRef={field.ref}
                        />
                      }
                      label="Aceptar tratamiento de datos personales"
                    />
                    {errors.data_privacy_consent ? (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ pl: 1 }}
                      >
                        {errors.data_privacy_consent.message}
                      </Typography>
                    ) : null}
                  </Box>
                )}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!isValid || isSubmitting || isRegisteringTeacher}
                sx={{ alignSelf: "flex-start", minWidth: 240 }}
              >
                {isRegisteringTeacher ? "Registrando..." : "Registrar docente"}
              </Button>
            </Stack>
          </Box>
        </DashboardSectionCard>
      )}

      <Dialog
        open={isDetailDialogOpen}
        onClose={handleCloseDetail}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pr: 6 }}>
          Perfil del docente
          <IconButton
            aria-label="Cerrar"
            onClick={handleCloseDetail}
            sx={{ position: "absolute", right: 10, top: 10 }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 650 }}
            >
              {selectedTeacherLabel || "Docente"}
            </Typography>

            {isLoadingSelectedTeacherProfile ? (
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
                  Cargando detalle del docente...
                </Typography>
              </Stack>
            ) : null}

            {selectedTeacherProfile ? (
              <>
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
                </Stack>

                <Divider />

                <Grid
                  container
                  spacing={1.2}
                >
                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.4, borderRadius: 1.25 }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Fecha de nacimiento
                      </Typography>
                      <Typography variant="body1">
                        {formatDateLabel(selectedTeacherProfile.date_of_birth)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.4, borderRadius: 1.25 }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Fecha de registro
                      </Typography>
                      <Typography variant="body1">
                        {formatDateLabel(selectedTeacherProfile.created_at)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                  >
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.4, borderRadius: 1.25 }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Dirección
                      </Typography>
                      <Typography variant="body1">
                        {selectedTeacherProfile.address ||
                          "Sin dirección registrada"}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          {canManageTeacherLifecycle && selectedTeacherId ? (
            <Button
              color="error"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={() =>
                setTeacherToDelete(
                  teachers.find(
                    (teacher) => teacher.id === selectedTeacherId,
                  ) || null,
                )
              }
              disabled={isDeletingTeacher}
            >
              Eliminar docente
            </Button>
          ) : null}
          <Button onClick={handleCloseDetail}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(teacherToDelete)}
        onClose={() => setTeacherToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Esta acción enviará a papelera al docente{" "}
            <strong>
              {teacherToDelete
                ? `${teacherToDelete.given_name || ""} ${teacherToDelete.surname || ""}`.trim()
                : "seleccionado"}
            </strong>
            .
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setTeacherToDelete(null)}
            disabled={isDeletingTeacher}
          >
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDeleteTeacher()}
            disabled={isDeletingTeacher}
          >
            {isDeletingTeacher ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default DashboardTeachersPage;
