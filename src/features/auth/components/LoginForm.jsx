import { useState } from "react";
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
import { loginDefaultValues, loginSchema } from "../schemas/login.schema";
import { useAuthStore } from "../store/auth.store";

function LoginForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.authError);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaultValues,
    mode: "onChange",
  });

  const onSubmit = async (formValues) => {
    try {
      const result = await login({
        email: formValues.email,
        password: formValues.password,
        rememberSession: formValues.rememberSession,
      });

      if (!result.ok) {
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch {
      return;
    }
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
            Iniciar sesión
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Acceda con sus credenciales institucionales para continuar.
          </Typography>
        </Box>

        {authError ? <Alert severity="error">{authError}</Alert> : null}

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
              name="email"
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
              name="password"
              placeholder="Ingrese su contraseña"
              autoComplete="current-password"
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

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Controller
                name="rememberSession"
                control={control}
                render={({ field }) => (
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
                    label="Mantener sesión"
                  />
                )}
              />

              <Link
                component={RouterLink}
                to="/forgot-password"
                underline="hover"
                color="secondary.dark"
              >
                Olvidé mi contraseña
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!isValid || isSubmitting || isLoading}
            >
              {isLoading ? "Iniciando..." : "Entrar al sistema"}
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              ¿No tiene cuenta?{" "}
              <Link
                component={RouterLink}
                to="/registro-profesor"
                underline="hover"
                color="secondary.dark"
              >
                Regístrese aquí
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

export default LoginForm;
