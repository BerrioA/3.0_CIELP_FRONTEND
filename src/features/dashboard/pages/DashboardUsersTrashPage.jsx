import { useEffect } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DashboardSectionCard from "../components/DashboardSectionCard";
import { useDashboardUsersStore } from "../store/dashboard-users.store";

function DashboardUsersTrashPage() {
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
  const restoreUserById = useDashboardUsersStore(
    (state) => state.restoreUserById,
  );
  const permanentDeleteUserById = useDashboardUsersStore(
    (state) => state.permanentDeleteUserById,
  );

  useEffect(() => {
    void fetchTrashUsers({ force: true });
  }, [fetchTrashUsers]);

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
        <Stack spacing={0.4}>
          <Typography
            variant="h4"
            sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" } }}
          >
            Papelera de usuarios
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Accede directamente a usuarios eliminados para restaurar o eliminar
            de forma permanente.
          </Typography>
        </Stack>

        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => void fetchTrashUsers({ force: true })}
          disabled={isLoadingTrashUsers}
        >
          Actualizar
        </Button>
      </Stack>

      <DashboardSectionCard
        title="Usuarios eliminados"
        description="Esta vista corresponde al endpoint de papelera y está disponible desde el sidebar."
      >
        {trashUsersError ? (
          <Alert severity="error">{trashUsersError}</Alert>
        ) : null}
        {userActionError ? (
          <Alert severity="error">{userActionError}</Alert>
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
              Cargando usuarios eliminados...
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
                        ? new Date(user.created_at).toLocaleDateString("es-CO")
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
    </Stack>
  );
}

export default DashboardUsersTrashPage;
