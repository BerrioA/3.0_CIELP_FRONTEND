import { useEffect, useState } from "react";
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
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import PasswordVisibilityAdornment from "./PasswordVisibilityAdornment";
import {
  resetPasswordDefaultValues,
  resetPasswordSchema,
} from "../schemas/reset-password.schema";
import { useAuthStore } from "../store/auth.store";

function ResetPasswordCard() {
  const { verificationCode } = useParams();
  const navigate = useNavigate();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetPasswordWithCode = useAuthStore(
    (state) => state.resetPasswordWithCode,
  );
  const resetPasswordRecoveryFlow = useAuthStore(
    (state) => state.resetPasswordRecoveryFlow,
  );
  const isResettingPassword = useAuthStore(
    (state) => state.isResettingPassword,
  );
  const resetPasswordStatus = useAuthStore(
    (state) => state.resetPasswordStatus,
  );
  const resetPasswordError = useAuthStore((state) => state.resetPasswordError);
  const resetPasswordSuccessMessage = useAuthStore(
    (state) => state.resetPasswordSuccessMessage,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: resetPasswordDefaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    resetPasswordRecoveryFlow();

    return () => {
      resetPasswordRecoveryFlow();
    };
  }, [resetPasswordRecoveryFlow]);

  useEffect(() => {
    if (resetPasswordStatus !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [navigate, resetPasswordStatus]);

  const onSubmit = async (values) => {
    if (!verificationCode) {
      return;
    }

    await resetPasswordWithCode({
      verificationCode,
      newPassword: values.newPassword,
    });
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
            Restablecer contraseña
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Defina una nueva contraseña segura para su cuenta institucional.
          </Typography>
        </Box>

        {!verificationCode ? (
          <Alert severity="warning">
            El enlace de recuperación es inválido o incompleto. Solicite uno
            nuevo desde la opción de recuperar contraseña.
          </Alert>
        ) : null}

        {resetPasswordError ? (
          <Alert severity="error">{resetPasswordError}</Alert>
        ) : null}

        {resetPasswordSuccessMessage ? (
          <Alert severity="success">{resetPasswordSuccessMessage}</Alert>
        ) : null}

        {resetPasswordStatus === "success" ? (
          <Alert severity="info">Redirigiendo al inicio de sesión...</Alert>
        ) : null}

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <Stack spacing={2.2}>
            <TextField
              required
              label="Nueva contraseña"
              type={showNewPassword ? "text" : "password"}
              autoComplete="new-password"
              error={Boolean(errors.newPassword)}
              helperText={errors.newPassword?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <PasswordVisibilityAdornment
                      visible={showNewPassword}
                      onToggle={() => setShowNewPassword((prev) => !prev)}
                    />
                  ),
                },
              }}
              {...register("newPassword")}
            />

            <TextField
              required
              label="Confirmar nueva contraseña"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <PasswordVisibilityAdornment
                      visible={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword((prev) => !prev)}
                    />
                  ),
                },
              }}
              {...register("confirmPassword")}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={
                !verificationCode ||
                !isValid ||
                isSubmitting ||
                isResettingPassword ||
                resetPasswordStatus === "success"
              }
            >
              {isResettingPassword
                ? "Restableciendo..."
                : "Restablecer contraseña"}
            </Button>
          </Stack>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
        >
          Volver al acceso principal.{" "}
          <Link
            component={RouterLink}
            to="/login"
            underline="hover"
            color="secondary.dark"
          >
            Ir a login
          </Link>
        </Typography>
      </Stack>
    </Paper>
  );
}

export default ResetPasswordCard;
