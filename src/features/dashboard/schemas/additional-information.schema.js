import { z } from "zod";

export const additionalInformationSchema = z.object({
  document_number: z
    .string()
    .trim()
    .min(4, "El número de documento debe tener al menos 4 caracteres."),
  phone: z
    .string()
    .trim()
    .min(7, "El teléfono debe tener al menos 7 caracteres."),
  date_of_birth: z
    .string()
    .trim()
    .min(1, "La fecha de nacimiento es obligatoria."),
  sex: z.string().trim().min(1, "El género es obligatorio."),
  address: z.string().trim().optional(),
});

export const additionalInformationDefaultValues = {
  document_number: "",
  phone: "",
  date_of_birth: "",
  sex: "",
  address: "",
};
