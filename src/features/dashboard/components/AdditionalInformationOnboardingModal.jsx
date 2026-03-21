import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  additionalInformationDefaultValues,
  additionalInformationSchema,
} from "../schemas/additional-information.schema";
import { useDashboardUsersStore } from "../store/dashboard-users.store";

function AdditionalInformationOnboardingModal({ open, onClose }) {
  const registerAdditionalInformation = useDashboardUsersStore(
    (state) => state.registerAdditionalInformation,
  );
  const isRegisteringAdditionalInformation = useDashboardUsersStore(
    (state) => state.isRegisteringAdditionalInformation,
  );
  const registerAdditionalInformationError = useDashboardUsersStore(
    (state) => state.registerAdditionalInformationError,
  );
  const clearAdditionalInformationStatus = useDashboardUsersStore(
    (state) => state.clearAdditionalInformationStatus,
  );
  const markAdditionalInformationCompleted = useAuthStore(
    (state) => state.markAdditionalInformationCompleted,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm({
    mode: "onChange",
    resolver: zodResolver(additionalInformationSchema),
    defaultValues: additionalInformationDefaultValues,
  });

  useEffect(() => {
    if (open) {
      clearAdditionalInformationStatus();
      return;
    }

    reset(additionalInformationDefaultValues);
  }, [clearAdditionalInformationStatus, open, reset]);

  const onSubmit = async (values) => {
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
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") {
          return;
        }

        onClose();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Complete su información adicional</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.8}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Este paso respalda el proceso institucional. Puede cerrarlo por
            ahora, pero seguirá apareciendo al iniciar sesión hasta completar
            sus datos.
          </Typography>

          {registerAdditionalInformationError ? (
            <Alert severity="error">{registerAdditionalInformationError}</Alert>
          ) : null}

          <TextField
            required
            label="Número de documento"
            error={Boolean(errors.document_number)}
            helperText={errors.document_number?.message}
            {...register("document_number")}
          />

          <TextField
            required
            label="Teléfono"
            error={Boolean(errors.phone)}
            helperText={errors.phone?.message}
            {...register("phone")}
          />

          <TextField
            required
            label="Fecha de nacimiento"
            type="date"
            InputLabelProps={{ shrink: true }}
            error={Boolean(errors.date_of_birth)}
            helperText={errors.date_of_birth?.message}
            {...register("date_of_birth")}
          />

          <TextField
            required
            select
            label="Género"
            error={Boolean(errors.sex)}
            helperText={errors.sex?.message}
            defaultValue=""
            {...register("sex")}
          >
            <MenuItem value="F">Femenino</MenuItem>
            <MenuItem value="M">Masculino</MenuItem>
            <MenuItem value="other">Otro</MenuItem>
          </TextField>

          <TextField
            label="Dirección"
            error={Boolean(errors.address)}
            helperText={errors.address?.message}
            {...register("address")}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isRegisteringAdditionalInformation || isSubmitting}
        >
          Cerrar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={
            !isValid || isRegisteringAdditionalInformation || isSubmitting
          }
        >
          {isRegisteringAdditionalInformation ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AdditionalInformationOnboardingModal;
