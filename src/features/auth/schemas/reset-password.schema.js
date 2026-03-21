import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .trim()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().trim().min(1, "Confirme la nueva contraseña."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const resetPasswordDefaultValues = {
  newPassword: "",
  confirmPassword: "",
};
