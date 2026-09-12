import { v4 as uuidv4 } from "uuid";

export type TipoBloco =
  | "capa"
  | "texto"
  | "imagem"
  | "botoes"
  | "galeria"
  | "depoimentos"
  | "formulario"
  | "divisor"
  | "redes"
  | "incorporar"
  | "rodape"
  | "navegacao"
  | "secao"
  | "icones"
  | "grade"
  | "cartoes"
  | "faixa";

export type BlocoPagina = {
  id: string;
  tipo: TipoBloco;
  props: Record<string, unknown>;
};

export type TemaPagina = {
  fundo: string;
  texto: string;
  destaque: string;
  fonte: "sans" | "serif" | "mono";
  alinhamento: "esquerda" | "centro";
  largura: "estreita" | "media" | "larga";
};

export const TEMA_PADRAO: TemaPagina = {
  fundo: "#f6f1ea",
  texto: "#1c1917",
  destaque: "#c2410c",
  fonte: "sans",
  alinhamento: "centro",
  largura: "media",
};

export interface PaginaProps {
  id: string;
  usuarioId: string;
  titulo: string;
  slug: string;
  publicada: boolean;
  tema: TemaPagina;
  blocos: BlocoPagina[];
  publicadoEm?: Date | null;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export class Pagina {
  public id: string;
  public usuarioId: string;
  public titulo: string;
  public slug: string;
  public publicada: boolean;
  public tema: TemaPagina;
  public blocos: BlocoPagina[];
  public publicadoEm: Date | null;
  public criadoEm: Date;
  public atualizadoEm: Date;

  constructor(props: PaginaProps) {
    this.id = props.id;
    this.usuarioId = props.usuarioId;
    this.titulo = props.titulo;
    this.slug = props.slug;
    this.publicada = props.publicada;
    this.tema = { ...TEMA_PADRAO, ...props.tema };
    this.blocos = props.blocos ?? [];
    this.publicadoEm = props.publicadoEm ?? null;
    this.criadoEm = props.criadoEm || new Date();
    this.atualizadoEm = props.atualizadoEm || new Date();
  }

  public static criar({
    usuarioId,
    titulo,
    slug,
    tema,
    blocos,
  }: Pick<PaginaProps, "usuarioId" | "titulo" | "slug"> & Partial<Pick<PaginaProps, "tema" | "blocos">>) {
    const agora = new Date();
    return new Pagina({
      id: uuidv4(),
      usuarioId,
      titulo: titulo.trim(),
      slug: slug.trim().toLowerCase(),
      publicada: false,
      tema: { ...TEMA_PADRAO, ...tema },
      blocos: blocos ?? [],
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }
}

export function criarBloco(tipo: TipoBloco, props: Record<string, unknown> = {}): BlocoPagina {
  return { id: uuidv4(), tipo, props };
}
