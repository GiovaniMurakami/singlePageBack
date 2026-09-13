import { z } from "zod";
import { slugCampo, uuidCampo } from "./campos";

const tiposBloco = [
  "capa",
  "texto",
  "imagem",
  "botoes",
  "galeria",
  "depoimentos",
  "formulario",
  "divisor",
  "redes",
  "incorporar",
  "rodape",
  "navegacao",
  "secao",
  "icones",
  "grade",
  "cartoes",
  "faixa",
] as const;

export const cadastrarUsuarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(80, "Nome muito longo."),
  email: z.string().trim().email("Informe um e-mail válido.").max(160),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72),
});

export const loginUsuarioSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, "Refresh token inválido."),
});

export const temaPaginaSchema = z.object({
  fundo: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Cor de fundo inválida."),
  texto: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Cor de texto inválida."),
  destaque: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Cor de destaque inválida."),
  fonte: z.enum(["sans", "serif", "mono", "grotesk", "moderna", "editorial", "display", "poster", "script"]),
  alinhamento: z.enum(["esquerda", "centro", "direita", "justificado"]),
  orientacao: z.enum(["horizontal", "vertical"]).optional(),
  largura: z.enum(["estreita", "media", "larga", "completa"]),
}).passthrough();

export const blocoPaginaSchema = z.object({
  id: uuidCampo("id do bloco"),
  tipo: z.enum(tiposBloco),
  props: z.record(z.string(), z.unknown()),
});

export const criarPaginaSchema = z.object({
  titulo: z.string().trim().min(2, "Informe um título.").max(80),
  slug: slugCampo,
  tema: temaPaginaSchema.optional(),
  blocos: z.array(blocoPaginaSchema).max(40, "No máximo 40 blocos por página.").optional(),
});

export const atualizarPaginaSchema = z.object({
  titulo: z.string().trim().min(2).max(80).optional(),
  slug: slugCampo.optional(),
  tema: temaPaginaSchema.optional(),
  blocos: z.array(blocoPaginaSchema).max(40).optional(),
});

export const publicarPaginaSchema = z.object({
  publicada: z.boolean(),
});

export const eventoPaginaSchema = z.object({
  tipo: z.enum(["visita", "clique", "formulario"]),
  visitanteId: z.string().trim().max(80).optional(),
  alvo: z.string().trim().max(400).optional(),
  origem: z.string().trim().max(200).optional(),
  hora: z.number().int().min(0).max(23).optional(),
});

export const criarCheckoutSchema = z.object({
  plano: z.enum(["pro", "ultra"]),
});

export const uploadImagemSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
  tamanhoBytes: z.number().int().positive(),
});
