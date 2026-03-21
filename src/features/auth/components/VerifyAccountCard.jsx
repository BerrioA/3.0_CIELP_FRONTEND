import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  resendVerificationDefaultValues,
  resendVerificationSchema,
} from "../schemas/resend-verification.schema";
import { useAuthStore } from "../store/auth.store";
import { decodeVerificationPayload } from "../utils/verificationPayload";

function VerifyAccountCard() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const verifyAccount = useAuthStore((state) => state.verifyAccount);
  const resetVerificationFlow = useAuthStore(
    (state) => state.resetVerificationFlow,
  );
  const resendVerification = useAuthStore((state) => state.resendVerification);

  const isVerifyingAccount = useAuthStore((state) => state.isVerifyingAccount);
  const verifyAccountStatus = useAuthStore(
    (state) => state.verifyAccountStatus,
  );
  const verifyAccountMessage = useAuthStore(
    (state) => state.verifyAccountMessage,
  );

  const isResendingVerification = useAuthStore(
    (state) => state.isResendingVerification,
  );
  const resendVerificationError = useAuthStore(
    (state) => state.resendVerificationError,
  );
  const resendVerificationSuccessMessage = useAuthStore(
    (state) => state.resendVerificationSuccessMessage,
  );

  const [localResendError, setLocalResendError] = useState("");

  const decodedPayload = useMemo(() => decodeVerificationPayload(code), [code]);
  const emailFromQuery = (searchParams.get("email") || "").trim();
  const initialEmail = decodedPayload?.email || emailFromQuery;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: resendVerificationDefaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    resetVerificationFlow();

    if (!code) {
      return;
    }

    void verifyAccount(code);

    return () => {
      resetVerificationFlow();
    };
  }, [code, verifyAccount, resetVerificationFlow]);

  useEffect(() => {
    if (initialEmail) {
      setValue("email", initialEmail, { shouldValidate: true });
    }
  }, [initialEmail, setValue]);

  useEffect(() => {
    if (verifyAccountStatus !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [navigate, verifyAccountStatus]);

  const onSubmitResend = async (values) => {
    setLocalResendError("");
    const result = await resendVerification(values.email);

    if (!result.ok) {
      setLocalResendError(
        result.message || "No fue posible reenviar el código.",
      );
    }
  };

  const shouldShowResendForm = verifyAccountStatus === "error" || !code;
  const visibleResendError = localResendError || resendVerificationError;

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
            Verificación de cuenta
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Estamos validando su código de seguridad para activar su cuenta.
          </Typography>
        </Box>

        {isVerifyingAccount ? (
          <Stack
            direction="row"
            spacing={1.4}
            alignItems="center"
          >
            <CircularProgress size={22} />
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Verificando código...
            </Typography>
          </Stack>
        ) : null}

        {verifyAccountStatus === "success" ? (
          <Stack spacing={1.2}>
            <Alert severity="success">
              {verifyAccountMessage ||
                "Su cuenta ha sido verificada con éxito."}
            </Alert>
            <Alert severity="info">
              Redirigiendo al inicio de sesión en unos segundos...
            </Alert>
          </Stack>
        ) : null}

        {verifyAccountStatus === "error" ? (
          <Alert severity="error">
            {verifyAccountMessage || "No fue posible verificar la cuenta."}
          </Alert>
        ) : null}

        {!code ? (
          <Alert severity="info">
            Abra el enlace completo que llegó a su correo o solicite un nuevo
            código.
          </Alert>
        ) : null}

        {shouldShowResendForm ? (
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit(onSubmitResend)}
          >
            <Stack spacing={2.2}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Si el enlace expiró, solicite un nuevo correo de verificación.
              </Typography>

              {visibleResendError ? (
                <Alert severity="error">{visibleResendError}</Alert>
              ) : null}

              {resendVerificationSuccessMessage ? (
                <Alert severity="success">
                  {resendVerificationSuccessMessage}
                </Alert>
              ) : null}

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
                disabled={!isValid || isSubmitting || isResendingVerification}
              >
                {isResendingVerification
                  ? "Reenviando..."
                  : "Reenviar código de verificación"}
              </Button>
            </Stack>
          </Box>
        ) : null}

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

export default VerifyAccountCard;
