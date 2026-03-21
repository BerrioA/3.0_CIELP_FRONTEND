import { z } from "zod";

export const registerTeacherSchema = z
  .object({
    given_name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(100, "El nombre no puede superar 100 caracteres."),
    surname: z
      .string()
      .trim()
      .min(2, "El apellido debe tener al menos 2 caracteres.")
      .max(100, "El apellido no puede superar 100 caracteres."),
    email: z
      .string()
      .trim()
      .min(1, "El correo es obligatorio.")
      .email("Ingrese un correo válido."),
    password: z
      .string()
      .trim()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(64, "La contraseña no puede superar 64 caracteres."),
    confirmPassword: z.string().trim(),
    data_privacy_consent: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden.",
      });
    }

    if (!values.data_privacy_consent) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["data_privacy_consent"],
        message: "Debes aceptar el tratamiento de datos para continuar.",
      });
    }
  });

export const registerTeacherDefaultValues = {
  given_name: "",
  surname: "",
  email: "",
  password: "",
  confirmPassword: "",
  data_privacy_consent: false,
};
