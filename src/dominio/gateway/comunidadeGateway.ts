export type ItemComunidade = {
  paginaId: string;
  slug: string;
  titulo: string;
  autorId: string;
  autorNome: string;
  temaFundo: string;
  temaDestaque: string;
  capaUrl: string | null;
  publicadoEm: string | null;
  atualizadoEm: string;
  curtidas: number;
};

export interface ComunidadeGateway {
  listarPublicadas(): Promise<Omit<ItemComunidade, "autorNome" | "curtidas">[]>;
  obterTotaisCurtidas(paginaIds: string[]): Promise<Record<string, number>>;
  listarCurtidasDoUsuario(usuarioId: string, paginaIds: string[]): Promise<Set<string>>;
  curtiu(paginaId: string, usuarioId: string): Promise<boolean>;
  curtir(paginaId: string, usuarioId: string): Promise<number>;
  descurtir(paginaId: string, usuarioId: string): Promise<number>;
}
