export type CodigoPlano = "free" | "pro" | "ultra";
export type PeriodoCobranca = "mes" | "ano";

export type DefinicaoPlano = {
  codigo: CodigoPlano;
  nome: string;
  descricao: string;
  /** Valor cobrado no período (centavos BRL). */
  precoCentavos: number;
  /** Compatível com o front antigo; espelha precoCentavos. */
  precoMensalCentavos: number;
  periodo: PeriodoCobranca;
  moeda: "brl";
  paginasMaximas: number;
  removeMarca: boolean;
  dominioProprio: boolean;
  anuncios: boolean;
  destaque?: boolean;
};

export const PLANOS: Record<CodigoPlano, DefinicaoPlano> = {
  free: {
    codigo: "free",
    nome: "Free",
    descricao: "Uma página. Anúncios na página publicada, que sustentam o Single.",
    precoCentavos: 0,
    precoMensalCentavos: 0,
    periodo: "mes",
    moeda: "brl",
    paginasMaximas: 1,
    removeMarca: false,
    dominioProprio: false,
    anuncios: true,
  },
  pro: {
    codigo: "pro",
    nome: "Pro",
    descricao: "Até 10 páginas no domínio singlepage.com.br, sem marca, sem anúncios e com formulários ilimitados.",
    precoCentavos: 990,
    precoMensalCentavos: 990,
    periodo: "mes",
    moeda: "brl",
    paginasMaximas: 10,
    removeMarca: true,
    dominioProprio: false,
    anuncios: false,
    destaque: true,
  },
  ultra: {
    codigo: "ultra",
    nome: "Ultra",
    descricao: "Até 50 páginas, domínio personalizável e prioridade no suporte.",
    precoCentavos: 4990,
    precoMensalCentavos: 4990,
    periodo: "mes",
    moeda: "brl",
    paginasMaximas: 50,
    removeMarca: true,
    dominioProprio: true,
    anuncios: false,
  },
};

export function listarPlanosPublicos(): DefinicaoPlano[] {
  return [PLANOS.free, PLANOS.pro, PLANOS.ultra];
}

export function obterPlano(codigo: string | undefined | null): DefinicaoPlano {
  if (codigo === "pro" || codigo === "ultra") return PLANOS[codigo];
  return PLANOS.free;
}

export function planoAtivoDeAssinatura(
  plano: string | undefined,
  statusAssinatura: string | undefined
): CodigoPlano {
  if (plano !== "pro" && plano !== "ultra") return "free";
  if (statusAssinatura === "cancelada") return "free";
  return plano;
}
