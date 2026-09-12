import { z } from "zod";

export const uuidCampo = (nome = "id") =>
  z.string().uuid(`${nome} deve ser um UUID válido.`);

export const slugCampo = z
  .string()
  .min(3, "O endereço precisa ter pelo menos 3 caracteres.")
  .max(48, "O endereço pode ter no máximo 48 caracteres.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens.");
