import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import PasswordVisibilityAdornment from "./PasswordVisibilityAdornment";
import {
  registerTeacherDefaultValues,
  registerTeacherSchema,
} from "../schemas/register-teacher.schema";
import { useAuthStore } from "../store/auth.store";

function RegisterTeacherForm() {
  const navigate = useNavigate();
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectEmail, setRedirectEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerTeacher = useAuthStore((state) => state.registerTeacher);
  const isRegisteringTeacher = useAuthStore(
    (state) => state.isRegisteringTeacher,
  );
  const registerTeacherError = useAuthStore(
    (state) => state.registerTeacherError,
  );

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
    if (!redirectEmail) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate(`/verify-account?email=${encodeURIComponent(redirectEmail)}`);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [navigate, redirectEmail]);

  const onSubmit = async (formValues) => {
    setLocalError("");
    setSuccessMessage("");

    const payload = {
      given_name: formValues.given_name,
      surname: formValues.surname,
      email: formValues.email,
      password: formValues.password,
      data_privacy_consent: formValues.data_privacy_consent,
    };

    const result = await registerTeacher(payload);

    if (!result.ok) {
      setLocalError(result.message || "No fue posible registrar el usuario.");
      return;
    }

    setSuccessMessage(
      result.message ||
        "Registro completado. Revise su correo para verificar la cuenta.",
    );
    reset(registerTeacherDefaultValues);
    setRedirectEmail(payload.email);
  };

  const visibleError = localError || registerTeacherError;

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
            Registro docente
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Cree su cuenta institucional para acceder a CIELP.
          </Typography>
        </Box>

        {visibleError ? <Alert severity="error">{visibleError}</Alert> : null}
        {successMessage ? (
          <Alert severity="success">
            {successMessage} Redirigiendo a verificación...
          </Alert>
        ) : null}

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <Stack spacing={2.2}>
            <TextField
              required
              label="Nombre"
              type="text"
              placeholder="Ingrese su nombre"
              autoComplete="given-name"
              error={Boolean(errors.given_name)}
              helperText={errors.given_name?.message}
              {...register("given_name")}
            />

            <TextField
              required
              label="Apellido"
              type="text"
              placeholder="Ingrese su apellido"
              autoComplete="family-name"
              error={Boolean(errors.surname)}
              helperText={errors.surname?.message}
              {...register("surname")}
            />

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

            <TextField
              required
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <PasswordVisibilityAdornment
                      visible={showPassword}
                      onToggle={() => setShowPassword((prev) => !prev)}
                    />
                  ),
                },
              }}
              {...register("password")}
            />

            <TextField
              required
              label="Confirmar contraseña"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repita su contraseña"
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

            <Controller
              name="data_privacy_consent"
              control={control}
              render={({ field }) => (
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.7 }}
                  >
                    Antes de aceptar, revise la{" "}
                    <Link
                      component={RouterLink}
                      to="/politica-privacidad"
                      underline="hover"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Politica de privacidad
                    </Link>{" "}
                    y los{" "}
                    <Link
                      component={RouterLink}
                      to="/terminos-uso"
                      underline="hover"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Terminos de uso
                    </Link>
                    .
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name={field.name}
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                      />
                    }
                    label="Acepto el tratamiento de datos personales"
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
            >
              {isRegisteringTeacher ? "Registrando..." : "Crear cuenta"}
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              ¿Ya recibió el correo?{" "}
              <Link
                component={RouterLink}
                to="/verify-account"
                underline="hover"
                color="secondary.dark"
              >
                Verificar cuenta
              </Link>
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              ¿Ya tiene cuenta?{" "}
              <Link
                component={RouterLink}
                to="/login"
                underline="hover"
                color="secondary.dark"
              >
                Inicie sesión
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

export default RegisterTeacherForm;
