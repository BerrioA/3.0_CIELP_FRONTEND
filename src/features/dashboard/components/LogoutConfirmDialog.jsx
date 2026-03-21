import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

function LogoutConfirmDialog({ open, onClose, onConfirm, isLoading = false }) {
  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Confirmar cierre de sesión</DialogTitle>
      <DialogContent dividers>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          ¿Deseas cerrar sesión ahora? Tendrás que volver a iniciar sesión para
          continuar.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? "Cerrando..." : "Cerrar sesión"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LogoutConfirmDialog;
