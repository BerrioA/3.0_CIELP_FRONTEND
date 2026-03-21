import { z } from "zod";

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .trim()
      .min(1, "La contraseña actual es obligatoria."),
    newPassword: z
      .string()
      .trim()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
      .max(64, "La nueva contraseña no puede superar 64 caracteres."),
    confirmNewPassword: z
      .string()
      .trim()
      .min(1, "Debe confirmar la nueva contraseña."),
  })
  .superRefine((values, context) => {
    if (values.oldPassword === values.newPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "La nueva contraseña debe ser diferente a la actual.",
      });
    }

    if (values.newPassword !== values.confirmNewPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmNewPassword"],
        message: "Las contraseñas no coinciden.",
      });
    }
  });

export const changePasswordDefaultValues = {
  oldPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};
