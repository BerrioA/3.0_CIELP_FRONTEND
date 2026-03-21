import { useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import {
  forgotPasswordDefaultValues,
  forgotPasswordSchema,
} from "../schemas/forgot-password.schema";
import { useAuthStore } from "../store/auth.store";

function ForgotPasswordCard() {
  const requestPasswordRecovery = useAuthStore(
    (state) => state.requestPasswordRecovery,
  );
  const resetPasswordRecoveryFlow = useAuthStore(
    (state) => state.resetPasswordRecoveryFlow,
  );
  const isRequestingPasswordRecovery = useAuthStore(
    (state) => state.isRequestingPasswordRecovery,
  );
  const passwordRecoveryError = useAuthStore(
    (state) => state.passwordRecoveryError,
  );
  const passwordRecoverySuccessMessage = useAuthStore(
    (state) => state.passwordRecoverySuccessMessage,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: forgotPasswordDefaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    resetPasswordRecoveryFlow();

    return () => {
      resetPasswordRecoveryFlow();
    };
  }, [resetPasswordRecoveryFlow]);

  const onSubmit = async (values) => {
    await requestPasswordRecovery(values.email);
  };

  return (
    <Paper
      component="section"
      sx={{ p: { xs: 3, sm: 4 } }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
          >
            Recuperar contraseña
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Ingrese su correo institucional y le enviaremos un enlace seguro
            para restablecerla.
          </Typography>
        </Box>

        {passwordRecoveryError ? (
          <Alert severity="error">{passwordRecoveryError}</Alert>
        ) : null}

        {passwordRecoverySuccessMessage ? (
          <Alert severity="success">{passwordRecoverySuccessMessage}</Alert>
        ) : null}

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <Stack spacing={2.2}>
            <TextField
              required
              label="Correo"
              type="email"
              placeholder="usuario@colegio.edu"
              autoComplete="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register("email")}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={
                !isValid || isSubmitting || isRequestingPasswordRecovery
              }
            >
              {isRequestingPasswordRecovery
                ? "Enviando..."
                : "Enviar enlace de recuperación"}
            </Button>
          </Stack>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
        >
          ¿Recordó su contraseña?{" "}
          <Link
            component={RouterLink}
            to="/login"
            underline="hover"
            color="secondary.dark"
          >
            Volver al inicio de sesión
          </Link>
        </Typography>
      </Stack>
    </Paper>
  );
}

export default ForgotPasswordCard;
