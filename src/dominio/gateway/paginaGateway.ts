import { Pagina } from "../entidade/pagina";

export class SlugPaginaJaExisteErro extends Error {
  public constructor() {
    super("Slug de pagina ja cadastrado");
    this.name = "SlugPaginaJaExisteErro";
  }
}

export interface PaginaGateway {
  salvar(pagina: Pagina): Promise<void>;
  buscarPorId(id: string): Promise<Pagina | null>;
  buscarPorSlug(slug: string): Promise<Pagina | null>;
  listarPorUsuario(usuarioId: string): Promise<Pagina[]>;
  contarPorUsuario(usuarioId: string): Promise<number>;
  atualizar(pagina: Pagina, slugAnterior?: string): Promise<void>;
  excluir(pagina: Pagina): Promise<void>;
}
