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
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import DashboardSectionCard from "../components/DashboardSectionCard";
import { USER_ROLES } from "../config/roles";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  registerInstitutionalUserDefaultValues,
  registerInstitutionalUserSchema,
} from "../schemas/register-institutional-user.schema";
import { useDashboardUsersStore } from "../store/dashboard-users.store";
import {
  formatRoleLabel,
  formatRoleLabelPlural,
} from "../../../shared/lib/roleFormatter";

const ROLE_CHIP_COLOR = {
  psychologist: "secondary",
  admin: "primary",
  developer: "info",
};

function DashboardUsersManagementPage() {
  const userRole = useAuthStore((state) => state.user?.role);
  const isSuperAdmin = userRole === USER_ROLES.SUPER_ADMIN;

  const users = useDashboardUsersStore((state) => state.users);
  const isLoadingUsers = useDashboardUsersStore(
    (state) => state.isLoadingUsers,
  );
  const usersError = useDashboardUsersStore((state) => state.usersError);
  const hasLoadedUsers = useDashboardUsersStore(
    (state) => state.hasLoadedUsers,
  );
  const fetchUsers = useDashboardUsersStore((state) => state.fetchUsers);

  const trashUsers = useDashboardUsersStore((state) => state.trashUsers);
  const isLoadingTrashUsers = useDashboardUsersStore(
    (state) => state.isLoadingTrashUsers,
  );
  const trashUsersError = useDashboardUsersStore(
    (state) => state.trashUsersError,
  );
  const fetchTrashUsers = useDashboardUsersStore(
    (state) => state.fetchTrashUsers,
  );

  const registerInstitutionalUser = useDashboardUsersStore(
    (state) => state.registerInstitutionalUser,
  );
  const isRegisteringUser = useDashboardUsersStore(
    (state) => state.isRegisteringUser,
  );
  const registerUserError = useDashboardUsersStore(
    (state) => state.registerUserError,
  );
  const registerUserSuccessMessage = useDashboardUsersStore(
    (state) => state.registerUserSuccessMessage,
  );
  const clearRegisterStatus = useDashboardUsersStore(
    (state) => state.clearRegisterStatus,
  );

  const isProcessingUserAction = useDashboardUsersStore(
    (state) => state.isProcessingUserAction,
  );
  const userActionError = useDashboardUsersStore(
    (state) => state.userActionError,
  );
  const userActionSuccessMessage = useDashboardUsersStore(
    (state) => state.userActionSuccessMessage,
  );
  const clearUserActionStatus = useDashboardUsersStore(
    (state) => state.clearUserActionStatus,
  );
  const updateUserById = useDashboardUsersStore(
    (state) => state.updateUserById,
  );
  const softDeleteUserById = useDashboardUsersStore(
    (state) => state.softDeleteUserById,
  );
  const restoreUserById = useDashboardUsersStore(
    (state) => state.restoreUserById,
  );
  const permanentDeleteUserById = useDashboardUsersStore(
    (state) => state.permanentDeleteUserById,
  );

  const [activeTab, setActiveTab] = useState("list");
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [editGivenName, setEditGivenName] = useState("");
  const [editSurname, setEditSurname] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteConfirmationPassword, setDeleteConfirmationPassword] =
    useState("");

  const adminRoleLabel = formatRoleLabel(USER_ROLES.ADMIN);
  const superAdminRoleLabel = formatRoleLabel(USER_ROLES.SUPER_ADMIN);
  const psychologistRoleLabel = formatRoleLabel(USER_ROLES.PSYCHOLOGIST);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerInstitutionalUserSchema),
    defaultValues: {
      ...registerInstitutionalUserDefaultValues,
      roleTarget: "psychologist",
    },
    mode: "onChange",
  });

  const selectedRoleTarget = useWatch({
    control,
    name: "roleTarget",
  });

  useEffect(() => {
    if (hasLoadedUsers) {
      return;
    }

    void fetchUsers();
  }, [fetchUsers, hasLoadedUsers]);

  useEffect(() => {
    if (activeTab !== "trash") {
      return;
    }

    void fetchTrashUsers({ force: true });
  }, [activeTab, fetchTrashUsers]);

  const usersByRoleCount = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        const role = user?.role;
        if (role && acc[role] !== undefined) {
          acc[role] += 1;
        }
        return acc;
      },
      {
        psychologist: 0,
        admin: 0,
        developer: 0,
      },
    );
  }, [users]);

  const onSubmit = async (values) => {
    clearRegisterStatus();

    if (!isSuperAdmin && values.roleTarget === "admin") {
      return;
    }

    const payload = {
      given_name: values.given_name,
      surname: values.surname,
      email: values.email,
      password: values.password,
      data_privacy_consent: values.data_privacy_consent,
    };

    const result = await registerInstitutionalUser({
      roleTarget: values.roleTarget,
      userData: payload,
    });

    if (!result.ok) {
      return;
    }

    reset({
      ...registerInstitutionalUserDefaultValues,
      roleTarget: isSuperAdmin ? values.roleTarget : "psychologist",
    });
  };

  const startEditUser = (user) => {
    clearUserActionStatus();
    setSelectedUserForAction(user);
    setEditGivenName(user?.given_name || "");
    setEditSurname(user?.surname || "");
    setEditEmail(user?.email || "");
  };

  const handleSubmitEdit = async () => {
    if (!selectedUserForAction?.id) {
      return;
    }

    await updateUserById({
      userId: selectedUserForAction.id,
      dataUserUpdate: {
        given_name: editGivenName,
        surname: editSurname,
        email: editEmail,
      },
    });
  };

  const openDeleteConfirmation = (user) => {
    clearUserActionStatus();
    setUserToDelete(user || null);
    setDeleteConfirmationPassword("");
  };

  const closeDeleteConfirmation = () => {
    setUserToDelete(null);
    setDeleteConfirmationPassword("");
  };

  const isSensitiveDeleteTarget =
    userToDelete?.role === USER_ROLES.ADMIN ||
    userToDelete?.role === USER_ROLES.PSYCHOLOGIST;

  const handleSoftDelete = async () => {
    if (!userToDelete?.id) {
      return;
    }

    clearUserActionStatus();
    const result = await softDeleteUserById({
      userId: userToDelete.id,
      currentPassword: deleteConfirmationPassword,
    });

    if (result?.ok) {
      closeDeleteConfirmation();
    }
  };

  const handleRestore = async (userId) => {
    clearUserActionStatus();
    await restoreUserById(userId);
  };

  const handlePermanentDelete = async (userId) => {
    clearUserActionStatus();
    await permanentDeleteUserById(userId);
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
            Gestión de usuarios institucionales
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Administra psicólogos, administradores y desarrolladores según tus
            permisos.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => {
            void fetchUsers({ force: true });
            if (activeTab === "trash") {
              void fetchTrashUsers({ force: true });
            }
          }}
          disabled={isLoadingUsers || isLoadingTrashUsers}
        >
          Actualizar
        </Button>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
      >
        <Chip
          label={`${formatRoleLabelPlural(USER_ROLES.PSYCHOLOGIST)}: ${usersByRoleCount.psychologist}`}
        />
        <Chip
          label={`${formatRoleLabelPlural(USER_ROLES.ADMIN)}: ${usersByRoleCount.admin}`}
        />
        <Chip
          label={`${formatRoleLabelPlural(USER_ROLES.DEVELOPER)}: ${usersByRoleCount.developer}`}
        />
        <Chip label={`En papelera: ${trashUsers.length}`} />
      </Stack>

      <Stack
        direction="row"
        spacing={1}
      >
        <Button
          variant={activeTab === "list" ? "contained" : "outlined"}
          onClick={() => setActiveTab("list")}
        >
          Listado
        </Button>
        <Button
          variant={activeTab === "register" ? "contained" : "outlined"}
          onClick={() => setActiveTab("register")}
        >
          Registrar
        </Button>
        <Button
          variant={activeTab === "trash" ? "contained" : "outlined"}
          onClick={() => setActiveTab("trash")}
        >
          Papelera
        </Button>
      </Stack>

      {activeTab === "list" ? (
        <DashboardSectionCard
          title="Usuarios registrados"
          description="Listado centralizado con acciones de edición y envío a papelera."
        >
          {usersError ? <Alert severity="error">{usersError}</Alert> : null}
          {userActionSuccessMessage ? (
            <Alert severity="success">{userActionSuccessMessage}</Alert>
          ) : null}

          {isLoadingUsers ? (
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
                Cargando usuarios...
              </Typography>
            </Stack>
          ) : null}

          {!isLoadingUsers && users.length === 0 ? (
            <Alert severity="info">
              {trashUsers.length > 0
                ? `No hay usuarios activos para mostrar. Actualmente hay ${trashUsers.length} usuario(s) en papelera.`
                : "No hay usuarios activos para mostrar."}
            </Alert>
          ) : null}

          {users.length > 0 ? (
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
                    <TableCell>Rol</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Fecha registro</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      hover
                    >
                      <TableCell>
                        {user.given_name || ""} {user.surname || ""}
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={formatRoleLabel(user.role, "-")}
                          color={ROLE_CHIP_COLOR[user.role] || "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString(
                              "es-CO",
                            )
                          : "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.8}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => startEditUser(user)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            color="warning"
                            variant="outlined"
                            disabled={isProcessingUserAction}
                            onClick={() => openDeleteConfirmation(user)}
                          >
                            Papelera
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}

          {selectedUserForAction ? (
            <Paper
              variant="outlined"
              sx={{ p: 1.6, borderRadius: 1.25 }}
            >
              <Stack spacing={1.2}>
                <Typography variant="subtitle2">
                  Usuario seleccionado: {selectedUserForAction.given_name || ""}{" "}
                  {selectedUserForAction.surname || ""}
                </Typography>

                <TextField
                  label="Nombre"
                  value={editGivenName}
                  onChange={(event) => setEditGivenName(event.target.value)}
                />
                <TextField
                  label="Apellido"
                  value={editSurname}
                  onChange={(event) => setEditSurname(event.target.value)}
                />
                <TextField
                  label="Correo"
                  type="email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={() => void handleSubmitEdit()}
                  disabled={isProcessingUserAction}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {isProcessingUserAction ? "Guardando..." : "Guardar cambios"}
                </Button>
              </Stack>
            </Paper>
          ) : null}
        </DashboardSectionCard>
      ) : null}

      {activeTab === "register" ? (
        <DashboardSectionCard
          title="Registrar usuario"
          description="Registro de nuevos psicólogos y administradores según permisos del rol autenticado."
        >
          {!isSuperAdmin ? (
            <Alert severity="info">
              Como {adminRoleLabel} puedes registrar{" "}
              {psychologistRoleLabel.toLowerCase()}s. El registro de{" "}
              {formatRoleLabelPlural(USER_ROLES.ADMIN).toLowerCase()} esta
              habilitado solo para {superAdminRoleLabel}.
            </Alert>
          ) : null}

          {registerUserError ? (
            <Alert severity="error">{registerUserError}</Alert>
          ) : null}
          {registerUserSuccessMessage ? (
            <Alert severity="success">{registerUserSuccessMessage}</Alert>
          ) : null}

          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <Stack spacing={1.8}>
              <Controller
                name="roleTarget"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="role-target-label">
                      Rol a registrar
                    </InputLabel>
                    <Select
                      labelId="role-target-label"
                      label="Rol a registrar"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <MenuItem value="psychologist">
                        {psychologistRoleLabel}
                      </MenuItem>
                      {isSuperAdmin ? (
                        <MenuItem value="admin">{adminRoleLabel}</MenuItem>
                      ) : null}
                    </Select>
                  </FormControl>
                )}
              />

              {!isSuperAdmin && selectedRoleTarget === "admin" ? (
                <Alert severity="warning">
                  Tu rol actual no puede registrar{" "}
                  {formatRoleLabelPlural(USER_ROLES.ADMIN).toLowerCase()}.
                </Alert>
              ) : null}

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
                disabled={
                  !isValid ||
                  isSubmitting ||
                  isRegisteringUser ||
                  (!isSuperAdmin && selectedRoleTarget === "admin")
                }
                sx={{ alignSelf: "flex-start", minWidth: 240 }}
              >
                {isRegisteringUser ? "Registrando..." : "Registrar usuario"}
              </Button>
            </Stack>
          </Box>
        </DashboardSectionCard>
      ) : null}

      {activeTab === "trash" ? (
        <DashboardSectionCard
          title="Papelera de usuarios"
          description="Gestiona usuarios eliminados: restaurar o eliminar de forma permanente."
        >
          {trashUsersError ? (
            <Alert severity="error">{trashUsersError}</Alert>
          ) : null}
          {userActionSuccessMessage ? (
            <Alert severity="success">{userActionSuccessMessage}</Alert>
          ) : null}

          {isLoadingTrashUsers ? (
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
                Cargando papelera...
              </Typography>
            </Stack>
          ) : null}

          {!isLoadingTrashUsers && trashUsers.length === 0 ? (
            <Alert severity="info">No hay usuarios en papelera.</Alert>
          ) : null}

          {trashUsers.length > 0 ? (
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
                    <TableCell>Fecha registro</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trashUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      hover
                    >
                      <TableCell>
                        {user.given_name || ""} {user.surname || ""}
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString(
                              "es-CO",
                            )
                          : "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.8}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            disabled={isProcessingUserAction}
                            onClick={() => void handleRestore(user.id)}
                          >
                            Restaurar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={isProcessingUserAction}
                            onClick={() => void handlePermanentDelete(user.id)}
                          >
                            Eliminar permanente
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </DashboardSectionCard>
      ) : null}

      <Dialog
        open={Boolean(userToDelete)}
        onClose={closeDeleteConfirmation}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2}>
            <Typography variant="body2">
              Esta acción enviará a papelera al usuario{" "}
              <strong>
                {userToDelete
                  ? `${userToDelete.given_name || ""} ${userToDelete.surname || ""}`.trim()
                  : "seleccionado"}
              </strong>
              .
            </Typography>

            {isSensitiveDeleteTarget ? (
              <>
                <Alert severity="warning">
                  Por seguridad, para eliminar administradores o psicólogos
                  debes confirmar tu contraseña.
                </Alert>
                <TextField
                  label="Tu contraseña"
                  type="password"
                  value={deleteConfirmationPassword}
                  onChange={(event) => {
                    if (userActionError) {
                      clearUserActionStatus();
                    }
                    setDeleteConfirmationPassword(event.target.value);
                  }}
                  autoComplete="current-password"
                  fullWidth
                />
              </>
            ) : null}

            {userActionError ? (
              <Alert severity="error">{userActionError}</Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeDeleteConfirmation}
            disabled={isProcessingUserAction}
          >
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleSoftDelete()}
            disabled={
              isProcessingUserAction ||
              (isSensitiveDeleteTarget && !deleteConfirmationPassword)
            }
          >
            {isProcessingUserAction ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default DashboardUsersManagementPage;
