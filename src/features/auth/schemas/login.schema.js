import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio.")
    .email("Ingrese un correo válido."),
  password: z
    .string()
    .trim()
    .min(1, "La contraseña es obligatoria.")
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
  rememberSession: z.boolean(),
});

export const loginDefaultValues = {
  email: "",
  password: "",
  rememberSession: true,
};
