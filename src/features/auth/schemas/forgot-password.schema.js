import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio.")
    .email("Ingrese un correo válido."),
});

export const forgotPasswordDefaultValues = {
  email: "",
};
