export type CodigoPlano = "free" | "pro" | "ultra";

export type DefinicaoPlano = {
  codigo: CodigoPlano;
  nome: string;
  descricao: string;
  precoMensalCentavos: number;
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
    precoMensalCentavos: 0,
    moeda: "brl",
    paginasMaximas: 1,
    removeMarca: false,
    dominioProprio: false,
    anuncios: true,
  },
  pro: {
    codigo: "pro",
    nome: "Pro",
    descricao: "Até 10 páginas, sem marca, sem anúncios e com formulários ilimitados.",
    precoMensalCentavos: 2900,
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
    descricao: "Até 50 páginas, domínio próprio e prioridade no suporte.",
    precoMensalCentavos: 7900,
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
  if ((statusAssinatura === "ativa" || statusAssinatura === "trial") && (plano === "pro" || plano === "ultra")) {
    return plano;
  }
  return "free";
}
